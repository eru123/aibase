<?php

declare(strict_types=1);

namespace Api\Models;

class UserSetting extends BaseModel
{
    protected static string $table = 'user_settings';

    protected function getFillable(): array
    {
        return ['user_id', 'key', 'value'];
    }
}
