<?php

declare(strict_types = 1)
;

namespace Api\Models;

use DateTime;

class KVStore extends BaseModel
{
    protected static string $table = 'kv_store';
    protected static string $primaryKey = 'dockey';
    protected static bool $autoIncrement = false;

    protected function getFillable(): array
    {
        return ['dockey', 'docval', 'expired_at'];
    }

    /**
     * Get a value from the store
     * @param string $key
     * @return mixed|null Returns the stored value or null if not found/expired
     */
    public static function getValue(string $key): mixed
    {
        $record = static::query()
            ->where('dockey', $key)
            ->where('expired_at', '>', date('Y-m-d H:i:s'))
            ->first();

        if (!$record) {
            return null;
        }

        return json_decode($record['docval'], true);
    }

    /**
     * Set a value in the store
     * @param string $key
     * @param mixed $value
     * @param int $ttlSeconds Time to live in seconds (default 3600 = 1 hour)
     * @return bool
     */
    public static function setValue(string $key, mixed $value, int $ttlSeconds = 3600): bool
    {
        $expiredAt = date('Y-m-d H:i:s', time() + $ttlSeconds);

        /** @var static|null $existing */
        $existing = static::find($key);

        if ($existing) {
            return static::query()
                ->where('dockey', $key)
                ->update([
                'docval' => json_encode($value),
                'expired_at' => $expiredAt
            ]) > 0;
        }

        return static::create([
            'dockey' => $key,
            'docval' => json_encode($value),
            'expired_at' => $expiredAt
        ]) !== null;
    }

    /**
     * Delete a value from the store
     * @param string $key
     * @return bool
     */
    public static function deleteValue(string $key): bool
    {
        return static::query()->where('dockey', $key)->delete() > 0;
    }

    /**
     * Check if a key exists and is not expired
     * @param string $key
     * @return bool
     */
    public static function has(string $key): bool
    {
        return static::query()
            ->where('dockey', $key)
            ->where('expired_at', '>', date('Y-m-d H:i:s'))
            ->count() > 0;
    }

    /**
     * Increment a numeric value
     * @param string $key
     * @param int $amount
     * @return int The new value
     */
    public static function increment(string $key, int $amount = 1): int
    {
        $current = static::getValue($key);
        $newValue = (int)($current ?? 0) + $amount;

        // Keep same expiration if exists, otherwise default 1 hour
        $existing = static::query()->where('dockey', $key)->first();
        $ttl = 3600; // default 1 hour

        if ($existing && isset($existing['expired_at'])) {
            $expiredAt = strtotime($existing['expired_at']);
            $now = time();
            if ($expiredAt > $now) {
                $ttl = $expiredAt - $now;
            }
        }

        static::setValue($key, $newValue, $ttl);
        return $newValue;
    }

    /**
     * Clean up expired entries
     * @return int Number of deleted records
     */
    public static function cleanup(): int
    {
        return static::query()->where('expired_at', '<=', date('Y-m-d H:i:s'))->delete();
    }

    /**
     * Get all keys matching a pattern
     * @param string $pattern
     * @return array
     */
    public static function keys(string $pattern = '*'): array
    {
        $query = static::query()->where('expired_at', '>', date('Y-m-d H:i:s'));

        if ($pattern !== '*') {
            $likePattern = str_replace('*', '%', $pattern);
            $query->where('dockey', 'LIKE', $likePattern);
        }

        return array_column($query->get(), 'dockey');
    }

    /**
     * Flush all expired or matching keys
     * @param string|null $pattern
     * @return int Number of deleted records
     */
    public static function flush(?string $pattern = null): int
    {
        if ($pattern === null) {
            return static::query()->where('dockey', '!=', '')->delete();
        }

        $likePattern = str_replace('*', '%', $pattern);
        return static::query()->where('dockey', 'LIKE', $likePattern)->delete();
    }
}
