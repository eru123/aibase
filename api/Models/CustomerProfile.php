<?php

declare(strict_types=1);

namespace Api\Models;

class CustomerProfile extends BaseModel
{
    protected static string $table = 'customer_profiles';

    protected function getFillable(): array
    {
        return [
            'id',
            'name',
            'email',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }
}
