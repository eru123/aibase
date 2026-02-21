<?php

namespace Api\Models;

class UserInvitation extends BaseModel
{
    protected static string $table = 'user_invitations';
    protected static string $primaryKey = 'id';

    protected array $fillable = [
        'email',
        'role',
        'invited_by',
        'token',
        'expires_at',
        'accepted_at',
        'status'
    ];

    protected static array $casts = [
        'id' => 'int',
        'invited_by' => 'int',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime'
    ];

    /**
     * Get the user who sent the invitation
     */
    public function inviter(): ?User
    {
        if (!$this->invited_by) {
            return null;
        }
        return User::find($this->invited_by);
    }

    /**
     * Check if invitation is expired
     */
    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false;
        }
        return strtotime($this->expires_at) < time();
    }

    /**
     * Check if invitation is valid
     */
    public function isValid(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }
}
