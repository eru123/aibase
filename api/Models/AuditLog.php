<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Models\BaseModel;

class AuditLog extends BaseModel
{
    protected static string $table = 'audit_logs';
    protected static string $primaryKey = 'id';
    
    protected array $fillable = [
        'id',
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'ip_address',
        'user_agent',
        'changes',
        'metadata'
    ];

    /**
     * Log an audit event
     */
    public static function log(array $data): ?array
    {
        $id = \Api\Services\SecurityService::generateUUID();
        
        $logData = [
            'id' => $id,
            'user_id' => $data['user_id'] ?? null,
            'action' => $data['action'],
            'resource_type' => $data['resource_type'],
            'resource_id' => $data['resource_id'] ?? null,
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
            'changes' => isset($data['changes']) ? json_encode($data['changes']) : null,
            'metadata' => isset($data['metadata']) ? json_encode($data['metadata']) : null,
        ];

        $result = static::create($logData);
        return $result ? $result->toArray() : null;
    }

    /**
     * Get audit logs for a user
     */
    public static function getUserLogs(int $userId, int $limit = 100): array
    {
        return static::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get();
    }

    /**
     * Get audit logs for a resource
     */
    public static function getResourceLogs(string $resourceType, string $resourceId, int $limit = 50): array
    {
        return static::query()
            ->where('resource_type', $resourceType)
            ->where('resource_id', $resourceId)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get();
    }

    /**
     * Get recent audit logs with filters
     */
    public static function getRecentLogs(array $filters = [], int $limit = 100): array
    {
        $query = static::query();

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (isset($filters['resource_type'])) {
            $query->where('resource_type', $filters['resource_type']);
        }

        if (isset($filters['resource_id'])) {
            $query->where('resource_id', $filters['resource_id']);
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
     * Clean up old logs
     */
    public static function cleanupOldLogs(int $days = 365): int
    {
        $before = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        
        $result = static::query()
            ->where('created_at', '<', $before)
            ->delete();
        
        return $result ? 1 : 0;
    }
}
