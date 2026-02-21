<?php

declare(strict_types=1);

namespace Api\Models;

class OtpMethod extends BaseModel
{
    protected static string $table = 'otp_methods';

    protected function getFillable(): array
    {
        return ['name', 'type'];
    }
}
