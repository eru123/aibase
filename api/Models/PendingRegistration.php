<?php

declare(strict_types=1);

namespace Api\Models;

class PendingRegistration extends BaseModel
{
    protected static string $table = 'pending_registrations';

    protected function getFillable(): array
    {
        return [
            'id',
            'username',
            'email',
            'password_hash',
            'role',
            'verification_code_hash',
            'verification_expires_at',
            'attempts',
            'created_at',
            'updated_at',
        ];
    }
}
