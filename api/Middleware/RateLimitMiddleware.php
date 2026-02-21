<?php

declare(strict_types=1);

namespace Api\Middleware;

use Api\Context;
use Api\Services\CacheService;

/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting request frequency per IP/user
 * Uses database-backed caching for distributed rate limiting
 */
class RateLimitMiddleware
{
    private const CACHE_PREFIX = 'ratelimit';

    /**
     * Generate a cache key for rate limiting
     */
    private function getCacheKey(string $identifier): string
    {
        return CacheService::key(self::CACHE_PREFIX, $identifier);
    }

    /**
     * Check rate limit for a given identifier
     * 
     * @param Context $ctx
     * @param int $maxRequests Maximum requests allowed in the window
     * @param int $windowSeconds Time window in seconds (default: 60)
     * @param string|null $identifier Custom identifier (default: IP address)
     * @return bool|array True if allowed, error array if rate limited
     */
    public function check(
        Context $ctx,
        int $maxRequests = 60,
        int $windowSeconds = 60,
        ?string $identifier = null
    ): bool|array {
        // Get identifier (IP or custom)
        $id = $identifier ?? $this->getClientIp($ctx);
        $cacheKey = $this->getCacheKey($id);
        $now = time();

        // Get current limit data from cache
        $data = CacheService::get($cacheKey);

        // Check if key exists and is still within window
        if ($data !== null) {
            // Check if limit exceeded
            if ($data['count'] >= $maxRequests) {
                $ctx->http(429);
                $retryAfter = $data['reset_at'] - $now;
                
                return [
                    'error' => true,
                    'message' => 'Too many requests. Please try again later.',
                    'retry_after' => $retryAfter,
                    'limit' => $maxRequests,
                    'window' => $windowSeconds
                ];
            }
            
            // Increment counter
            $data['count']++;
            $ttl = $data['reset_at'] - $now;
            CacheService::set($cacheKey, $data, max(1, $ttl));
            return true;
        }
        
        // First request from this identifier
        $newData = [
            'count' => 1,
            'reset_at' => $now + $windowSeconds,
            'first_request' => $now
        ];
        CacheService::set($cacheKey, $newData, $windowSeconds);
        return true;
    }

    /**
     * Strict rate limit for sensitive endpoints (login, password reset)
     */
    public function checkStrict(Context $ctx, ?string $identifier = null): bool|array
    {
        return $this->check($ctx, 5, 300, $identifier); // 5 requests per 5 minutes
    }

    /**
     * Standard rate limit for API endpoints
     */
    public function checkStandard(Context $ctx, ?string $identifier = null): bool|array
    {
        return $this->check($ctx, 60, 60, $identifier); // 60 requests per minute
    }

    /**
     * Relaxed rate limit for read operations
     */
    public function checkRelaxed(Context $ctx, ?string $identifier = null): bool|array
    {
        return $this->check($ctx, 120, 60, $identifier); // 120 requests per minute
    }

    /**
     * Rate limit by user ID (for authenticated endpoints)
     */
    public function checkByUser(
        Context $ctx,
        int $maxRequests = 100,
        int $windowSeconds = 60
    ): bool|array {
        $user = $ctx->user();
        if (!$user) {
            // Fall back to IP-based limiting
            return $this->check($ctx, $maxRequests, $windowSeconds);
        }
        
        $identifier = 'user_' . $user['id'];
        return $this->check($ctx, $maxRequests, $windowSeconds, $identifier);
    }

    /**
     * Get client IP address
     */
    private function getClientIp(Context $ctx): string
    {
        // Check for IP in various headers (proxy support)
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR'
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // For X-Forwarded-For, take the first IP
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                return $ip;
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    /**
     * Get current rate limit status for identifier
     */
    public function getStatus(Context $ctx, ?string $identifier = null, int $maxRequests = 60): array
    {
        $id = $identifier ?? $this->getClientIp($ctx);
        $cacheKey = $this->getCacheKey($id);
        $data = CacheService::get($cacheKey);
        
        if ($data === null) {
            return [
                'requests' => 0,
                'remaining' => $maxRequests,
                'reset_at' => null
            ];
        }

        $now = time();
        
        if ($data['reset_at'] < $now) {
            return [
                'requests' => 0,
                'remaining' => $maxRequests,
                'reset_at' => null
            ];
        }

        return [
            'requests' => $data['count'],
            'remaining' => max(0, $maxRequests - $data['count']),
            'reset_at' => $data['reset_at']
        ];
    }

    /**
     * Clear rate limit for a specific identifier (admin function)
     */
    public function clear(?string $identifier = null): void
    {
        if ($identifier === null) {
            // Clear all rate limit entries
            CacheService::flush(self::CACHE_PREFIX . ':*');
        } else {
            $cacheKey = $this->getCacheKey($identifier);
            CacheService::delete($cacheKey);
        }
    }
}
