<?php

namespace Api\Models;

class ApiKey extends BaseModel
{
    protected static string $table = 'api_keys';
    protected static string $primaryKey = 'id';

    protected static array $fillable = [
        'name',
        'key_hash',
        'user_id',
        'permissions',
        'last_used_at',
        'expires_at',
        'is_active',
        'ip_whitelist',
        'rate_limit',
        'metadata'
    ];

    protected static array $casts = [
        'id' => 'int',
        'user_id' => 'int',
        'permissions' => 'json',
        'is_active' => 'bool',
        'ip_whitelist' => 'json',
        'rate_limit' => 'int',
        'metadata' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    /**
     * Get user relationship
     */
    public function user(): ?User
    {
        if (!$this->user_id) {
            return null;
        }
        return User::find($this->user_id);
    }

    /**
     * Check if API key has a specific permission
     */
    public function hasPermission(string $permission): bool
    {
        if (!$this->permissions) {
            return false;
        }

        $permissions = is_array($this->permissions) ? $this->permissions : json_decode($this->permissions, true);
        
        // Check for wildcard permission
        if (in_array('*', $permissions)) {
            return true;
        }

        // Check for exact permission match
        if (in_array($permission, $permissions)) {
            return true;
        }

        // Check for prefix permission (e.g., "users.*" matches "users.read")
        foreach ($permissions as $p) {
            if (str_ends_with($p, '.*')) {
                $prefix = substr($p, 0, -2);
                if (str_starts_with($permission, $prefix . '.')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if API key is valid
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expires_at && strtotime($this->expires_at) < time()) {
            return false;
        }

        return true;
    }

    /**
     * Check if IP is whitelisted
     */
    public function isIpAllowed(string $ip): bool
    {
        if (!$this->ip_whitelist) {
            return true; // No whitelist means all IPs allowed
        }

        $whitelist = is_array($this->ip_whitelist) ? $this->ip_whitelist : json_decode($this->ip_whitelist, true);
        
        return in_array($ip, $whitelist);
    }

    /**
     * Update last used timestamp
     */
    public function markAsUsed(): void
    {
        $this->last_used_at = date('Y-m-d H:i:s');
        $this->save();
    }
}
