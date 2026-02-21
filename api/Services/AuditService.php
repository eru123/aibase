<?php

declare(strict_types=1);

namespace Api\Services;

use Api\Models\AuditLog;
use Api\Models\AuthLog;

/**
 * Audit Service for logging all database operations and authentication events
 */
class AuditService
{
    /**
     * Log a create operation
     */
    public function logCreate(int $userId, string $tableName, int $recordId, array $newData): void
    {
        $changes = [];
        foreach ($newData as $field => $value) {
            $changes[$field] = ['from' => null, 'to' => $value];
        }

        AuditLog::log([
            'user_id' => $userId,
            'action' => 'create',
            'resource_type' => $tableName,
            'resource_id' => (string) $recordId,
            'changes' => $changes,
        ]);
    }

    /**
     * Log an update operation
     */
    public function logUpdate(int $userId, string $tableName, int $recordId, array $oldData, array $newData): void
    {
        $changes = [];
        foreach ($newData as $field => $value) {
            $changes[$field] = [
                'from' => $oldData[$field] ?? null,
                'to' => $value,
            ];
        }

        AuditLog::log([
            'user_id' => $userId,
            'action' => 'update',
            'resource_type' => $tableName,
            'resource_id' => (string) $recordId,
            'changes' => $changes,
        ]);
    }

    /**
     * Log a delete operation
     */
    public function logDelete(int $userId, string $tableName, int $recordId, array $oldData): void
    {
        $changes = [];
        foreach ($oldData as $field => $value) {
            $changes[$field] = ['from' => $value, 'to' => null];
        }

        AuditLog::log([
            'user_id' => $userId,
            'action' => 'delete',
            'resource_type' => $tableName,
            'resource_id' => (string) $recordId,
            'changes' => $changes,
        ]);
    }

    /**
     * Log authentication event
     */
    public function logAuth(
        ?int $userId,
        string $action,
        string $ipAddress,
        string $userAgent,
        ?array $details = null
    ): void {
        AuthLog::create([
            'user_id' => $userId,
            'action' => $action,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'details' => $details ? json_encode($details) : null
        ]);
    }

    /**
     * Get audit trail for a specific record
     */
    public function getRecordHistory(string $tableName, int $recordId): array
    {
        return AuditLog::query()
            ->where('resource_type', $tableName)
            ->where('resource_id', (string) $recordId)
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    /**
     * Get user's activity
     */
    public function getUserActivity(int $userId, int $limit = 100): array
    {
        return AuditLog::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get();
    }

    /**
     * Get authentication logs for user
     */
    public function getUserAuthLogs(int $userId, int $limit = 100): array
    {
        return AuthLog::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get();
    }

    /**
     * Get recent failed login attempts
     */
    public function getRecentFailedLogins(string $identifier, int $minutes = 15): int
    {
        $since = date('Y-m-d H:i:s', strtotime("-$minutes minutes"));

        $logs = AuthLog::query()
            ->where('action', 'login_failed')
            ->whereRaw('created_at >= ?', [$since])
            ->whereRaw('details LIKE ?', ['%' . $identifier . '%'])
            ->get();

        return count($logs);
    }

    /**
     * Check if IP is suspicious (too many failed attempts)
     */
    public function isSuspiciousIp(string $ipAddress, int $threshold = 5): bool
    {
        $since = date('Y-m-d H:i:s', strtotime('-1 hour'));

        $logs = AuthLog::query()
            ->where('ip_address', $ipAddress)
            ->where('action', 'login_failed')
            ->whereRaw('created_at >= ?', [$since])
            ->get();

        return count($logs) >= $threshold;
    }
}
