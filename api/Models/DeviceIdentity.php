<?php

declare(strict_types=1);

namespace Api\Models;

class DeviceIdentity extends BaseModel
{
    protected static string $table = 'device_identity';

    protected function getFillable(): array
    {
        return ['user_id', 'device_hash', 'verified', 'verification_token'];
    }
}
