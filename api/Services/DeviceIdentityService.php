<?php

declare(strict_types=1);

namespace Api\Services;

use Api\Models\DeviceVerification;

/**
 * Device Identity Service for device fingerprinting and verification
 */
class DeviceIdentityService
{
    private EmailService $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Generate device hash from request data
     */
    public function generateDeviceHash(string $userAgent, string $ipAddress): string
    {
        // Create a fingerprint from user agent and IP
        // In production, you might want to include more data like screen resolution, timezone, etc.
        return hash('sha256', $userAgent . '|' . $ipAddress);
    }

    /**
     * Check if device is verified for user
     */
    public function isDeviceVerified(int $userId, string $deviceHash): bool
    {
        $device = DeviceVerification::query()
            ->where('user_id', $userId)
            ->where('device_fingerprint', $deviceHash)
            ->where('is_verified', 1)
            ->first();

        return $device !== null;
    }

    /**
     * Get or create device identity
     * Returns array (from query()->first()) or DeviceVerification instance (from create())
     */
    public function getOrCreateDevice(int $userId, string $deviceHash)
    {
        $device = DeviceVerification::query()
            ->where('user_id', $userId)
            ->where('device_fingerprint', $deviceHash)
            ->first();

        if ($device) {
            return $device; // Returns array
        }

        // Create new device with UUID
        $token = bin2hex(random_bytes(32));
        $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $device = DeviceVerification::create([
            'id' => $uuid,
            'user_id' => $userId,
            'device_fingerprint' => $deviceHash,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'is_verified' => 0,
            'is_trusted' => 0,
            'verification_token' => $token,
            'verification_token_expiry' => gmdate('Y-m-d H:i:s', time() + 86400), // 24 hours
            'verification_method' => 'email'
        ]);
        
        return $device;
    }

    /**
     * Send device verification email
     */
    public function sendVerificationEmail(int $userId, string $email, string $deviceInfo): bool
    {
        $device = DeviceVerification::query()
            ->where('user_id', $userId)
            ->where('is_verified', 0)
            ->orderBy('created_at', 'DESC')
            ->first();

        if (!$device || !$device['verification_token']) {
            return false;
        }

        return $this->emailService->sendDeviceVerification(
            $email,
            $device['verification_token'],
            $deviceInfo
        );
    }

    /**
     * Verify device with token
     */
    public function verifyDevice(string $token): bool
    {
        $device = DeviceVerification::query()
            ->where('verification_token', $token)
            ->where('is_verified', 0)
            ->first();

        if (!$device) {
            return false;
        }

        // Check token expiry
        if ($device['verification_token_expiry'] && strtotime($device['verification_token_expiry']) < time()) {
            return false;
        }

        DeviceVerification::query()
            ->where('id', $device['id'])
            ->update([
                'is_verified' => 1,
                'verified_at' => gmdate('Y-m-d H:i:s'),
                'verification_token' => null,
                'verification_token_expiry' => null
            ]);

        return true;
    }

    /**
     * Automatically verify device (for trusted scenarios)
     */
    public function autoVerifyDevice(int $userId, string $deviceHash): bool
    {
        $device = DeviceVerification::query()
            ->where('user_id', $userId)
            ->where('device_fingerprint', $deviceHash)
            ->first();

        if (!$device) {
            return false;
        }

        DeviceVerification::query()
            ->where('id', $device['id'])
            ->update([
                'is_verified' => 1,
                'is_trusted' => 1,
                'verified_at' => gmdate('Y-m-d H:i:s'),
                'verification_token' => null,
                'verification_token_expiry' => null
            ]);

        return true;
    }

    /**
     * Get all user devices
     */
    public function getUserDevices(int $userId): array
    {
        return DeviceVerification::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    /**
     * Remove device
     */
    public function removeDevice(int $userId, string $deviceId): bool
    {
        $deleted = DeviceVerification::query()
            ->where('id', $deviceId)
            ->where('user_id', $userId)
            ->delete();

        return $deleted > 0;
    }

    /**
     * Count verified devices for user
     */
    public function countVerifiedDevices(int $userId): int
    {
        $devices = DeviceVerification::query()
            ->where('user_id', $userId)
            ->where('is_verified', 1)
            ->get();

        return count($devices);
    }

    /**
     * Check if this is the first device
     */
    public function isFirstDevice(int $userId): bool
    {
        return $this->countVerifiedDevices($userId) === 0;
    }
}
