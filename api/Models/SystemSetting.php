<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Services\AuditContext;

class SystemSetting extends BaseModel
{
    protected static string $table = 'system_settings';
    protected static array $cachedData = [];
    private const CACHE_MISS = '__SYSTEM_SETTING_MISS__';

    protected function getFillable(): array
    {
        return ['key', 'value'];
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        if (array_key_exists($key, static::$cachedData)) {
            $cached = static::$cachedData[$key];
            if ($cached === self::CACHE_MISS) {
                return $default;
            }
            return $cached ?? $default;
        }

        try {
            $setting = static::query()
                ->whereRaw('`key` = ?', [$key])
                ->first();
        } catch (\Throwable $e) {
            return $default;
        }

        if (!$setting) {
            static::$cachedData[$key] = self::CACHE_MISS;
            return $default;
        }

        $value = $setting['value'] ?? null;
        static::$cachedData[$key] = $value;
        return $value ?? $default;
    }

    public static function getValues(array $keys, array $defaults = []): array
    {
        $values = $defaults;
        if (empty($keys)) {
            return $values;
        }

        $missingKeys = [];
        foreach ($keys as $key) {
            if (array_key_exists($key, static::$cachedData)) {
                $cached = static::$cachedData[$key];
                if ($cached !== self::CACHE_MISS) {
                    $values[$key] = $cached;
                }
            } else {
                $missingKeys[] = $key;
            }
        }

        if (empty($missingKeys)) {
            return $values;
        }

        $placeholders = implode(',', array_fill(0, count($missingKeys), '?'));

        try {
            $settings = static::query()
                ->whereRaw("`key` IN ($placeholders)", $missingKeys)
                ->get();
        } catch (\Throwable $e) {
            return $values;
        }

        $foundKeys = [];
        foreach ($settings as $setting) {
            $settingKey = $setting['key'];
            $settingValue = $setting['value'] ?? null;
            $values[$settingKey] = $settingValue;
            static::$cachedData[$settingKey] = $settingValue;
            $foundKeys[] = $settingKey;
        }

        if (!empty($missingKeys)) {
            $notFound = array_diff($missingKeys, $foundKeys);
            foreach ($notFound as $missingKey) {
                static::$cachedData[$missingKey] = self::CACHE_MISS;
            }
        }

        return $values;
    }

    public static function castBool(mixed $value, bool $default = false): bool
    {
        if ($value === null) {
            return $default;
        }
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value)) {
            return $value === 1;
        }
        if (is_float($value)) {
            return $value != 0.0;
        }
        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return $default;
            }
            $parsed = filter_var($trimmed, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            return $parsed ?? $default;
        }

        return $default;
    }

    public static function getBool(string $key, bool $default = false): bool
    {
        $value = static::getValue($key, null);
        return static::castBool($value, $default);
    }

    public static function upsertValue(string $key, mixed $value): bool
    {
        $normalized = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
        $existing = static::query()
            ->whereRaw('`key` = ?', [$key])
            ->first();
        $existingValue = $existing ? ($existing['value'] ?? null) : null;
        $existingId = $existing ? ($existing[static::$primaryKey] ?? null) : null;

        $pdo = static::getPDO();
        $query = "INSERT INTO " . static::$table . " (`key`, `value`) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)";
        static::addHistoryEntry($query, [$key, $normalized]);
        $stmt = $pdo->prepare($query);
        $result = $stmt->execute([$key, $normalized]);
        unset(static::$cachedData[$key]);

        if ($result && AuditContext::shouldAudit(static::$table)) {
            $recordId = $existingId;
            if (!$recordId) {
                $fresh = static::query()
                    ->whereRaw('`key` = ?', [$key])
                    ->first();
                $recordId = $fresh ? ($fresh[static::$primaryKey] ?? null) : null;
            }

            $action = $existing ? 'update' : 'create';
            $changes = [];
            if ($existing) {
                if (AuditContext::valuesDiffer($existingValue, $normalized)) {
                    $changes['value'] = ['from' => $existingValue, 'to' => $normalized];
                }
            } else {
                $changes['key'] = ['from' => null, 'to' => $key];
                $changes['value'] = ['from' => null, 'to' => $normalized];
            }

            if (!empty($changes)) {
                AuditContext::log(
                    $action,
                    static::$table,
                    $recordId ? (string) $recordId : null,
                    $changes
                );
            }
        }

        return $result;
    }
}
