<?php

declare(strict_types=1);

namespace Api\Services;

use Api\Models\KVStore;

class CacheService
{
    /**
     * Get a value from cache
     * @param string $key
     * @param mixed $default Default value if key not found
     * @return mixed
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $value = KVStore::getValue($key);
        return $value !== null ? $value : $default;
    }

    /**
     * Set a value in cache
     * @param string $key
     * @param mixed $value
     * @param int $ttlSeconds Time to live in seconds (default 3600 = 1 hour)
     * @return bool
     */
    public static function set(string $key, mixed $value, int $ttlSeconds = 3600): bool
    {
        return KVStore::setValue($key, $value, $ttlSeconds);
    }

    /**
     * Delete a value from cache
     * @param string $key
     * @return bool
     */
    public static function delete(string $key): bool
    {
        return KVStore::deleteValue($key);
    }

    /**
     * Check if a key exists in cache
     * @param string $key
     * @return bool
     */
    public static function has(string $key): bool
    {
        return KVStore::has($key);
    }

    /**
     * Get or set a value with a callback
     * If the key exists, return its value. Otherwise, execute the callback,
     * store its result, and return it.
     * 
     * @param string $key
     * @param callable $callback Function to execute if key doesn't exist
     * @param int $ttlSeconds Time to live in seconds (default 3600 = 1 hour)
     * @return mixed
     */
    public static function remember(string $key, callable $callback, int $ttlSeconds = 3600): mixed
    {
        $value = static::get($key);
        
        if ($value !== null) {
            return $value;
        }

        $value = $callback();
        static::set($key, $value, $ttlSeconds);
        
        return $value;
    }

    /**
     * Get multiple values from cache
     * @param array $keys
     * @param mixed $default Default value for missing keys
     * @return array Associative array of key => value
     */
    public static function many(array $keys, mixed $default = null): array
    {
        $result = [];
        foreach ($keys as $key) {
            $result[$key] = static::get($key, $default);
        }
        return $result;
    }

    /**
     * Set multiple values in cache
     * @param array $values Associative array of key => value
     * @param int $ttlSeconds Time to live in seconds (default 3600 = 1 hour)
     * @return bool True if all succeeded
     */
    public static function setMany(array $values, int $ttlSeconds = 3600): bool
    {
        $success = true;
        foreach ($values as $key => $value) {
            if (!static::set($key, $value, $ttlSeconds)) {
                $success = false;
            }
        }
        return $success;
    }

    /**
     * Increment a numeric value
     * @param string $key
     * @param int $amount Amount to increment (default 1)
     * @return int The new value
     */
    public static function increment(string $key, int $amount = 1): int
    {
        return KVStore::increment($key, $amount);
    }

    /**
     * Decrement a numeric value
     * @param string $key
     * @param int $amount Amount to decrement (default 1)
     * @return int The new value
     */
    public static function decrement(string $key, int $amount = 1): int
    {
        return KVStore::increment($key, -$amount);
    }

    /**
     * Get all keys matching a pattern
     * Supports wildcard * (e.g., 'user:*', '*:session')
     * @param string $pattern
     * @return array
     */
    public static function keys(string $pattern = '*'): array
    {
        return KVStore::keys($pattern);
    }

    /**
     * Delete multiple keys
     * @param array $keys
     * @return int Number of keys deleted
     */
    public static function deleteMany(array $keys): int
    {
        $deleted = 0;
        foreach ($keys as $key) {
            if (static::delete($key)) {
                $deleted++;
            }
        }
        return $deleted;
    }

    /**
     * Flush cache entries matching a pattern
     * @param string|null $pattern Pattern to match (null = flush all)
     * @return int Number of entries deleted
     */
    public static function flush(?string $pattern = null): int
    {
        return KVStore::flush($pattern);
    }

    /**
     * Clean up expired cache entries
     * @return int Number of entries deleted
     */
    public static function cleanup(): int
    {
        return KVStore::cleanup();
    }

    /**
     * Store data temporarily (5 minutes default)
     * Useful for OTP codes, temporary tokens, etc.
     * @param string $key
     * @param mixed $value
     * @param int $minutes Time in minutes (default 5)
     * @return bool
     */
    public static function temporary(string $key, mixed $value, int $minutes = 5): bool
    {
        return static::set($key, $value, $minutes * 60);
    }

    /**
     * Get and delete a value (pull)
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function pull(string $key, mixed $default = null): mixed
    {
        $value = static::get($key, $default);
        static::delete($key);
        return $value;
    }

    /**
     * Add a value only if it doesn't exist
     * @param string $key
     * @param mixed $value
     * @param int $ttlSeconds
     * @return bool True if added, false if key already exists
     */
    public static function add(string $key, mixed $value, int $ttlSeconds = 3600): bool
    {
        if (static::has($key)) {
            return false;
        }
        return static::set($key, $value, $ttlSeconds);
    }

    /**
     * Create a cache key from components
     * @param string ...$parts
     * @return string
     */
    public static function key(string ...$parts): string
    {
        return implode(':', array_map(fn($part) => str_replace(':', '_', $part), $parts));
    }
}
