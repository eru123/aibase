<?php

declare(strict_types=1);

namespace Api\Models;

class MarketingEmailRequest extends BaseModel
{
    protected static string $table = 'marketing_email_requests';

    protected function getFillable(): array
    {
        return [
            'id',
            'marketing_email_template_id',
            'customer_group_id',
            'requested_by',
            'subject',
            'body_html',
            'status',
            'total_recipients',
            'sent_count',
            'failed_count',
            'error_message',
            'requested_at',
            'processed_at',
            'created_at',
            'updated_at',
        ];
    }
}
