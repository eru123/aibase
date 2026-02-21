<?php

declare(strict_types=1);

namespace Api\Models;

class Audit extends BaseModel
{
    protected static string $table = 'audits';

    protected function getFillable(): array
    {
        return ['user_id', 'action', 'table_name', 'record_id', 'old_data', 'new_data'];
    }
}
