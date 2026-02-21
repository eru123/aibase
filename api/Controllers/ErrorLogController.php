<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Context;
use Api\Models\ErrorLog;

class ErrorLogController extends BaseController
{
    /**
     * GET /api/error-logs
     *
     * Query params:
     *   page, limit, search, from_date, to_date, json_query
     *
     * json_query – a raw SQL-safe JSON path expression, e.g.:
     *   data->"$.type" = "email_send_failure"
     *   request->"$.method" = "POST"
     */
    public function index(Context $ctx)
    {
        $page   = max(1, (int) ($ctx->query('page') ?? 1));
        $limit  = max(1, min(100, (int) ($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim((string) ($ctx->query('search') ?? ''));

        $query = ErrorLog::query();

        // Date range filters
        if ($fromDate = $ctx->query('from_date')) {
            $query->where('created_at', '>=', $fromDate);
        }
        if ($toDate = $ctx->query('to_date')) {
            $query->where('created_at', '<=', $toDate);
        }

        // JSON search query – allows arbitrary JSON_EXTRACT expressions
        if ($jsonQuery = trim((string) ($ctx->query('json_query') ?? ''))) {
            // Validate that the query only references allowed columns
            if ($this->isJsonQuerySafe($jsonQuery)) {
                $query->whereRaw("($jsonQuery)");
            }
        }

        // Generic text search across JSON columns
        if ($search !== '') {
            $term = '%' . $search . '%';
            $query->whereRaw(
                '(CAST(request AS CHAR) LIKE ? OR CAST(data AS CHAR) LIKE ?)',
                [$term, $term]
            );
        }

        // Clone filters for count
        $countQuery = ErrorLog::query();

        if ($fromDate = $ctx->query('from_date')) {
            $countQuery->where('created_at', '>=', $fromDate);
        }
        if ($toDate = $ctx->query('to_date')) {
            $countQuery->where('created_at', '<=', $toDate);
        }
        if ($jsonQuery = trim((string) ($ctx->query('json_query') ?? ''))) {
            if ($this->isJsonQuerySafe($jsonQuery)) {
                $countQuery->whereRaw("($jsonQuery)");
            }
        }
        if ($search !== '') {
            $term = '%' . $search . '%';
            $countQuery->whereRaw(
                '(CAST(request AS CHAR) LIKE ? OR CAST(data AS CHAR) LIKE ?)',
                [$term, $term]
            );
        }

        $total = $countQuery->count();

        $logs = $query
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        return $this->ok($ctx, [
            'data' => array_map(fn(ErrorLog $log) => $this->normalizeLog($log), $logs),
            'pagination' => [
                'page'       => $page,
                'limit'      => $limit,
                'total'      => $total,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ]);
    }

    /**
     * GET /api/error-logs/:id
     */
    public function show(Context $ctx)
    {
        $id = (string) ($ctx->param('id') ?? '');
        if ($id === '') {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /** @var ErrorLog|null $log */
        $log = ErrorLog::find($id);
        if (!$log) {
            return $this->notFound($ctx, 'Error log not found');
        }

        return $this->ok($ctx, $this->normalizeLog($log));
    }

    /**
     * DELETE /api/error-logs/:id
     */
    public function destroy(Context $ctx)
    {
        $id = (string) ($ctx->param('id') ?? '');
        if ($id === '') {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /** @var ErrorLog|null $log */
        $log = ErrorLog::find($id);
        if (!$log) {
            return $this->notFound($ctx, 'Error log not found');
        }

        $log->delete();
        return $this->noContent($ctx);
    }

    // ─── Helpers ────────────────────────────────────────────────

    private function normalizeLog(ErrorLog $log): array
    {
        $data = $log->toArray();
        $data['request'] = $this->decodeJsonField($data['request'] ?? null);
        $data['data']    = $this->decodeJsonField($data['data'] ?? null);
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

    /**
     * Basic safety check: only allow expressions that reference the
     * `request` or `data` JSON columns.  Disallow dangerous keywords.
     */
    private function isJsonQuerySafe(string $query): bool
    {
        $lower = strtolower($query);

        // Block dangerous keywords
        $blocked = ['drop', 'delete', 'update', 'insert', 'alter', 'truncate', 'exec', 'union', ';', '--'];
        foreach ($blocked as $keyword) {
            if (str_contains($lower, $keyword)) {
                return false;
            }
        }

        // Must reference at least one of the JSON columns
        if (!str_contains($lower, 'request') && !str_contains($lower, 'data')) {
            return false;
        }

        return true;
    }
}
