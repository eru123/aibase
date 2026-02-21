<?php

declare(strict_types=1);

namespace Api\Controllers\Middleware;

use Api\Context;

/**
 * Authentication and authorization middleware helpers.
 */
class AuthMiddleware
{
    /**
     * Ensure the request has a valid authenticated user.
     */
    public static function auth(): callable
    {
        return function (Context $ctx) {
            $user = $ctx->user();
            if (!$user) {
                $ctx->http(401);
                return [
                    'error' => true,
                    'message' => 'Unauthorized'
                ];
            }

            return true;
        };
    }

    /**
     * Ensure the authenticated user has one of the required roles.
     */
    public static function roles(string ...$roles): callable
    {
        return function (Context $ctx) use ($roles) {
            $user = $ctx->user();
            if (!$user) {
                $ctx->http(401);
                return [
                    'error' => true,
                    'message' => 'Unauthorized'
                ];
            }

            if (!in_array($user['role'], $roles, true)) {
                $ctx->http(403);
                return [
                    'error' => true,
                    'message' => 'Forbidden'
                ];
            }

            return true;
        };
    }

    /**
     * Ensure the authenticated user has a specific permission against a resource.
     */
    public static function permission(string $resource, string $action): callable
    {
        return function (Context $ctx) use ($resource, $action) {
            $user = $ctx->user();
            if (!$user) {
                $ctx->http(401);
                return [
                    'error' => true,
                    'message' => 'Unauthorized'
                ];
            }

            $authorization = $ctx->service('authorization');
            if (!$authorization->can($user['role'], $resource, $action)) {
                $ctx->http(403);
                return [
                    'error' => true,
                    'message' => 'Forbidden'
                ];
            }

            return true;
        };
    }
}
