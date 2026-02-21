<?php

namespace Api\Services;

use Api\Models\UserActivity;

class ActivityTrackingService
{
    /**
     * Log user activity
     */
    public function log(int $userId, string $action, string $description = '', ?string $ipAddress = null, ?string $userAgent = null): bool
    {
        try {
            $activity = new UserActivity([
                'user_id' => $userId,
                'action' => $action,
                'description' => $description,
                'ip_address' => $ipAddress ?? ($_SERVER['REMOTE_ADDR'] ?? ''),
                'user_agent' => $userAgent ?? ($_SERVER['HTTP_USER_AGENT'] ?? ''),
                'created_at' => date('Y-m-d H:i:s')
            ]);
            $activity->save();
            return true;
        } catch (\Exception $e) {
            error_log('Failed to log activity: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user activities
     */
    public function getUserActivities(int $userId, int $limit = 50, int $offset = 0): array
    {
        return UserActivity::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
    }

    /**
     * Get all activities (admin only)
     */
    public function getAllActivities(int $limit = 100, int $offset = 0, ?array $filters = null): array
    {
        $query = UserActivity::query()->select(['user_activities.*']);

        if ($filters) {
            if (isset($filters['user_id'])) {
                $query->where('user_activities.user_id', $filters['user_id']);
            }
            if (isset($filters['action'])) {
                $query->where('user_activities.action', $filters['action']);
            }
            if (isset($filters['from_date'])) {
                $query->where('user_activities.created_at', '>=', $filters['from_date']);
            }
            if (isset($filters['to_date'])) {
                $query->where('user_activities.created_at', '<=', $filters['to_date']);
            }
        }

        return $query
            ->orderBy('user_activities.created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
    }
}
