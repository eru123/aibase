<?php

declare(strict_types=1);

namespace Api\Middleware;

use Api\Context;
use Api\Services\AuthenticationService;
use Api\Services\AuthorizationService;

class AuthMiddleware
{
    private AuthenticationService $auth;
    private AuthorizationService $authz;

    public function __construct(AuthenticationService $auth, AuthorizationService $authz)
    {
        $this->auth = $auth;
        $this->authz = $authz;
    }

    public function authenticate(Context $ctx): bool|array
    {
        $user = $ctx->user();

        if (!$user) {
            $ctx->http(401);
            return [
                'error' => true,
                'message' => 'Authentication required',
            ];
        }

        return true;
    }

    public function requireRole(Context $ctx, string ...$roles): bool|array
    {
        $user = $ctx->user();

        if (!$user) {
            $ctx->http(401);
            return [
                'error' => true,
                'message' => 'Authentication required',
            ];
        }

        if (!in_array($user['role'], $roles, true)) {
            $ctx->http(403);
            return [
                'error' => true,
                'message' => 'Insufficient permissions',
            ];
        }

        return true;
    }

    public function can(Context $ctx, string $resource, string $action): bool|array
    {
        $user = $ctx->user();

        if (!$user) {
            $ctx->http(401);
            return [
                'error' => true,
                'message' => 'Authentication required',
            ];
        }

        if (!$this->authz->can($user['role'], $resource, $action)) {
            $ctx->http(403);
            return [
                'error' => true,
                'message' => 'Insufficient permissions',
            ];
        }

        return true;
    }

    public function canAccessRecord(Context $ctx, string $resource, array $record): bool|array
    {
        $user = $ctx->user();

        if (!$user) {
            $ctx->http(401);
            return [
                'error' => true,
                'message' => 'Authentication required',
            ];
        }

        if (!$this->authz->canAccessRecord($user['role'], $resource, $record, (int) $user['id'])) {
            $ctx->http(403);
            return [
                'error' => true,
                'message' => 'Access denied to this record',
            ];
        }

        return true;
    }

    public function requireAdmin(Context $ctx): bool|array
    {
        return $this->requireRole($ctx, 'admin');
    }

    public function requireSupportOrAdmin(Context $ctx): bool|array
    {
        return $this->requireRole($ctx, 'admin', 'support');
    }

    public function requireClientOrAdmin(Context $ctx): bool|array
    {
        return $this->requireRole($ctx, 'admin', 'client');
    }

}
