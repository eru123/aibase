<?php

declare(strict_types=1);

namespace Api\Services;

use Api\Models\UserOtp;
use Api\Models\OtpMethod;

/**
 * OTP Service for 2FA
 */
class OtpService
{
    private SmtpService $smtp;
    private SmsService $sms;
    private AuthenticatorService $authenticator;
    private const OTP_LENGTH = 6;
    private const OTP_EXPIRY = 600; // 10 minutes

    public function __construct(
        SmtpService $smtp,
        SmsService $sms,
        AuthenticatorService $authenticator
    ) {
        $this->smtp = $smtp;
        $this->sms = $sms;
        $this->authenticator = $authenticator;
    }

    /**
     * Generate numeric OTP code
     */
    public function generateCode(int $length = self::OTP_LENGTH): string
    {
        $max = (10 ** $length) - 1;
        $min = 10 ** ($length - 1);
        return str_pad((string)random_int($min, $max), $length, '0', STR_PAD_LEFT);
    }

    /**
     * Send OTP to user via their configured method
     */
    public function send(int $userId, string $email, ?string $phone = null): array
    {
        $code = $this->generateCode();
        $expiry = time() + self::OTP_EXPIRY;

        // Store OTP in session or cache (using $_SESSION for simplicity)
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION['otp_' . $userId] = [
            'code' => password_hash($code, PASSWORD_DEFAULT),
            'expiry' => $expiry,
            'attempts' => 0
        ];

        // Get user's preferred OTP method
        $userOtp = UserOtp::query()
            ->where('user_id', $userId)
            ->where('enabled', 1)
            ->first();

        if (!$userOtp) {
            // Default to email if no method configured
            $emailService = ServiceContainer::getInstance()->get('email');
            $sent = $emailService->sendOTP($email, $code, 10);
            return ['method' => 'email', 'sent' => $sent];
        }

        /**
         * @var OtpMethod|null $method
         */
        $method = OtpMethod::find($userOtp['otp_method_id']);

        if (!$method) {
            return ['method' => 'none', 'sent' => false, 'error' => 'OTP method not found'];
        }

        $sent = match ($method['type']) {
            'email' => (function() use ($email, $code) {
                $emailService = ServiceContainer::getInstance()->get('email');
                return $emailService->sendOTP($email, $code, 10);
            })(),
            'sms' => $phone ? $this->sms->sendOtp($phone, $code) : false,
            'authenticator' => true, // User uses their authenticator app
            default => false
        };

        return [
            'method' => $method['type'],
            'sent' => $sent
        ];
    }

    /**
     * Verify OTP code
     */
    public function verify(int $userId, string $code): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Check if it's authenticator OTP
        $userOtp = UserOtp::query()
            ->where('user_id', $userId)
            ->where('enabled', 1)
            ->first();

        if ($userOtp) {
            /**
             * @var OtpMethod|null $method
             */
            $method = OtpMethod::find($userOtp['otp_method_id']);

            if ($method && $method['type'] === 'authenticator') {
                return $this->authenticator->verify($userOtp['secret'], $code);
            }
        }

        $key = 'otp_' . $userId;

        if (!isset($_SESSION[$key])) {
            return false;
        }

        $otpData = $_SESSION[$key];

        // Check expiry
        if (time() > $otpData['expiry']) {
            unset($_SESSION[$key]);
            return false;
        }

        // Check attempts
        if ($otpData['attempts'] >= 5) {
            unset($_SESSION[$key]);
            return false;
        }

        // Increment attempts
        $_SESSION[$key]['attempts']++;

        // Verify regular OTP
        $valid = password_verify($code, $otpData['code']);

        if ($valid) {
            unset($_SESSION[$key]);
        }

        return $valid;
    }

    /**
     * Enable authenticator for user
     */
    public function enableAuthenticator(int $userId, int $otpMethodId): array
    {
        $secret = $this->authenticator->generateSecret();

        $userOtp = UserOtp::query()
            ->where('user_id', $userId)
            ->where('otp_method_id', $otpMethodId)
            ->first();

        if ($userOtp) {
            UserOtp::query()
                ->where('id', $userOtp['id'])
                ->update([
                    'secret' => $secret,
                    'enabled' => 0 // Will be enabled after verification
                ]);
        } else {
            UserOtp::create([
                'user_id' => $userId,
                'otp_method_id' => $otpMethodId,
                'secret' => $secret,
                'enabled' => 0
            ]);
        }

        $provisioningUri = $this->authenticator->getProvisioningUri($secret, "user_$userId");

        return [
            'secret' => $secret,
            'qr_code_data_url' => $this->authenticator->getQrCodeDataUrl($provisioningUri),
            'provisioning_uri' => $provisioningUri
        ];
    }

    /**
     * Verify and enable authenticator
     */
    public function verifyAndEnableAuthenticator(int $userId, string $code): bool
    {
        $userOtp = UserOtp::query()
            ->where('user_id', $userId)
            ->where('enabled', 0)
            ->first();

        if (!$userOtp || !$userOtp['secret']) {
            return false;
        }

        $valid = $this->authenticator->verify($userOtp['secret'], $code);

        if ($valid) {
            // Disable other OTP methods
            UserOtp::query()
                ->where('user_id', $userId)
                ->update(['enabled' => 0]);

            // Enable this authenticator
            UserOtp::query()
                ->where('id', $userOtp['id'])
                ->update(['enabled' => 1]);
        }

        return $valid;
    }

    /**
     * Disable OTP for user
     */
    public function disable(int $userId): bool
    {
        UserOtp::query()
            ->where('user_id', $userId)
            ->update(['enabled' => 0]);

        return true;
    }

    /**
     * Check if user has OTP enabled
     */
    public function isEnabled(int $userId): bool
    {
        $userOtp = UserOtp::query()
            ->where('user_id', $userId)
            ->where('enabled', 1)
            ->first();

        return $userOtp !== null;
    }

    /**
     * Get user's OTP method
     */
    public function getUserMethod(int $userId): ?array
    {
        $userOtp = UserOtp::query()
            ->where('user_id', $userId)
            ->where('enabled', 1)
            ->first();

        if (!$userOtp) {
            return null;
        }

        /**
         * @var OtpMethod|null $method
         */
        $method = OtpMethod::find($userOtp['otp_method_id']);

        return $method ? [
            'id' => $method['id'],
            'name' => $method['name'],
            'type' => $method['type']
        ] : null;
    }
}
