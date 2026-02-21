<?php

declare(strict_types=1);

namespace Api\Services;

use Api\Models\SystemSetting;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

/**
 * SMTP Email Service
 */
class SmtpService
{
    private ?string $host = null;
    private ?int $port = null;
    private ?string $username = null;
    private ?string $password = null;
    private ?string $encryption = null;
    private ?string $fromEmail = null;
    private ?string $fromName = null;
    private bool $useMail = false;
    private bool $useSes = false;
    private bool $useSmtp = true;

    public function __construct()
    {
        $this->useMail = $this->readEnvBool('SMTP_MAIL', false);
        $this->loadSettings();
        $this->applyEnvFallbacks();
        if ($this->useSes || $this->useMail) {
            $this->useSmtp = false;
        }
        if ($this->useMail) {
            $this->useSes = false;
        }
    }

    private function loadSettings(): void
    {
        try {
            $settings = SystemSetting::query()
                ->whereRaw("`key` IN ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption', 'smtp_from_email', 'smtp_from_name', 'smtp_ses', 'smtp_mail')")
                ->get();
        } catch (\PDOException $e) {
            // During initial setup the table might not exist yet; fail closed without SMTP
            error_log('SMTP settings unavailable: ' . $e->getMessage());
            return;
        }

        foreach ($settings as $setting) {
            match ($setting['key']) {
                'smtp_host' => $this->host = $setting['value'],
                'smtp_port' => $this->port = (int)$setting['value'],
                'smtp_username' => $this->username = $setting['value'],
                'smtp_password' => $this->password = $setting['value'],
                'smtp_encryption' => $this->encryption = $setting['value'],
                'smtp_from_email' => $this->fromEmail = $setting['value'],
                'smtp_from_name' => $this->fromName = $setting['value'],
                'smtp_ses' => $this->useSes = SystemSetting::castBool($setting['value'], false),
                'smtp_mail' => $this->useMail = SystemSetting::castBool($setting['value'], false),
                default => null
            };
        }
    }

    private function applyEnvFallbacks(): void
    {
        $this->host ??= $this->readEnv('SMTP_HOST');
        $this->port ??= $this->readEnvInt('SMTP_PORT');
        $this->username ??= $this->readEnv('SMTP_USER');
        $this->password ??= $this->readEnv('SMTP_PASS');
        $this->encryption ??= $this->normalizeEncryption($this->readEnv('SMTP_SECURE'));
        $this->fromName ??= $this->readEnv('SMTP_SENDER_NAME');
        $this->fromEmail ??= $this->readEnv('SMTP_SENDER_EMAIL');
    }

    /**
     * Send an email
     */
    public function send(string $to, string $subject, string $body, ?string $toName = null): bool
    {
        return $this->sendMessage(
            [['email' => $to, 'name' => $toName]],
            $subject,
            $body
        );
    }

    /**
     * Send an email to multiple recipients with optional attachments
     *
     * @param array<int, array{email: string, name?: string}> $recipients
     * @param array{
     *   attachments?: array<int, array{path: string, name?: string, mime?: string}>,
     *   reply_to?: string,
     *   reply_to_name?: string,
     *   from_email?: string,
     *   from_name?: string,
     *   alt_body?: string,
     *   cc?: array<int, array{email: string, name?: string}>,
     *   bcc?: array<int, array{email: string, name?: string}>
     * } $options
     */
    public function sendMessage(array $recipients, string $subject, string $body, array $options = []): bool
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('SMTP is not configured');
        }

        if (empty($recipients)) {
            throw new \RuntimeException('Email recipients list is empty');
        }

        $mail = new PHPMailer(true);
        $mail->CharSet = 'UTF-8';
        $mail->isHTML(true);

        if ($this->useMail) {
            $mail->isMail();
        } else {
            $mail->isSMTP();
            $mail->Host = (string) $this->host;
            $mail->Port = (int) $this->port;
            $mail->SMTPAuth = $this->username !== null && $this->password !== null;
            if ($mail->SMTPAuth) {
                $mail->Username = (string) $this->username;
                $mail->Password = (string) $this->password;
            }

            if ($this->encryption === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->SMTPAutoTLS = true;
            } elseif ($this->encryption === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                $mail->SMTPAutoTLS = false;
            } else {
                $mail->SMTPSecure = false;
                $mail->SMTPAutoTLS = false;
            }
        }

        $fromEmail = $options['from_email'] ?? $this->fromEmail;
        $fromName = $options['from_name'] ?? $this->fromName ?? '';
        $mail->setFrom((string) $fromEmail, $fromName);

        if (!empty($options['reply_to'])) {
            $mail->addReplyTo((string) $options['reply_to'], (string) ($options['reply_to_name'] ?? ''));
        }

        foreach ($recipients as $recipient) {
            $mail->addAddress((string) $recipient['email'], (string) ($recipient['name'] ?? ''));
        }

        foreach (($options['cc'] ?? []) as $recipient) {
            $mail->addCC((string) $recipient['email'], (string) ($recipient['name'] ?? ''));
        }

        foreach (($options['bcc'] ?? []) as $recipient) {
            $mail->addBCC((string) $recipient['email'], (string) ($recipient['name'] ?? ''));
        }

        foreach (($options['attachments'] ?? []) as $attachment) {
            $path = $attachment['path'] ?? null;
            if (!$path || !is_file($path)) {
                continue;
            }
            $name = $attachment['name'] ?? '';
            $mime = $attachment['mime'] ?? '';
            $mail->addAttachment($path, $name, PHPMailer::ENCODING_BASE64, $mime);
        }

        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->AltBody = isset($options['alt_body'])
            ? (string) $options['alt_body']
            : trim(strip_tags($body));

        return $mail->send();
    }

    private function isConfigured(): bool
    {
        if ($this->useMail) {
            return $this->fromEmail !== null;
        }

        return $this->host !== null
            && $this->port !== null
            && $this->fromEmail !== null;
    }

    private function readEnv(string $key): ?string
    {
        $value = $_ENV[$key] ?? getenv($key);
        if ($value === false || $value === null) {
            return null;
        }
        $trimmed = trim((string) $value);
        return $trimmed === '' ? null : $trimmed;
    }

    private function readEnvInt(string $key): ?int
    {
        $value = $this->readEnv($key);
        if ($value === null || !is_numeric($value)) {
            return null;
        }
        return (int) $value;
    }

    private function readEnvBool(string $key, bool $default = false): bool
    {
        $value = $_ENV[$key] ?? getenv($key);
        return SystemSetting::castBool($value, $default);
    }

    private function normalizeEncryption(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $lower = strtolower(trim($value));
        if (in_array($lower, ['tls', 'ssl'], true)) {
            return $lower;
        }
        if (SystemSetting::castBool($lower, false)) {
            return 'ssl';
        }
        return null;
    }
}
