<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Context;
use Api\Models\AuthLog;

class AuthenticationLogController extends BaseController
{
    public function index(Context $ctx)
    {


        $user = $ctx->user();
        if (!$user) {
            return $this->unauthorized($ctx, 'Authentication required');
        }

        $isAdmin = ($user['role'] ?? '') === 'admin';
        $page = max(1, (int) ($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int) ($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim((string) ($ctx->query('search') ?? ''));

        $query = AuthLog::query()
            ->select([
                'auth_logs.*',
                'users.email as user_email',
                'users.username as user_username',
                'users.avatar_url as user_avatar_url'
            ])
            ->leftJoin('users', 'auth_logs.user_id', '=', 'users.id');

        if (!$isAdmin) {
            $query->where('auth_logs.user_id', (int) $user['id']);
        } elseif ($userId = $ctx->query('user_id')) {
            $query->where('auth_logs.user_id', $userId);
        }

        if ($action = $ctx->query('action')) {
            $query->where('auth_logs.action', 'like', '%' . $action . '%');
        }

        if ($ipAddress = $ctx->query('ip_address')) {
            $query->where('auth_logs.ip_address', 'like', '%' . $ipAddress . '%');
        }

        if ($fromDate = $ctx->query('from_date')) {
            $query->where('auth_logs.created_at', '>=', $fromDate);
        }

        if ($toDate = $ctx->query('to_date')) {
            $query->where('auth_logs.created_at', '<=', $toDate);
        }

        if ($search !== '') {
            $term = '%' . $search . '%';
            $query->whereRaw(
                '(auth_logs.action LIKE ? OR auth_logs.ip_address LIKE ? OR auth_logs.user_agent LIKE ? OR CAST(auth_logs.details AS CHAR) LIKE ? OR users.email LIKE ? OR users.username LIKE ?)',
                [$term, $term, $term, $term, $term, $term]
            );
        }

        $logs = $query
            ->orderBy('auth_logs.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $countQuery = AuthLog::query()
            ->leftJoin('users', 'auth_logs.user_id', '=', 'users.id');

        if (!$isAdmin) {
            $countQuery->where('auth_logs.user_id', (int) $user['id']);
        } elseif ($userId = $ctx->query('user_id')) {
            $countQuery->where('auth_logs.user_id', $userId);
        }

        if ($action = $ctx->query('action')) {
            $countQuery->where('auth_logs.action', 'like', '%' . $action . '%');
        }

        if ($ipAddress = $ctx->query('ip_address')) {
            $countQuery->where('auth_logs.ip_address', 'like', '%' . $ipAddress . '%');
        }

        if ($fromDate = $ctx->query('from_date')) {
            $countQuery->where('auth_logs.created_at', '>=', $fromDate);
        }

        if ($toDate = $ctx->query('to_date')) {
            $countQuery->where('auth_logs.created_at', '<=', $toDate);
        }

        if ($search !== '') {
            $term = '%' . $search . '%';
            $countQuery->whereRaw(
                '(auth_logs.action LIKE ? OR auth_logs.ip_address LIKE ? OR auth_logs.user_agent LIKE ? OR CAST(auth_logs.details AS CHAR) LIKE ? OR users.email LIKE ? OR users.username LIKE ?)',
                [$term, $term, $term, $term, $term, $term]
            );
        }

        $total = $countQuery->count();

        return $this->ok($ctx, [
            'data' => array_map(fn(AuthLog $log) => $this->normalizeLog($log), $logs),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / $limit)
            ]
        ]);
    }

    private function normalizeLog(AuthLog $log): array
    {
        $data = $log->toArray();
        $data['details'] = $this->decodeJsonField($data['details'] ?? null);
        return $data;
    }

    private function decodeJsonField($value)
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        if (!is_string($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
    }
}
