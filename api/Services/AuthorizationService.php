<?php

declare(strict_types=1);

namespace Api\Services;

/**
 * Authorization Service with ACL (Access Control List)
 * Roles: admin, support, client
 */
class AuthorizationService
{
    private const ROLES = ['admin', 'support', 'client'];

    // Resource permissions map
    private const PERMISSIONS = [
        'admin' => [
            'users' => ['create', 'read', 'update', 'delete', 'invite'],
            'profile' => ['read', 'update'],
        ],
        'support' => [
            'users' => ['read'],
            'profile' => ['read', 'update'],
        ],
        'client' => [
            'profile' => ['read', 'update'],
        ],
    ];

    private const OWNER_RESOURCES = [
        'profile' => 'id',
    ];

    public function can(string $role, string $resource, string $action): bool
    {
        if (!isset(self::PERMISSIONS[$role])) {
            return false;
        }

        $resourcePerms = self::PERMISSIONS[$role][$resource] ?? [];
        return in_array($action, $resourcePerms, true);
    }

    public function canAccessRecord(string $role, string $resource, array $record, int $userId): bool
    {
        if ($role === 'admin') {
            return true;
        }

        if (isset(self::OWNER_RESOURCES[$resource])) {
            $ownerField = self::OWNER_RESOURCES[$resource];
            if (isset($record[$ownerField]) && (int) $record[$ownerField] === $userId) {
                return true;
            }
        }

        return $this->can($role, $resource, 'read');
    }

    public function getPermissions(string $role): array
    {
        return self::PERMISSIONS[$role] ?? [];
    }

    public function isValidRole(string $role): bool
    {
        return in_array($role, self::ROLES, true);
    }

    public function isPrivilegedRole(string $role): bool
    {
        return in_array($role, ['admin', 'support'], true);
    }

    public function getRoleLevel(string $role): int
    {
        return match ($role) {
            'admin' => 3,
            'support' => 2,
            default => 1,
        };
    }

    public function hasHigherOrEqualPrivilege(string $roleA, string $roleB): bool
    {
        return $this->getRoleLevel($roleA) >= $this->getRoleLevel($roleB);
    }
}
