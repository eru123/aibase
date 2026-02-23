<?php

declare(strict_types=1);

namespace Api\Models;

class CustomerGroup extends BaseModel
{
    protected static string $table = 'customer_groups';

    protected function getFillable(): array
    {
        return [
            'id',
            'name',
            'description',
            'created_at',
            'updated_at',
        ];
    }
}
