<?php

declare(strict_types=1);

namespace Api\Models;

class User extends BaseModel
{
    protected static string $table = 'users';

    protected function getFillable(): array
    {
        return [
            'username',
            'display_name',
            'avatar_url',
            'email',
            'password_hash',
            'role',
            'is_active',
            'deactivated_at',
            'is_approved',
            'is_rejected',
            'approved_at',
            'approved_by',
            'email_verified_at',
            'email_verification_token',
            'email_verification_expires',
            'timezone',
            'currency',
            'preferences',
            'mfa_enabled',
            'mfa_method',
            'password_history',
            'password_changed_at',
            'password_expires_at',
            'password_reset_token',
            'password_reset_expires',
        ];
    }

    protected function getHidden(): array
    {
        return [
            'password_hash',
            'password_history',
            'password_reset_token',
            'password_reset_expires',
            'email_verification_token',
            'email_verification_expires',
        ];
    }
    public function organizations(): array
    {
        $sql = "SELECT o.*, ou.role as organization_role,
                (SELECT COUNT(*) FROM organization_users WHERE organization_id = o.id) as members_count
                FROM organizations o 
                JOIN organization_users ou ON o.id = ou.organization_id 
                WHERE ou.user_id = :user_id";
        
        return self::rawQuery($sql, ['user_id' => $this->id]);
    }
}
