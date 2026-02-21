<?php

declare(strict_types=1);

namespace Api\Models;

class UserOtp extends BaseModel
{
    protected static string $table = 'user_otps';

    protected function getFillable(): array
    {
        return ['user_id', 'otp_method_id', 'secret', 'enabled'];
    }

    protected function getHidden(): array
    {
        return ['secret'];
    }
}
