<?php

declare(strict_types=1);

namespace Api\Models;

class Session extends BaseModel
{
    protected static string $table = 'sessions';

    protected function getFillable(): array
    {
        return ['user_id', 'token', 'expires_at'];
    }

    protected function getHidden(): array
    {
        return ['token'];
    }
}
