<?php

declare(strict_types = 1)
;

namespace Api\Models;

use Api\Models\BaseModel;

class DeviceVerification extends BaseModel
{
    protected static string $table = 'device_verifications';
    protected static string $primaryKey = 'id';

    protected array $fillable = [
        'id',
        'user_id',
        'device_fingerprint',
        'user_agent',
        'ip_address',
        'location',
        'is_verified',
        'is_trusted',
        'verification_token',
        'verification_token_expiry',
        'verified_at',
        'verification_method',
        'failed_attempts',
        'last_login_at',
        'expires_at'
    ];

    /**
     * Find device verification by user ID and device fingerprint
     */
    public static function findByUserAndDevice(int $userId, string $deviceFingerprint): ?array
    {
        return static::query()
            ->where('user_id', $userId)
            ->where('device_fingerprint', $deviceFingerprint)
            ->first();
    }

    /**
     * Find verified and trusted device
     */
    public static function findTrustedDevice(int $userId, string $deviceFingerprint): ?array
    {
        return static::query()
            ->where('user_id', $userId)
            ->where('device_fingerprint', $deviceFingerprint)
            ->where('is_verified', true)
            ->where('is_trusted', true)
            ->first();
    }

    /**
     * Find device by verification token
     */
    public static function findByVerificationToken(string $token): ?array
    {
        return static::query()
            ->where('verification_token', $token)
            ->where('verification_token_expiry', '>', date('Y-m-d H:i:s'))
            ->first();
    }

    /**
     * Get all trusted devices for a user
     */
    public static function getTrustedDevices(int $userId): array
    {
        return static::query()
            ->where('user_id', $userId)
            ->where('is_trusted', true)
            ->orderBy('last_login_at', 'DESC')
            ->get();
    }

    /**
     * Mark device as verified
     */
    public static function markAsVerified(string $id): bool
    {
        return !!static::query()
            ->where('id', $id)
            ->update([
            'is_verified' => true,
            'is_trusted' => true,
            'verified_at' => date('Y-m-d H:i:s'),
            'verification_token' => null,
            'verification_token_expiry' => null,
            'failed_attempts' => 0
        ]);
    }

    /**
     * Update last login time
     */
    public static function updateLastLogin(string $id): bool
    {
        return !!static::query()
            ->where('id', $id)
            ->update([
            'last_login_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Increment failed attempts
     */
    public static function incrementFailedAttempts(string $id): bool
    {
        /** @var static|null $device */
        $device = static::find($id);
        if (!$device) {
            return false;
        }

        $failedAttempts = ($device['failed_attempts'] ?? 0) + 1;

        return !!static::query()
            ->where('id', $id)
            ->update([
            'failed_attempts' => $failedAttempts
        ]);
    }

    /**
     * Remove expired devices
     */
    public static function removeExpiredDevices(): int
    {
        $result = static::query()
            ->where('expires_at', '<', date('Y-m-d H:i:s'))
            ->delete();

        return $result ? 1 : 0;
    }

    /**
     * Revoke device trust
     */
    public static function revokeTrust(string $id): bool
    {
        return !!static::query()
            ->where('id', $id)
            ->update([
            'is_trusted' => false,
            'is_verified' => false
        ]);
    }
}
