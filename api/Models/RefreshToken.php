<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Models\BaseModel;

class RefreshToken extends BaseModel
{
    protected static string $table = 'refresh_tokens';
    protected static string $primaryKey = 'id';
    
    protected array $fillable = [
        'id',
        'user_id',
        'token',
        'expires_at',
        'is_active',
        'device_fingerprint'
    ];

    /**
     * Find active refresh token
     */
    public static function findActiveToken(string $token): ?array
    {
        return static::query()
            ->where('token', $token)
            ->where('is_active', true)
            ->where('expires_at', '>', date('Y-m-d H:i:s'))
            ->first();
    }

    /**
     * Get user's active tokens
     */
    public static function getUserTokens(int $userId): array
    {
        return static::query()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->where('expires_at', '>', date('Y-m-d H:i:s'))
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    /**
     * Revoke token
     */
    public static function revokeToken(string $id): bool
    {
        return static::query()
            ->where('id', $id)
            ->update([
                'is_active' => 0
            ]) > 0;
    }

    /**
     * Revoke all user tokens
     */
    public static function revokeAllUserTokens(int $userId): int
    {
        $result = static::query()
            ->where('user_id', $userId)
            ->update([
                'is_active' => 0
            ]);
        
        return $result ?? 0;
    }

    /**
     * Clean up expired tokens
     */
    public static function cleanupExpiredTokens(): int
    {
        $result = static::query()
            ->where('expires_at', '<', date('Y-m-d H:i:s'))
            ->delete();
        
        return $result ? 1 : 0;
    }

    /**
     * Revoke tokens for a specific device
     */
    public static function revokeDeviceTokens(int $userId, string $deviceFingerprint): int
    {
        $result = static::query()
            ->where('user_id', $userId)
            ->where('device_fingerprint', $deviceFingerprint)
            ->update([
                'is_active' => 0
            ]);
        
        return $result ?? 0;
    }
}
