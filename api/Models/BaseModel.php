<?php

declare(strict_types = 1)
;

namespace Api\Models;

use Api\Services\AuditContext;

class BaseModel implements \ArrayAccess
{
    protected static ?\PDO $pdo = null;
    protected static string $table;
    protected array $attributes = [];
    protected array $fillable = [];
    protected array $hidden = [];
    protected static string $primaryKey = 'id';
    protected static array $history = [];

    public function __construct(array $attributes = [])
    {
        $this->attributes = $attributes;
        // Only set fillable/hidden if not already set in subclass
        if (empty($this->fillable)) {
            $this->fillable = $this->getFillable();
        }
        if (empty($this->hidden)) {
            $this->hidden = $this->getHidden();
        }
    }

    public static function getPDO(): \PDO
    {
        // Use test PDO if available (for testing)
        if (isset($GLOBALS['__TEST_PDO__'])) {
            return $GLOBALS['__TEST_PDO__'];
        }

        if (self::$pdo === null) {
            $DBNAME = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'aibase';

            $dsn = 'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';dbname=' . $DBNAME . ';charset=utf8mb4';
            $username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'aibase';
            $password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: 'aibase';

            self::$pdo = new \PDO($dsn, $username, $password, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            ]);
        }
        return self::$pdo;
    }

    public static function find($id): ?static
    {
        $pdo = self::getPDO();
        $query = "SELECT * FROM " . static::$table . " WHERE " . static::$primaryKey . " = ?";
        static::addHistoryEntry($query, [$id]);
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        $data = $stmt->fetch();
        return $data ? new static ($data) : null;
    }

    public static function findAll(array $conditions = []): array
    {
        $pdo = self::getPDO();
        $query = "SELECT * FROM " . static::$table;
        $params = [];

        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "$key = ?";
                $params[] = $value;
            }
            $query .= " WHERE " . implode(' AND ', $where);
        }

        static::addHistoryEntry($query, $params);
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $results = $stmt->fetchAll();
        return array_map(fn($data) => new static ($data), $results);
    }

    public function save(): bool
    {
        $pdo = self::getPDO();
        $data = array_intersect_key($this->attributes, array_flip($this->fillable));
        $data = $this->normalizeData($data);

        // Check if this is an existing record by checking if it exists in the database
        $isExisting = false;
        $existingAttributes = null;
        if (isset($this->attributes[static::$primaryKey])) {
            /** @var static|null $existing */
            $existing = static::find($this->attributes[static::$primaryKey]);
            if ($existing !== null) {
                $isExisting = true;
                $existingAttributes = $existing->attributes;
            }
        }

        if ($isExisting) {
            // Update - exclude primary key from SET clause
            $set = [];
            $params = [];
            foreach ($data as $key => $value) {
                if ($key !== static::$primaryKey) {
                    $set[] = "$key = ?";
                    $params[] = $value;
                }
            }

            if (empty($set)) {
                return true; // Nothing to update
            }

            $params[] = $this->attributes[static::$primaryKey];
            $query = "UPDATE " . static::$table . " SET " . implode(', ', $set) . " WHERE " . static::$primaryKey . " = ?";
            static::addHistoryEntry($query, $params);
            $stmt = $pdo->prepare($query);
            $result = $stmt->execute($params);

            if ($result && $existingAttributes !== null && AuditContext::shouldAudit(static::$table)) {
                $changes = [];
                foreach ($data as $key => $value) {
                    if ($key === static::$primaryKey) {
                        continue;
                    }
                    $oldValue = $existingAttributes[$key] ?? null;
                    if (AuditContext::valuesDiffer($oldValue, $value)) {
                        $changes[$key] = [
                            'from' => $oldValue,
                            'to' => $value,
                        ];
                    }
                }

                if (!empty($changes)) {
                    AuditContext::log(
                        'update',
                        static::$table,
                        (string)$this->attributes[static::$primaryKey],
                        $changes
                    );
                }
            }

            return $result;
        }
        else {
            // Insert
            $columns = array_keys($data);

            if (empty($columns)) {
                return false; // Nothing to insert
            }

            $placeholders = str_repeat('?,', count($columns) - 1) . '?';
            $query = "INSERT INTO " . static::$table . " (" . implode(', ', $columns) . ") VALUES ($placeholders)";
            static::addHistoryEntry($query, array_values($data));
            $stmt = $pdo->prepare($query);
            if ($stmt->execute(array_values($data))) {
                // For auto-increment IDs, set the last insert ID
                // For UUID/string IDs, it's already set in attributes
                if (!isset($this->attributes[static::$primaryKey])) {
                    $this->attributes[static::$primaryKey] = $pdo->lastInsertId();
                }
                // Reload the record to get all fields including timestamps
                /** @var static|null $fresh */
                $fresh = static::find($this->attributes[static::$primaryKey]);
                if ($fresh) {
                    $this->attributes = $fresh->attributes;
                }
                if (AuditContext::shouldAudit(static::$table)) {
                    $changes = [];
                    foreach ($data as $key => $value) {
                        if ($key === static::$primaryKey) {
                            continue;
                        }
                        $changes[$key] = [
                            'from' => null,
                            'to' => $value,
                        ];
                    }
                    if (!empty($changes)) {
                        AuditContext::log(
                            'create',
                            static::$table,
                            (string)$this->attributes[static::$primaryKey],
                            $changes
                        );
                    }
                }
                return true;
            }
            return false;
        }
    }

    protected function normalizeData(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_bool($value)) {
                $data[$key] = (int)$value;
            }
        }
        return $data;
    }

    public function delete(): bool
    {
        if (!isset($this->attributes[static::$primaryKey])) {
            return false;
        }
        $recordId = $this->attributes[static::$primaryKey];
        /** @var static|null $existing */
        $existing = static::find($recordId);
        $existingAttributes = $existing ? $existing->attributes : $this->attributes;
        $pdo = self::getPDO();
        $query = "DELETE FROM " . static::$table . " WHERE " . static::$primaryKey . " = ?";
        $params = [$recordId];
        static::addHistoryEntry($query, $params);
        $stmt = $pdo->prepare($query);
        $result = $stmt->execute($params);

        if ($result && AuditContext::shouldAudit(static::$table)) {
            $changes = [];
            foreach ($existingAttributes as $key => $value) {
                if ($key === static::$primaryKey) {
                    continue;
                }
                $changes[$key] = [
                    'from' => $value,
                    'to' => null,
                ];
            }
            if (!empty($changes)) {
                AuditContext::log(
                    'delete',
                    static::$table,
                    (string)$recordId,
                    $changes
                );
            }
        }

        return $result;
    }

    public function __get(string $name)
    {
        return $this->attributes[$name] ?? null;
    }

    public function __set(string $name, $value): void
    {
        if (in_array($name, $this->fillable)) {
            $this->attributes[$name] = $value;
        }
    }

    public function toArray(): array
    {
        $data = $this->attributes;
        foreach ($this->hidden as $field) {
            unset($data[$field]);
        }
        $data['document'] = null;
        if (isset($this->attributes['supporting_document_id']) && $this->attributes['supporting_document_id']) {
            /** @var Upload|null $upload */
            $upload = Upload::find($this->attributes['supporting_document_id']);
            if ($upload) {
                $data['document'] = $upload->toArray();
            }
        }
        return $data;
    }

    protected function getFillable(): array
    {
        // Override in subclasses to define fillable fields
        return [];
    }

    protected function getHidden(): array
    {
        // Override in subclasses to define hidden fields
        return [];
    }

    public static function query(): QueryBuilder
    {
        return new QueryBuilder(static::class);
    }

    public static function upsert(array $data, array $uniqueBy = [], array $update = []): bool
    {
        $pdo = static::getPDO();
        $columns = array_keys($data);
        $placeholders = str_repeat('?,', count($columns) - 1) . '?';
        $query = "INSERT INTO " . static::$table . " (" . implode(', ', $columns) . ") VALUES ($placeholders)";

        if (!empty($update)) {
            $set = [];
            foreach ($update as $key => $value) {
                $set[] = "$key = ?";
                $data[] = $value;
            }
            $query .= " ON DUPLICATE KEY UPDATE " . implode(', ', $set);
        }
        elseif (!empty($uniqueBy)) {
            $set = [];
            foreach ($columns as $column) {
                if (!in_array($column, $uniqueBy)) {
                    $set[] = "$column = VALUES($column)";
                }
            }
            if (!empty($set)) {
                $query .= " ON DUPLICATE KEY UPDATE " . implode(', ', $set);
            }
        }

        static::addHistoryEntry($query, array_values($data));
        $stmt = $pdo->prepare($query);
        return $stmt->execute(array_values($data));
    }

    public static function getHistory(): array
    {
        return static::$history;
    }

    public static function clearHistory(): void
    {
        static::$history = [];
    }

    public static function addHistoryEntry(string $query, array $params = []): void
    {
        static::$history[] = ['query' => $query, 'params' => $params, 'timestamp' => date('Y-m-d H:i:s')];
    }

    public static function getTable(): string
    {
        return static::$table;
    }

    public static function getPrimaryKey(): string
    {
        return static::$primaryKey;
    }

    // ArrayAccess implementation
    public function offsetExists(mixed $offset): bool
    {
        return isset($this->attributes[$offset]);
    }

    public function offsetGet(mixed $offset): mixed
    {
        return $this->attributes[$offset] ?? null;
    }

    public function offsetSet(mixed $offset, mixed $value): void
    {
        if ($offset === null) {
            $this->attributes[] = $value;
        }
        else {
            $this->attributes[$offset] = $value;
        }
    }

    public function offsetUnset(mixed $offset): void
    {
        unset($this->attributes[$offset]);
    }

    // Static create method
    public static function create(array $attributes): static
    {
        $instance = new static ($attributes);
        $instance->save();
        return $instance;
    }

    protected function baseUrl(string $uri = ''): string
    {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = isset($_ENV['VITE_API_URL']) ? parse_url($_ENV['VITE_API_URL'], PHP_URL_HOST) : $_SERVER['HTTP_HOST'] ?? 'localhost';
        return rtrim(rtrim($protocol . $host, '/') . '/' . ltrim($uri, '/'), '/');
    }
    public static function rawQuery(string $sql, array $params = []): array
    {
        $pdo = static::getPDO();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
