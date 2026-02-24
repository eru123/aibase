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
            'first_name',
            'middle_name',
            'last_name',
            'company_name',
            'phone',
            'email',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }
}
