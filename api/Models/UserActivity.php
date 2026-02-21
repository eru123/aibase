<?php

namespace Api\Models;

class UserActivity extends BaseModel
{
    protected string $table = 'user_activities';

    protected array $fillable = [
        'user_id',
        'action',
        'description',
        'ip_address',
        'user_agent',
        'created_at'
    ];

    protected array $casts = [
        'id' => 'int',
        'user_id' => 'int'
    ];
}
