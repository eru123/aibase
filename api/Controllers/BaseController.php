<?php

namespace Api\Controllers;

use Api\Context;

abstract class BaseController
{
    // Parse JSON body or form data
    protected function input(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') !== false) {
            $raw = $GLOBALS['__TEST_RAW_INPUT__'] ?? $GLOBALS['__RAW_INPUT__'] ?? file_get_contents('php://input');
            $data = json_decode($raw, true) ?? [];
            return is_array($data) ? $data : [];
        }
        return $_POST ?: [];
    }

    protected function json(Context $ctx, $data, int $status = 200)
    {
        $ctx->http($status);
        return $data;
    }

    protected function ok(Context $ctx, $data = null)
    {
        return $this->json($ctx, $data ?? ['success' => true], 200);
    }

    protected function created(Context $ctx, $data = null)
    {
        return $this->json($ctx, $data ?? ['success' => true], 201);
    }

    protected function notFound(Context $ctx, string $message = 'Not Found')
    {
        return $this->json($ctx, ['error' => true, 'message' => $message], 404);
    }

    protected function badRequest(Context $ctx, string $message = 'Bad Request', array $errors = [])
    {
        return $this->json($ctx, ['error' => true, 'message' => $message, 'errors' => $errors], 400);
    }

    protected function unauthorized(Context $ctx, string $message = 'Unauthorized')
    {
        return $this->json($ctx, ['error' => true, 'message' => $message], 401);
    }

    protected function forbidden(Context $ctx, string $message = 'Forbidden')
    {
        return $this->json($ctx, ['error' => true, 'message' => $message], 403);
    }

    protected function noContent(Context $ctx)
    {
        $ctx->http(204);
        return null;
    }

    protected function error(Context $ctx, string $message = 'Server Error', int $status = 500)
    {
        return $this->json($ctx, ['error' => true, 'message' => $message], $status);
    }

    protected function validate(array $data, array $rules): array
    {
        $errors = [];
        foreach ($rules as $field => $ruleStr) {
            $value = $data[$field] ?? null;
            $rulesArr = array_filter(array_map('trim', explode('|', $ruleStr)));
            foreach ($rulesArr as $rule) {
                if ($rule === 'required' && ($value === null || $value === '')) {
                    $errors[$field][] = 'required';
                } elseif ($rule === 'email' && $value !== null && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[$field][] = 'email';
                } elseif (str_starts_with($rule, 'in:')) {
                    $allowed = explode(',', substr($rule, 3));
                    if ($value !== null && !in_array($value, $allowed, true)) {
                        $errors[$field][] = 'in';
                    }
                }
            }
        }
        return $errors;
    }

    protected function baseUrl(string $uri = ''): string
    {
        $VITE_API_URL = $_ENV['VITE_API_URL'] ?: getenv('VITE_API_URL');
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $VITE_API_URL ?: ($_SERVER['HTTP_HOST'] ?: 'localhost');
        // $host = parse_url($host, PHP_URL_HOST) ?: $host;
        // parse host including port if any
        if (strpos($host, ':') === false) {
            $segments = explode(':', $host);
            $host = $segments[0];
            if (count($segments) === 2) {
                $host = $segments[0] . ':' . $segments[1];
            }
        }

        // make sure host has no protocol prefix
        $host = preg_replace('#^https?://#', '', $host);
        $base = rtrim(rtrim($protocol . $host, '/') . '/' . ltrim($uri, '/'), '/');
       
        return $base;
    }

    protected function appUrl(string $uri = ''): string
    {
        $VITE_APP_URL = $_ENV['VITE_APP_URL'] ?: getenv('VITE_APP_URL');
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $VITE_APP_URL ?: ($_SERVER['HTTP_HOST'] ?: 'localhost');

        // make sure host has no protocol prefix
        $host = preg_replace('#^https?://#', '', $host);
        $base = rtrim(rtrim($protocol . $host, '/') . '/' . ltrim($uri, '/'), '/');
       
        return $base;
    }

    protected function fullUrl(): string
    {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        return $protocol . $host . $requestUri;
    }
}
