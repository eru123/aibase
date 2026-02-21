<?php

declare(strict_types=1);

namespace Api\Models;

class ErrorLog extends BaseModel
{
    protected static string $table = 'error_logs';
    protected static string $primaryKey = 'id';

    protected array $fillable = [
        'id',
        'request',
        'data',
        'created_at',
    ];

    /**
     * Log an error with the current HTTP request context and error data.
     *
     * @param array<string, mixed> $errorData  Arbitrary error payload (exception info, mysql history, etc.)
     * @param array<string, mixed>|null $requestOverride  Override auto-detected request info
     */
    public static function capture(array $errorData, ?array $requestOverride = null): ?self
    {
        $request = $requestOverride ?? self::buildRequestSnapshot();

        $log = new static([
            'request' => json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'data'    => json_encode($errorData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        $log->save();
        return $log;
    }

    /**
     * Build a snapshot of the current HTTP request.
     *
     * @return array<string, mixed>
     */
    private static function buildRequestSnapshot(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace('_', '-', substr($key, 5));
                $headers[ucwords(strtolower($name), '-')] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['Content-Length'] = $_SERVER['CONTENT_LENGTH'];
        }

        // Redact Authorization header
        if (isset($headers['Authorization'])) {
            $headers['Authorization'] = '***REDACTED***';
        }

        // Redact Cookie header
        if (isset($headers['Cookie'])) {
            $headers['Cookie'] = '***REDACTED***';
        }

        // Read raw body once
        $rawBody = $GLOBALS['__RAW_INPUT__'] ?? $GLOBALS['__TEST_RAW_INPUT__'] ?? null;
        $payload = null;
        if (is_string($rawBody) && $rawBody !== '') {
            $decoded = json_decode($rawBody, true);
            $payload = json_last_error() === JSON_ERROR_NONE ? $decoded : $rawBody;
        }

        return [
            'method'  => $_SERVER['REQUEST_METHOD'] ?? 'GET',
            'url'     => $_SERVER['REQUEST_URI'] ?? '/',
            'query'   => $_GET ?? [],
            'headers' => $headers,
            'payload' => $payload,
            'ip'      => $_SERVER['REMOTE_ADDR'] ?? null,
        ];
    }
}
