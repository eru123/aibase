<?php

declare(strict_types=1);

namespace Api\Models;

class MarketingEmailRequestRecipient extends BaseModel
{
    protected static string $table = 'marketing_email_request_recipients';

    protected function getFillable(): array
    {
        return [
            'id',
            'marketing_email_request_id',
            'customer_profile_id',
            'name',
            'email',
            'status',
            'error_message',
            'sent_at',
            'created_at',
            'updated_at',
        ];
    }
}
