<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Models\BaseModel;

class AuthenticationLog extends BaseModel
{
    protected static string $table = 'authentication_logs';
    protected static string $primaryKey = 'id';
    
    protected array $fillable = [
        'id',
        'user_id',
        'email',
        'action',
        'device_fingerprint',
        'user_agent',
        'ip_address',
        'location',
        'success',
        'failure_reason',
        'requires_device_verification',
        'device_verification_id',
        'session_id',
        'token_type'
    ];

    /**
     * Log an authentication attempt
     */
    public static function logAttempt(array $data): ?array
    {
        $id = \Api\Services\SecurityService::generateUUID();
        
        $logData = [
            'id' => $id,
            'user_id' => $data['user_id'] ?? null,
            'email' => $data['email'],
            'action' => $data['action'],
            'success' => $data['success'],
            'device_fingerprint' => $data['device_fingerprint'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
            'ip_address' => $data['ip_address'] ?? null,
            'location' => $data['location'] ?? null,
            'failure_reason' => $data['failure_reason'] ?? null,
            'requires_device_verification' => $data['requires_device_verification'] ?? false,
            'device_verification_id' => $data['device_verification_id'] ?? null,
            'session_id' => $data['session_id'] ?? null,
            'token_type' => $data['token_type'] ?? null,
        ];

        $result = static::create($logData);
        return $result ? $result->toArray() : null;
    }

    /**
     * Get authentication logs for a user
     */
    public static function getUserLogs(int $userId, int $limit = 50): array
    {
        return static::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get();
    }

    /**
     * Get failed login attempts for an email
     */
    public static function getFailedAttempts(string $email, int $minutes = 15): array
    {
        $since = date('Y-m-d H:i:s', strtotime("-{$minutes} minutes"));
        
        return static::query()
            ->where('email', $email)
            ->where('action', 'failed_login')
            ->where('success', false)
            ->where('created_at', '>=', $since)
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    /**
     * Get recent authentication logs with filters
     */
    public static function getRecentLogs(array $filters = [], int $limit = 100): array
    {
        $query = static::query();

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['email'])) {
            $query->where('email', $filters['email']);
        }

        if (isset($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (isset($filters['success'])) {
            $query->where('success', $filters['success']);
        }

        if (isset($filters['ip_address'])) {
            $query->where('ip_address', $filters['ip_address']);
        }

        if (isset($filters['from_date'])) {
            $query->where('created_at', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->where('created_at', '<=', $filters['to_date']);
        }

        return $query
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get();
    }

    /**
     * Get suspicious activity (multiple failed logins)
     */
    public static function getSuspiciousActivity(int $minutes = 60, int $threshold = 5): array
    {
        $since = date('Y-m-d H:i:s', strtotime("-{$minutes} minutes"));
        
        // This is a simplified query - in production you'd use GROUP BY and HAVING
        return static::query()
            ->where('success', false)
            ->where('created_at', '>=', $since)
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    /**
     * Clean up old logs
     */
    public static function cleanupOldLogs(int $days = 90): int
    {
        $before = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        
        $result = static::query()
            ->where('created_at', '<', $before)
            ->delete();
        
        return $result ? 1 : 0;
    }
}
