<?php

declare(strict_types=1);

namespace Api\Models;

class EmailTemplate extends BaseModel
{
    protected static string $table = 'email_templates';
    protected static array $cachedByName = [];
    private const CACHE_MISS = '__EMAIL_TEMPLATE_MISS__';

    protected function getFillable(): array
    {
        return [
            'id',
            'name',
            'description',
            'subject',
            'body_html',
            'body_text',
            'sample_data',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }

    public static function getByName(string $name): ?array
    {
        if (array_key_exists($name, static::$cachedByName)) {
            $cached = static::$cachedByName[$name];
            return $cached === self::CACHE_MISS ? null : $cached;
        }

        try {
            $template = static::query()
                ->where('name', $name)
                ->first();
        } catch (\Throwable $e) {
            return null;
        }

        if (!$template) {
            static::$cachedByName[$name] = self::CACHE_MISS;
            return null;
        }

        $data = $template->toArray();
        static::$cachedByName[$name] = $data;
        return $data;
    }

    public static function clearCache(?string $name = null): void
    {
        if ($name === null) {
            static::$cachedByName = [];
            return;
        }

        unset(static::$cachedByName[$name]);
    }

    public function save(): bool
    {
        $saved = parent::save();
        if ($saved) {
            static::clearCache();
        }
        return $saved;
    }

    public function delete(): bool
    {
        $deleted = parent::delete();
        if ($deleted) {
            static::clearCache();
        }
        return $deleted;
    }
}
