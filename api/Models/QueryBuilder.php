<?php

namespace Api\Models;

use Api\Services\AuditContext;

class QueryBuilder
{
    protected string $modelClass;
    protected array $select = [];
    protected array $joins = [];
    protected array $wheres = [];
    protected array $groupBy = [];
    protected array $having = [];
    protected array $orderBy = [];
    protected ?int $limit = null;
    protected ?int $offset = null;

    public function __construct(string $modelClass)
    {
        $this->modelClass = $modelClass;
    }

    public function select(array $columns = ['*']): self
    {
        $this->select = $columns;
        return $this;
    }

    public function where($column, $operator = null, $value = null, $boolean = 'AND'): self
    {
        // Handle closure for nested where conditions (must be a Closure object, not just any callable string)
        if ($column instanceof \Closure || (!is_string($column) && is_callable($column))) {
            $this->whereNested($column, $boolean);
            return $this;
        }

        if (is_array($column)) {
            foreach ($column as $where) {
                if (count($where) === 3) {
                    $this->where($where[0], $where[1], $where[2]);
                } elseif (count($where) === 2) {
                    $this->where($where[0], '=', $where[1]);
                }
            }
            return $this;
        }

        // If only 2 parameters provided, assume column and value with = operator
        if ($value === null && $operator !== null) {
            $value = $operator;
            $operator = '=';
        }

        if ($operator === null) {
            $operator = '=';
            $value = $column;
            $column = $this->modelClass::getPrimaryKey();
        }

        $this->wheres[] = compact('column', 'operator', 'value', 'boolean');
        return $this;
    }

    public function orWhere($column, $operator = null, $value = null): self
    {
        return $this->where($column, $operator, $value, 'OR');
    }

    public function whereIn(string $column, array $values, string $boolean = 'AND', bool $not = false): self
    {
        $type = $not ? 'NotIn' : 'In';
        $this->wheres[] = compact('column', 'values', 'boolean', 'type');
        return $this;
    }

    public function whereNotIn(string $column, array $values, string $boolean = 'AND'): self
    {
        return $this->whereIn($column, $values, $boolean, true);
    }

    public function orWhereIn(string $column, array $values): self
    {
        return $this->whereIn($column, $values, 'OR');
    }

    public function orWhereNotIn(string $column, array $values): self
    {
        return $this->whereIn($column, $values, 'OR', true);
    }

    protected function whereNested(callable $callback, string $boolean = 'AND'): self
    {
        $query = new static($this->modelClass);
        $callback($query);

        if (!empty($query->wheres)) {
            // Add opening parenthesis
            $nestedWheres = [];
            foreach ($query->wheres as $index => $where) {
                $where['boolean'] = $index === 0 ? $boolean : $where['boolean'];
                $nestedWheres[] = $where;
            }

            // Mark the first where with nested start and last with nested end
            if (!empty($nestedWheres)) {
                $nestedWheres[0]['nested_start'] = true;
                $nestedWheres[count($nestedWheres) - 1]['nested_end'] = true;
            }

            $this->wheres = array_merge($this->wheres, $nestedWheres);
        }

        return $this;
    }

    public function whereRaw(string $sql, array $params = [], string $boolean = 'AND'): self
    {
        $this->wheres[] = ['type' => 'raw', 'sql' => $sql, 'params' => $params, 'boolean' => $boolean];
        return $this;
    }

    public function join(string $table, string $first, string $operator, string $second, string $type = 'INNER'): self
    {
        $this->joins[] = compact('table', 'first', 'operator', 'second', 'type');
        return $this;
    }

    public function leftJoin(string $table, string $first, string $operator, string $second): self
    {
        return $this->join($table, $first, $operator, $second, 'LEFT');
    }

    public function rightJoin(string $table, string $first, string $operator, string $second): self
    {
        return $this->join($table, $first, $operator, $second, 'RIGHT');
    }

    public function groupBy(array $columns): self
    {
        $this->groupBy = $columns;
        return $this;
    }

    public function having(string $column, string $operator, $value): self
    {
        $this->having[] = compact('column', 'operator', 'value');
        return $this;
    }

    public function orderBy(string $column, string $direction = 'ASC'): self
    {
        $direction = strtoupper($direction);
        if (!in_array($direction, ['ASC', 'DESC'], true)) {
            throw new \InvalidArgumentException('Invalid order by direction');
        }

        if (!$this->isSafeIdentifier($column)) {
            throw new \InvalidArgumentException('Invalid order by column');
        }

        $this->orderBy[] = compact('column', 'direction');
        return $this;
    }

    public function limit(int $limit): self
    {
        $this->limit = $limit;
        return $this;
    }

    public function offset(int $offset): self
    {
        $this->offset = $offset;
        return $this;
    }

    protected function buildQuery(): array
    {
        $query = 'SELECT ' . (empty($this->select) ? '*' : implode(', ', $this->select)) . ' FROM ' . $this->modelClass::getTable();

        // Joins
        foreach ($this->joins as $join) {
            $query .= " {$join['type']} JOIN {$join['table']} ON {$join['first']} {$join['operator']} {$join['second']}";
        }

        // Where
        $params = [];
        if (!empty($this->wheres)) {
            $whereParts = [];
            foreach ($this->wheres as $index => $where) {
                $prefix = $index > 0 ? $where['boolean'] . ' ' : '';

                if (isset($where['nested_start'])) {
                    $prefix .= '(';
                }

                if (isset($where['type']) && $where['type'] === 'raw') {
                    $whereParts[] = $prefix . $where['sql'];
                    $params = array_merge($params, $where['params']);
                } elseif (isset($where['type']) && ($where['type'] === 'In' || $where['type'] === 'NotIn')) {
                    $operator = $where['type'] === 'In' ? 'IN' : 'NOT IN';
                    $placeholders = implode(',', array_fill(0, count($where['values']), '?'));
                    $whereParts[] = $prefix . "{$where['column']} $operator ($placeholders)";
                    $params = array_merge($params, $where['values']);
                } else {
                    $whereParts[] = $prefix . "{$where['column']} {$where['operator']} ?";
                    $params[] = $where['value'];
                }

                if (isset($where['nested_end'])) {
                    $whereParts[count($whereParts) - 1] .= ')';
                }
            }
            $query .= ' WHERE ' . implode(' ', $whereParts);
        }

        // Group By
        if (!empty($this->groupBy)) {
            $query .= ' GROUP BY ' . implode(', ', $this->groupBy);
        }

        // Having
        if (!empty($this->having)) {
            $havingClauses = [];
            foreach ($this->having as $having) {
                if (is_int($having['value']) || is_float($having['value']) || (is_string($having['value']) && is_numeric($having['value']))) {
                    $val = (string) $having['value'];
                    $havingClauses[] = "{$having['column']} {$having['operator']} {$val}";
                } else {
                    $havingClauses[] = "{$having['column']} {$having['operator']} ?";
                    $params[] = $having['value'];
                }
            }
            $query .= ' HAVING ' . implode(' AND ', $havingClauses);
        }

        // Order By
        if (!empty($this->orderBy)) {
            $orderClauses = [];
            foreach ($this->orderBy as $order) {
                $orderClauses[] = "{$order['column']} {$order['direction']}";
            }
            $query .= ' ORDER BY ' . implode(', ', $orderClauses);
        }

        // Limit and Offset
        if ($this->limit !== null) {
            $query .= " LIMIT " . $this->limit;
            if ($this->offset !== null) {
                $query .= ' OFFSET ' . $this->offset;
            }
        }

        return [$query, $params];
    }

    protected function getRawRows(bool $forceSelectAll = true): array
    {
        $originalSelect = $this->select;
        if ($forceSelectAll) {
            $this->select = ['*'];
        }

        [$query, $params] = $this->buildQuery();
        $this->modelClass::addHistoryEntry($query, $params);
        $pdo = $this->modelClass::getPDO();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $this->select = $originalSelect;

        return $rows ?: [];
    }

    private function isSafeIdentifier(string $identifier): bool
    {
        return (bool) preg_match('/^[a-zA-Z0-9_\\.]+$/', $identifier);
    }

    public function get(): array
    {
        [$query, $params] = $this->buildQuery();
        $this->modelClass::addHistoryEntry($query, $params);
        $pdo = $this->modelClass::getPDO();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $results = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $results[] = $row;
        }
        return array_map(fn($data) => new $this->modelClass($data), $results);
    }

    public function getGenerator(): \Generator
    {
        [$query, $params] = $this->buildQuery();
        $this->modelClass::addHistoryEntry($query, $params);
        $pdo = $this->modelClass::getPDO();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        while ($data = $stmt->fetch()) {
            yield new $this->modelClass($data);
        }
    }

    public function first(): ?BaseModel
    {
        $this->limit = 1;
        $results = $this->get();
        return $results[0] ?? null;
    }

    public function count(): int
    {
        $originalSelect = $this->select;
        $this->select = ['COUNT(*) as count'];
        [$query, $params] = $this->buildQuery();
        $this->modelClass::addHistoryEntry($query, $params);
        $pdo = $this->modelClass::getPDO();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        $this->select = $originalSelect;
        return (int) $result['count'];
    }

    public function update(array $values): int
    {
        if (empty($values)) {
            return 0;
        }

        $table = $this->modelClass::getTable();
        $set = [];
        $params = [];
        $normalizedValues = [];

        $shouldAudit = AuditContext::shouldAudit($table);
        $rowsBefore = $shouldAudit ? $this->getRawRows() : [];

        foreach ($values as $column => $value) {
            if (is_bool($value)) {
                $value = (int) $value;
            }
            $set[] = "$column = ?";
            $params[] = $value;
            $normalizedValues[$column] = $value;
        }

        $query = "UPDATE $table SET " . implode(', ', $set);

        // Add WHERE clauses
        if (!empty($this->wheres)) {
            [$whereClause, $whereParams] = $this->buildWhereClause();
            $query .= " WHERE $whereClause";
            $params = array_merge($params, $whereParams);
        }

        $this->modelClass::addHistoryEntry($query, $params);
        $pdo = $this->modelClass::getPDO();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $rowCount = $stmt->rowCount();

        if ($shouldAudit && $rowCount > 0 && !empty($rowsBefore)) {
            $primaryKey = $this->modelClass::getPrimaryKey();
            $isBulk = count($rowsBefore) > 1;
            foreach ($rowsBefore as $row) {
                $changes = [];
                foreach ($normalizedValues as $column => $value) {
                    $oldValue = $row[$column] ?? null;
                    if (AuditContext::valuesDiffer($oldValue, $value)) {
                        $changes[$column] = [
                            'from' => $oldValue,
                            'to' => $value,
                        ];
                    }
                }

                if (!empty($changes)) {
                    $resourceId = isset($row[$primaryKey]) ? (string) $row[$primaryKey] : null;
                    AuditContext::log(
                        'update',
                        $table,
                        $resourceId,
                        $changes,
                        $isBulk ? ['bulk' => true] : null
                    );
                }
            }
        }

        return $rowCount;
    }

    protected function buildWhereClause(): array
    {
        $whereParts = [];
        $params = [];

        foreach ($this->wheres as $index => $where) {
            $prefix = $index > 0 ? $where['boolean'] . ' ' : '';

            if (isset($where['nested_start'])) {
                $prefix .= '(';
            }

            if (isset($where['type']) && $where['type'] === 'raw') {
                $whereParts[] = $prefix . $where['sql'];
                $params = array_merge($params, $where['params']);
            } elseif (isset($where['type']) && ($where['type'] === 'In' || $where['type'] === 'NotIn')) {
                $operator = $where['type'] === 'In' ? 'IN' : 'NOT IN';
                $placeholders = implode(',', array_fill(0, count($where['values']), '?'));
                $whereParts[] = $prefix . "{$where['column']} $operator ($placeholders)";
                $params = array_merge($params, $where['values']);
            } else {
                $whereParts[] = $prefix . "{$where['column']} {$where['operator']} ?";
                $params[] = $where['value'];
            }

            if (isset($where['nested_end'])) {
                $whereParts[count($whereParts) - 1] .= ')';
            }
        }

        return [implode(' ', $whereParts), $params];
    }

    public function delete(): int
    {
        $table = $this->modelClass::getTable();
        $query = "DELETE FROM $table";
        $params = [];
        $shouldAudit = AuditContext::shouldAudit($table);
        $rowsBefore = $shouldAudit ? $this->getRawRows() : [];

        // Add WHERE clauses
        if (!empty($this->wheres)) {
            [$whereClause, $whereParams] = $this->buildWhereClause();
            $query .= " WHERE $whereClause";
            $params = $whereParams;
        }

        $this->modelClass::addHistoryEntry($query, $params);
        $pdo = $this->modelClass::getPDO();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $rowCount = $stmt->rowCount();

        if ($shouldAudit && $rowCount > 0 && !empty($rowsBefore)) {
            $primaryKey = $this->modelClass::getPrimaryKey();
            $isBulk = count($rowsBefore) > 1;
            foreach ($rowsBefore as $row) {
                $changes = [];
                foreach ($row as $key => $value) {
                    if ($key === $primaryKey) {
                        continue;
                    }
                    $changes[$key] = [
                        'from' => $value,
                        'to' => null,
                    ];
                }

                if (!empty($changes)) {
                    $resourceId = isset($row[$primaryKey]) ? (string) $row[$primaryKey] : null;
                    AuditContext::log(
                        'delete',
                        $table,
                        $resourceId,
                        $changes,
                        $isBulk ? ['bulk' => true] : null
                    );
                }
            }
        }

        return $rowCount;
    }
}
