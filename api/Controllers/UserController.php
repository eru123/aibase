<?php

declare(strict_types = 1)
;

namespace Api\Controllers;

use Api\Context;
use Api\Models\User;
use Api\Services\AuthorizationService;

class UserController extends BaseController
{
    use \Api\Traits\Sortable;

    public function index(Context $ctx)
    {


        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $applyFilters = function ($query) use ($ctx): void {
            $includeRejected = $ctx->query('include_rejected') === 'true';
            if (!$includeRejected) {
                $query->whereRaw('(users.is_rejected IS NULL OR users.is_rejected = 0)');
            }
            if ($role = $ctx->query('role')) {
                $query->where('users.role', $role);
            }

            if (($isActive = $ctx->query('is_active')) !== null) {
                $query->where('users.is_active', $isActive === 'true' ? 1 : 0);
            }

            if (($isApproved = $ctx->query('is_approved')) !== null) {
                $query->where('users.is_approved', $isApproved === 'true' ? 1 : 0);
            }

            if (($isRejected = $ctx->query('is_rejected')) !== null) {
                $query->where('users.is_rejected', $isRejected === 'true' ? 1 : 0);
            }

            if ($search = trim((string)($ctx->query('search') ?? ''))) {
                $searchTerm = '%' . $search . '%';
                $query->whereRaw('(users.username LIKE ? OR users.email LIKE ?)', [$searchTerm, $searchTerm]);
            }
        };

        $query = User::query()->select(['users.*']);
        $applyFilters($query);

        $this->applySorting($query, ['username', 'email', 'created_at', 'role', 'is_active', 'is_approved'], 'created_at', 'desc');

        $users = $query
            ->limit($limit)
            ->offset($offset)
            ->get();

        $users = array_map(static fn(User $user) => $user->toArray(), $users);

        $countQuery = User::query();
        $applyFilters($countQuery);
        $total = $countQuery->count();

        return $this->ok($ctx, [
            'data' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
            ],
        ]);
    }

    public function update(Context $ctx)
    {


        $currentUser = $ctx->requireAuth();
        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /** @var User|null $user */
        $user = User::find($id);
        if (!$user) {
            return $this->notFound($ctx, 'User not found');
        }

        $data = $this->input();
        $allowedFields = ['role', 'is_active', 'display_name', 'avatar_url'];
        $updates = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }

        if (isset($updates['role'])) {
            /** @var AuthorizationService $authz */
            $authz = $ctx->service('authorization');
            $role = strtolower(trim((string)$updates['role']));
            if (!$authz->isValidRole($role)) {
                return $this->badRequest($ctx, 'Invalid role');
            }
            if ((int)$currentUser['id'] === $id && $role !== $user['role']) {
                return $this->badRequest($ctx, 'You cannot change your own role');
            }
            $updates['role'] = $role;
        }

        if (isset($updates['is_active'])) {
            $isActive = filter_var($updates['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive === null) {
                return $this->badRequest($ctx, 'Invalid is_active value');
            }
            if ((int)$currentUser['id'] === $id && $isActive === false) {
                return $this->badRequest($ctx, 'You cannot deactivate your own account');
            }
            $updates['is_active'] = $isActive ? 1 : 0;
            $updates['deactivated_at'] = $isActive ? null : gmdate('Y-m-d H:i:s');
        }

        if (empty($updates)) {
            return $this->badRequest($ctx, 'No valid fields provided');
        }

        foreach ($updates as $field => $value) {
            $user->$field = $value;
        }
        $user->save();

        return $this->ok($ctx, $user->toArray());
    }

    public function approve(Context $ctx)
    {


        $approver = $ctx->requireAuth();
        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /** @var User|null $user */
        $user = User::find($id);
        if (!$user) {
            return $this->notFound($ctx, 'User not found');
        }

        $user->is_approved = 1;
        $user->is_rejected = 0;
        $user->approved_at = gmdate('Y-m-d H:i:s');
        $user->approved_by = (int)$approver['id'];
        $user->is_active = 1;
        $user->deactivated_at = null;
        $user->save();

        $emailService = $ctx->service('email');
        $emailService->sendAccountApproved(
            (string)($user['email'] ?? ''),
            (string)($user['display_name'] ?? $user['username'] ?? '')
        );

        return $this->ok($ctx, [
            'success' => true,
            'user' => $user->toArray(),
        ]);
    }

    public function reject(Context $ctx)
    {


        $currentUser = $ctx->requireAuth();
        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        if ((int)$currentUser['id'] === $id) {
            return $this->badRequest($ctx, 'You cannot reject your own account');
        }

        /** @var User|null $user */
        $user = User::find($id);
        if (!$user) {
            return $this->notFound($ctx, 'User not found');
        }

        $user->is_approved = 0;
        $user->is_rejected = 1;
        $user->approved_at = null;
        $user->approved_by = null;
        $user->is_active = 0;
        $user->deactivated_at = gmdate('Y-m-d H:i:s');
        $user->save();

        $emailService = $ctx->service('email');
        $emailService->sendAccountRejected(
            (string)($user['email'] ?? ''),
            (string)($user['display_name'] ?? $user['username'] ?? '')
        );

        return $this->ok($ctx, [
            'success' => true,
            'user' => $user->toArray(),
        ]);
    }
}
