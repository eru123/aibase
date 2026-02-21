<?php

namespace Api;

use Api\Services\AuditContext;

class Context
{
    private array $__data__ = [];

    public function __construct(public Router|null $router = null, public readonly array $__params__ = []) {}

    public function params(): array
    {
        return $this->__params__;
    }

    public function __set($name, $value)
    {
        $this->__data__[$name] = $value;
    }

    public function __get($name)
    {
        return $this->__data__[$name] ?? null;
    }

    public function __call($name, $arguments)
    {
        if (array_key_exists($name, $this->__data__)) {
            if (count($arguments) === 0 && isset($this->__data__[$name]) && !is_callable($this->__data__[$name])) {
                $this->__data__[$name] = $arguments[0] ?? null;
                return $this;
            } else if (is_callable($this->__data__[$name])) {
                return Callback::call($this->__data__[$name], $arguments);
            }
        }
        return null;
    }

    // Explicit status setter so controllers can call $ctx->http(201)
    public function http(int $status): self
    {
        http_response_code($status);
        return $this;
    }

    public function method(): string
    {
        return match (isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET') {
            'POST' => 'POST',
            'PUT' => 'PUT',
            'DELETE' => 'DELETE',
            'PATCH' => 'PATCH',
            'OPTIONS' => 'OPTIONS',
            'HEAD' => 'HEAD',
            default => 'GET',
        };
    }

    public function getAuthorizationHeader(): ?string
    {
        $headers = null;

        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }

        return $headers;
    }

    public function getBearerToken(): ?string
    {
        $headers = $this->getAuthorizationHeader();
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    public function json()
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $data;
        }
        return null;
    }

    // Helpers for controllers
    public function param(string $key, $default = null)
    {
        return $this->__params__[$key] ?? $default;
    }

    public function query(string $key, $default = null)
    {
        return isset($_GET[$key]) ? $_GET[$key] : $default;
    }

    public function get(string $key, $default = null)
    {
        return isset($_GET[$key]) ? $_GET[$key] : $default;
    }

    public function post(string $key, $default = null)
    {
        return isset($_POST[$key]) ? $_POST[$key] : $default;
    }

    public function header(string $key, $default = null)
    {
        $key = 'HTTP_' . str_replace('-', '_', strtoupper($key));
        return $_SERVER[$key] ?? $default;
    }

    /**
     * Get JSON body
     */
    public function getJsonBody(): array
    {
        $raw = $GLOBALS['__TEST_RAW_INPUT__'] ?? $GLOBALS['__RAW_INPUT__'] ?? file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];
        return is_array($data) ? $data : [];
    }

    /**
     * Get service from container
     */
    public function service(string $name): mixed
    {
        $container = \Api\Services\ServiceContainer::getInstance();
        return $container->get($name);
    }

    /**
     * Get authenticated user
     */
    public function user(): ?\Api\Models\User
    {
        // Check if user is already cached
        if (isset($this->__data__['__user__']) && $this->__data__['__user__'] instanceof \Api\Models\User) {
            return $this->__data__['__user__'];
        }

        $token = $this->getBearerToken();

        if (!$token) {
            return null;
        }

        /** @var \Api\Services\AuthenticationService $auth */
        $auth = $this->service('authentication');
        $userData = $auth->validateToken($token);

        if (!$userData) {
            return null;
        }

        $user = new \Api\Models\User($userData);

        // Cache user
        $this->__data__['__user__'] = $user;
        AuditContext::setUser($userData);

        return $user;
    }

    /**
     * Require authentication
     */
    public function requireAuth(): ?\Api\Models\User
    {
        $user = $this->user();

        if (!$user) {
            $this->http(401);
            echo json_encode(['error' => true, 'message' => 'Unauthorized']);
            exit;
        }

        return $user;
    }

    /**
     * Get authentication middleware
     */
    public function auth(): \Api\Middleware\AuthMiddleware
    {
        return $this->service('authMiddleware');
    }

    /**
     * Get email service
     */
    public function email(): \Api\Services\EmailService
    {
        return $this->service('email');
    }
}
