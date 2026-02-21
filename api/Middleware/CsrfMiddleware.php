<?php

declare(strict_types=1);

namespace Api\Middleware;

use Api\Context;

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */
class CsrfMiddleware
{
    private const TOKEN_LENGTH = 32;
    private const TOKEN_LIFETIME = 7200; // 2 hours
    private string $storageFile;
    private array $tokens = [];

    public function __construct()
    {
        // Store CSRF tokens in uploads/csrf_tokens.json
        $this->storageFile = __DIR__ . '/../../uploads/csrf_tokens.json';
        $this->loadTokens();
        $this->cleanup();
    }

    /**
     * Load CSRF tokens from storage
     */
    private function loadTokens(): void
    {
        if (file_exists($this->storageFile)) {
            $data = file_get_contents($this->storageFile);
            $this->tokens = json_decode($data, true) ?? [];
        }
    }

    /**
     * Save CSRF tokens to storage
     */
    private function saveTokens(): void
    {
        $dir = dirname($this->storageFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($this->storageFile, json_encode($this->tokens));
    }

    /**
     * Clean up expired tokens
     */
    private function cleanup(): void
    {
        $now = time();
        foreach ($this->tokens as $token => $data) {
            if ($data['expires_at'] < $now) {
                unset($this->tokens[$token]);
            }
        }
    }

    /**
     * Generate a new CSRF token
     * 
     * @param Context $ctx
     * @param string|null $identifier Optional identifier (user ID, session ID)
     * @return string The generated token
     */
    public function generateToken(Context $ctx, ?string $identifier = null): string
    {
        // Generate random token
        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));
        
        // Get identifier (user ID if authenticated, or session/IP)
        if ($identifier === null) {
            $user = $ctx->user();
            $identifier = $user ? 'user_' . $user['id'] : $this->getClientIdentifier($ctx);
        }
        
        // Store token with metadata
        $this->tokens[$token] = [
            'identifier' => $identifier,
            'created_at' => time(),
            'expires_at' => time() + self::TOKEN_LIFETIME,
            'used' => false
        ];
        
        $this->saveTokens();
        
        return $token;
    }

    /**
     * Validate CSRF token
     * 
     * @param Context $ctx
     * @param string $token Token to validate
     * @param bool $singleUse If true, token can only be used once
     * @return bool|array True if valid, error array if invalid
     */
    public function validateToken(
        Context $ctx,
        string $token,
        bool $singleUse = false
    ): bool|array {
        // Check if token exists
        if (!isset($this->tokens[$token])) {
            return $this->csrfError($ctx, 'Invalid CSRF token');
        }
        
        $tokenData = $this->tokens[$token];
        
        // Check if token is expired
        if ($tokenData['expires_at'] < time()) {
            unset($this->tokens[$token]);
            $this->saveTokens();
            return $this->csrfError($ctx, 'CSRF token has expired');
        }
        
        // Check if token was already used (for single-use tokens)
        if ($singleUse && $tokenData['used']) {
            return $this->csrfError($ctx, 'CSRF token has already been used');
        }
        
        // Verify token belongs to current user/session
        $user = $ctx->user();
        $currentIdentifier = $user ? 'user_' . $user['id'] : $this->getClientIdentifier($ctx);
        
        if ($tokenData['identifier'] !== $currentIdentifier) {
            return $this->csrfError($ctx, 'CSRF token mismatch');
        }
        
        // Mark token as used if single-use
        if ($singleUse) {
            $this->tokens[$token]['used'] = true;
            $this->saveTokens();
        }
        
        return true;
    }

    /**
     * Middleware to check CSRF token on state-changing requests
     * 
     * @param Context $ctx
     * @param bool $singleUse If true, token can only be used once
     * @return bool|array True if valid, error array if invalid
     */
    public function check(Context $ctx, bool $singleUse = false): bool|array
    {
        $method = $ctx->method();
        
        // Only check CSRF for state-changing methods
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return true;
        }
        
        // Get token from header or body
        $token = $this->extractToken($ctx);
        
        if (!$token) {
            return $this->csrfError($ctx, 'CSRF token is required');
        }
        
        return $this->validateToken($ctx, $token, $singleUse);
    }

    /**
     * Extract CSRF token from request
     */
    private function extractToken(Context $ctx): ?string
    {
        // Check X-CSRF-Token header
        $headers = getallheaders();
        if (isset($headers['X-CSRF-Token'])) {
            return $headers['X-CSRF-Token'];
        }
        if (isset($headers['x-csrf-token'])) {
            return $headers['x-csrf-token'];
        }
        
        // Check request body
        $body = $ctx->getJsonBody();
        if (isset($body['_csrf_token'])) {
            return $body['_csrf_token'];
        }
        
        // Check query parameter (not recommended but supported)
        if ($token = $ctx->query('_csrf_token')) {
            return $token;
        }
        
        return null;
    }

    /**
     * Get client identifier (IP + User Agent)
     */
    private function getClientIdentifier(Context $ctx): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        return md5($ip . $userAgent);
    }

    /**
     * Return CSRF error response
     */
    private function csrfError(Context $ctx, string $message): array
    {
        $ctx->http(403);
        return [
            'error' => true,
            'message' => $message,
            'code' => 'CSRF_TOKEN_INVALID'
        ];
    }

    /**
     * Refresh token (generate new one and optionally invalidate old)
     */
    public function refreshToken(Context $ctx, ?string $oldToken = null): string
    {
        // Invalidate old token if provided
        if ($oldToken && isset($this->tokens[$oldToken])) {
            unset($this->tokens[$oldToken]);
            $this->saveTokens();
        }
        
        return $this->generateToken($ctx);
    }

    /**
     * Clear all tokens for a specific identifier
     */
    public function clearTokens(?string $identifier = null): void
    {
        if ($identifier === null) {
            $this->tokens = [];
        } else {
            foreach ($this->tokens as $token => $data) {
                if ($data['identifier'] === $identifier) {
                    unset($this->tokens[$token]);
                }
            }
        }
        $this->saveTokens();
    }

    /**
     * Get a new CSRF token for the current user
     * This is used by endpoints that need to provide a token to the client
     */
    public function getToken(Context $ctx): string
    {
        return $this->generateToken($ctx);
    }
}
