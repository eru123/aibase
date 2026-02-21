<?php

declare(strict_types=1);

namespace Api\Models;

class AuthLog extends BaseModel
{
    protected static string $table = 'auth_logs';

    protected function getFillable(): array
    {
        return ['user_id', 'action', 'ip_address', 'user_agent', 'details'];
    }
}
