<?php

namespace Api\Traits;

trait Sortable
{
    /**
     * Apply sorting to a query builder instance.
     *
     * @param object $query The query builder instance
     * @param array $allowedColumns List of columns allowed for sorting
     * @param string $defaultColumn Default column to sort by
     * @param string $defaultDir Default sort direction (asc|desc)
     * @return object The modified query instance
     */
    protected function applySorting($query, array $allowedColumns, string $defaultColumn = 'id', string $defaultDir = 'asc')
    {
        $ctx = $GLOBALS['ctx'] ?? null; // Fallback to global context if not passed directly, though passing is cleaner. 
        // Better approach: rely on the controller having access to context via arguments, but here we only have query.
        // Let's assume we parse $_GET directly or the caller passes the params. 
        // To keep it simple and consistent with the controller method signature, let's extract from request query params.

        $sortBy = $_GET['sort_by'] ?? $defaultColumn;
        $sortDir = $_GET['sort_dir'] ?? $defaultDir;

        // specific check for frontend commonly sending 'scending' or 'descending' or just 'asc'/'desc'
        // But for this API, let's stick to 'asc' and 'desc'.

        if (!in_array($sortBy, $allowedColumns)) {
            $sortBy = $defaultColumn;
        }

        $sortDir = strtolower($sortDir) === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sortBy, $sortDir);
    }
}
