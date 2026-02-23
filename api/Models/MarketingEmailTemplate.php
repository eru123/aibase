<?php

declare(strict_types=1);

namespace Api\Models;

class MarketingEmailTemplate extends BaseModel
{
    protected static string $table = 'marketing_email_templates';

    protected function getFillable(): array
    {
        return [
            'id',
            'name',
            'subject',
            'body_html',
            'body_text',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }
}
