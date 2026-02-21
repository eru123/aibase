<?php

declare(strict_types=1);

namespace Api\Services;

use Api\Models\AuditLog;

class AuditContext
{
    private static array $context = [];
    private static bool $enabled = true;
    private static bool $writing = false;
    private static array $ignoredTables = ['audit_logs'];
    private static array $sensitiveFragments = [
        'password',
        'token',
        'secret',
        'otp',
        'verification',
        'refresh',
    ];

    public static function clear(): void
    {
        self::$context = [];
    }

    public static function setRequestContext(array $context): void
    {
        self::$context = array_merge(self::$context, $context);
    }

    public static function setUser(array $user): void
    {
        if (isset($user['id'])) {
            self::$context['user_id'] = (int) $user['id'];
        }
        if (isset($user['role'])) {
            self::$context['user_role'] = $user['role'];
        }
    }

    public static function enable(): void
    {
        self::$enabled = true;
    }

    public static function disable(): void
    {
        self::$enabled = false;
    }

    public static function shouldAudit(string $resourceType): bool
    {
        return self::$enabled && !self::$writing && !in_array($resourceType, self::$ignoredTables, true);
    }

    public static function valuesDiffer($oldValue, $newValue): bool
    {
        return self::normalizeValue($oldValue) !== self::normalizeValue($newValue);
    }

    public static function log(
        string $action,
        string $resourceType,
        ?string $resourceId,
        ?array $changes = null,
        ?array $metadata = null
    ): void {
        if (!self::shouldAudit($resourceType)) {
            return;
        }

        $payload = [
            'user_id' => self::$context['user_id'] ?? null,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => self::$context['ip_address'] ?? null,
            'user_agent' => self::$context['user_agent'] ?? null,
            'changes' => self::sanitizeChanges($changes),
            'metadata' => self::mergeMetadata($metadata),
        ];

        self::$writing = true;
        try {
            AuditLog::log($payload);
        } finally {
            self::$writing = false;
        }
    }

    private static function mergeMetadata(?array $metadata): ?array
    {
        $base = [];
        if (!empty(self::$context['method'])) {
            $base['method'] = self::$context['method'];
        }
        if (!empty(self::$context['path'])) {
            $base['path'] = self::$context['path'];
        }
        if (!empty(self::$context['query'])) {
            $base['query'] = self::$context['query'];
        }
        if (!empty(self::$context['user_role'])) {
            $base['user_role'] = self::$context['user_role'];
        }

        if ($metadata) {
            $base = array_merge($base, $metadata);
        }

        return empty($base) ? null : $base;
    }

    private static function sanitizeChanges(?array $changes): ?array
    {
        if ($changes === null) {
            return null;
        }

        $sanitized = [];
        foreach ($changes as $field => $diff) {
            if (!is_array($diff)) {
                continue;
            }

            $sanitized[$field] = [
                'from' => self::sanitizeValue((string) $field, $diff['from'] ?? null),
                'to' => self::sanitizeValue((string) $field, $diff['to'] ?? null),
            ];
        }

        return $sanitized;
    }

    private static function sanitizeValue(string $field, $value)
    {
        if ($value === null) {
            return null;
        }

        if (self::isSensitiveField($field)) {
            return '[redacted]';
        }

        return self::normalizeValue($value);
    }

    private static function isSensitiveField(string $field): bool
    {
        $needle = strtolower($field);
        foreach (self::$sensitiveFragments as $fragment) {
            if (str_contains($needle, $fragment)) {
                return true;
            }
        }
        return false;
    }

    private static function normalizeValue($value)
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(\DateTimeInterface::ATOM);
        }

        if (is_object($value)) {
            if (method_exists($value, '__toString')) {
                return (string) $value;
            }
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            return $encoded === false ? '[unserializable]' : $encoded;
        }

        if (is_array($value)) {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            return $encoded === false ? '[unserializable]' : $encoded;
        }

        return $value;
    }
}
