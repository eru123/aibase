<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\AuditLog;

class AuditController extends BaseController
{
    public function index(Context $ctx)
    {


        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim((string)($ctx->query('search') ?? ''));

        $query = AuditLog::query()
            ->select([
            'audit_logs.*',
            'users.email as user_email',
            'users.username as user_username',
            'users.avatar_url as user_avatar_url'
        ])
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id');

        // Filters
        if ($userId = $ctx->query('user_id')) {
            $query->where('audit_logs.user_id', $userId);
        }
        if ($action = $ctx->query('action')) {
            $query->where('audit_logs.action', 'like', '%' . $action . '%');
        }
        if ($resourceType = $ctx->query('resource_type')) {
            $query->where('audit_logs.resource_type', 'like', '%' . $resourceType . '%');
        }
        if ($resourceId = $ctx->query('resource_id')) {
            $query->where('audit_logs.resource_id', 'like', '%' . $resourceId . '%');
        }
        if ($fromDate = $ctx->query('from_date')) {
            $query->where('audit_logs.created_at', '>=', $fromDate);
        }
        if ($toDate = $ctx->query('to_date')) {
            $query->where('audit_logs.created_at', '<=', $toDate);
        }
        if ($search !== '') {
            $term = '%' . $search . '%';
            $query->whereRaw(
                '(audit_logs.action LIKE ? OR audit_logs.resource_type LIKE ? OR audit_logs.resource_id LIKE ? OR users.email LIKE ? OR users.username LIKE ?)',
            [$term, $term, $term, $term, $term]
            );
        }

        $audits = $query
            ->orderBy('audit_logs.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $countQuery = AuditLog::query()
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id');

        if ($userId = $ctx->query('user_id')) {
            $countQuery->where('audit_logs.user_id', $userId);
        }
        if ($action = $ctx->query('action')) {
            $countQuery->where('audit_logs.action', 'like', '%' . $action . '%');
        }
        if ($resourceType = $ctx->query('resource_type')) {
            $countQuery->where('audit_logs.resource_type', 'like', '%' . $resourceType . '%');
        }
        if ($resourceId = $ctx->query('resource_id')) {
            $countQuery->where('audit_logs.resource_id', 'like', '%' . $resourceId . '%');
        }
        if ($fromDate = $ctx->query('from_date')) {
            $countQuery->where('audit_logs.created_at', '>=', $fromDate);
        }
        if ($toDate = $ctx->query('to_date')) {
            $countQuery->where('audit_logs.created_at', '<=', $toDate);
        }
        if ($search !== '') {
            $term = '%' . $search . '%';
            $countQuery->whereRaw(
                '(audit_logs.action LIKE ? OR audit_logs.resource_type LIKE ? OR audit_logs.resource_id LIKE ? OR users.email LIKE ? OR users.username LIKE ?)',
            [$term, $term, $term, $term, $term]
            );
        }

        $total = $countQuery->count();

        return $this->ok($ctx, [
            'data' => array_map(fn(AuditLog $log) => $this->normalizeLog($log), $audits),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int)ceil($total / $limit)
            ]
        ]);
    }

    public function show(Context $ctx)
    {


        $id = (string)($ctx->param('id') ?? '');
        if ($id === '')
            return $this->badRequest($ctx, 'Invalid id');

        /**
         * @var AuditLog|null $audit
         */
        $audit = AuditLog::find($id);
        if (!$audit)
            return $this->notFound($ctx, 'Audit log not found');

        return $this->ok($ctx, $this->normalizeLog($audit));
    }

    private function normalizeLog(AuditLog $log): array
    {
        $data = $log->toArray();
        $data['changes'] = $this->decodeJsonField($data['changes'] ?? null);
        $data['metadata'] = $this->decodeJsonField($data['metadata'] ?? null);
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
