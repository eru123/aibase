<?php

declare(strict_types = 1)
;

namespace Api\Services;

use Api\Models\EmailTemplate;
use Api\Models\ErrorLog;
use Api\Models\SystemSetting;

final class EmailService
{
    private SmtpService $smtp;
    private TemplateRenderer $renderer;

    private const TEMPLATE_OTP = 'otp';
    private const TEMPLATE_DEVICE_VERIFICATION = 'device_verification';
    private const TEMPLATE_INVITATION = 'user_invitation';
    private const TEMPLATE_EMAIL_VERIFICATION = 'email_verification';
    private const TEMPLATE_PASSWORD_RESET = 'password_reset';
    private const TEMPLATE_ACCOUNT_PENDING = 'account_pending_approval';
    private const TEMPLATE_ACCOUNT_APPROVED = 'account_approved';
    private const TEMPLATE_ACCOUNT_REJECTED = 'account_rejected';

    public function __construct(SmtpService $smtp, TemplateRenderer $renderer)
    {
        $this->smtp = $smtp;
        $this->renderer = $renderer;
    }

    public function sendOTP(string $to, string $otp, int $expiryMinutes = 10, ?string $userName = null): bool
    {
        return $this->sendTemplate(self::TEMPLATE_OTP, $to, [
            'otpCode' => $otp,
            'expiryMinutes' => $expiryMinutes,
            'userName' => $userName,
        ]);
    }

    public function sendDeviceVerification(string $to, string $verificationToken, string $deviceInfo): bool
    {
        $verificationUrl = $this->appUrl('/auth/verify-device?token=' . urlencode($verificationToken));

        return $this->sendTemplate(self::TEMPLATE_DEVICE_VERIFICATION, $to, [
            'deviceInfo' => $deviceInfo,
            'verificationUrl' => $verificationUrl,
        ]);
    }

    public function sendInvitation(string $to, string $inviteUrl, ?string $inviterName = null): bool
    {
        $inviterText = $inviterName ?: 'an administrator';

        // breakdown to, name <mail@domain.com>
        $toName = preg_match('/^(.*)<(.*)>$/', $to, $matches) ? trim($matches[1]) : $to;
        $toAddress = preg_match('/^(.*)<(.*)>$/', $to, $matches) ? trim($matches[2]) : $to;

        return $this->sendTemplate(self::TEMPLATE_INVITATION, $toAddress, [
            'inviterText' => $inviterText,
            'inviteUrl' => $inviteUrl,
        ], [
            'to_name' => $toName,
        ]);
    }

    public function sendEmailVerification(string $to, string $verificationUrl): bool
    {
        return $this->sendTemplate(self::TEMPLATE_EMAIL_VERIFICATION, $to, [
            'verificationUrl' => $verificationUrl,
        ]);
    }

    public function sendPasswordReset(string $to, string $resetUrl): bool
    {
        return $this->sendTemplate(self::TEMPLATE_PASSWORD_RESET, $to, [
            'resetUrl' => $resetUrl,
        ]);
    }

    public function sendAccountPendingApproval(string $to, ?string $userName = null): bool
    {
        return $this->sendTemplate(self::TEMPLATE_ACCOUNT_PENDING, $to, [
            'userName' => $userName,
        ]);
    }

    public function sendAccountApproved(string $to, ?string $userName = null): bool
    {
        return $this->sendTemplate(self::TEMPLATE_ACCOUNT_APPROVED, $to, [
            'userName' => $userName,
        ]);
    }

    public function sendAccountRejected(string $to, ?string $userName = null): bool
    {
        return $this->sendTemplate(self::TEMPLATE_ACCOUNT_REJECTED, $to, [
            'userName' => $userName,
        ]);
    }

    public function send(string $to, string $subject, string $body): bool
    {
        return $this->safely(fn() => $this->smtp->send($to, $subject, $body));
    }

    /**
     * Send an email to multiple recipients with optional attachments
     *
     * @param array<int, array{email: string, name?: string}> $recipients
     */
    public function sendMessage(array $recipients, string $subject, string $body, array $options = []): bool
    {
        return $this->safely(fn() => $this->smtp->sendMessage($recipients, $subject, $body, $options));
    }

    /**
     * @param array<string, mixed> $data
     * @param array<string, mixed> $options
     */
    private function sendTemplate(string $templateName, string $to, array $data, array $options = []): bool
    {
        return $this->safely(function () use ($templateName, $to, $data, $options): bool {
            $template = EmailTemplate::getByName($templateName);
            if (!$template) {
                error_log("Email template not found: {$templateName}");
                return false;
            }
            if (isset($template['is_active']) && (int)$template['is_active'] !== 1) {
                error_log("Email template disabled: {$templateName}");
                return false;
            }

            $subjectTemplate = (string)($template['subject'] ?? '');
            $htmlTemplate = (string)($template['body_html'] ?? '');
            $textTemplate = isset($template['body_text']) && $template['body_text'] !== ''
                ? (string)$template['body_text']
                : null;

            $renderData = array_merge($this->getBaseTemplateData(), $data);

            $subject = $this->renderer->render($subjectTemplate, $renderData);
            $html = $this->renderer->render($htmlTemplate, $renderData);
            $altBody = $textTemplate !== null ? $this->renderer->render($textTemplate, $renderData) : null;

            $toName = $options['to_name'] ?? null;
            unset($options['to_name']);

            if ($altBody !== null && $altBody !== '') {
                $options['alt_body'] = $altBody;
            }

            return $this->smtp->sendMessage(
            [['email' => $to, 'name' => $toName]],
                $subject,
                $html,
                $options
            );
        });
    }

    private function appUrl(string $uri = ''): string
    {
        $VITE_APP_URL = $_ENV['VITE_APP_URL'] ?: getenv('VITE_APP_URL');
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['SERVER_PORT'] ?? null) == 443) ? 'https://' : 'http://';
        $host = $VITE_APP_URL ?: ($_SERVER['HTTP_HOST'] ?? 'localhost');

        // make sure host has no protocol prefix
        $host = preg_replace('#^https?://#', '', (string)$host);
        $base = rtrim(rtrim($protocol . $host, '/') . '/' . ltrim($uri, '/'), '/');

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    private function getBaseTemplateData(): array
    {
        $companyName = SystemSetting::getValue('company_name');
        if (!is_string($companyName) || trim($companyName) === '') {
            $companyName = $this->readEnv('COMPANY_NAME')
                ?? $this->readEnv('APP_NAME')
                ?? $this->fallbackCompanyName();
        }

        $logoUrl = SystemSetting::getValue('company_logo_url');
        if (!is_string($logoUrl) || trim($logoUrl) === '') {
            $logoUrl = $this->readEnv('COMPANY_LOGO_URL')
                ?? $this->readEnv('EMAIL_LOGO_URL');
        }

        $companyEmail = SystemSetting::getValue('company_email');
        $companyPhone = SystemSetting::getValue('company_phone');
        $companyWebsite = SystemSetting::getValue('company_website');
        $companyAddress = SystemSetting::getValue('company_address');
        $appUrl = $this->appUrl('/');
        $loginUrl = $this->appUrl('/login');

        return [
            'companyName' => $companyName ?: 'OpenSys',
            'currentYear' => (int)gmdate('Y'),
            'logoUrl' => $logoUrl ?: null,
            'companyEmail' => $this->normalizeOptionalString($companyEmail),
            'companyPhone' => $this->normalizeOptionalString($companyPhone),
            'companyWebsite' => $this->normalizeOptionalString($companyWebsite),
            'companyAddress' => $this->normalizeOptionalString($companyAddress),
            'appUrl' => $appUrl,
            'loginUrl' => $loginUrl,
        ];
    }

    private function fallbackCompanyName(): string
    {
        $host = parse_url($this->appUrl('/'), PHP_URL_HOST);
        if (is_string($host) && $host !== '') {
            $label = explode('.', $host)[0] ?? $host;
            $label = trim((string)$label);
            if ($label !== '') {
                return ucfirst($label);
            }
        }

        return 'OpenSys';
    }

    private function readEnv(string $key): ?string
    {
        $value = $_ENV[$key] ?? getenv($key);
        if ($value === false || $value === null) {
            return null;
        }
        $trimmed = trim((string)$value);
        return $trimmed === '' ? null : $trimmed;
    }

    private function normalizeOptionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $trimmed = trim($value);
        return $trimmed === '' ? null : $trimmed;
    }

    private function safely(callable $callback): bool
    {
        if (!SystemSetting::getBool('allow_mail_sending', false)) {
            error_log('Email sending is disabled by system settings.');
            return false;
        }

        try {
            return (bool)$callback();
        }
        catch (\Throwable $e) {
            error_log('Email send failed: ' . $e->getMessage());

            // Log to error_logs table
            try {
                $errorData = [
                    'type' => 'email_send_failure',
                    'error' => [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTraceAsString(),
                    ],
                ];

                // Include MySQL query history when debug is enabled
                if (SystemSetting::getBool('debug_enabled', false)) {
                    $errorData['mysql'] = (new \Api\Models\BaseModel())->getHistory();
                }

                ErrorLog::capture($errorData);
            }
            catch (\Throwable $logEx) {
                error_log('Failed to write error log: ' . $logEx->getMessage());
            }

            return false;
        }
    }
}
