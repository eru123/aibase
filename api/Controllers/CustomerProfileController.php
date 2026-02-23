<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Context;
use Api\Models\CustomerProfile;

class CustomerProfileController extends BaseController
{
    public function index(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim((string)($ctx->query('search') ?? ''));

        $query = CustomerProfile::query()->select(['customer_profiles.*']);
        if ($search !== '') {
            $term = '%' . $search . '%';
            $query->whereRaw('(customer_profiles.name LIKE ? OR customer_profiles.email LIKE ?)', [$term, $term]);
        }

        $rows = $query->orderBy('customer_profiles.updated_at', 'desc')->limit($limit)->offset($offset)->get();
        $countQuery = CustomerProfile::query();
        if ($search !== '') {
            $term = '%' . $search . '%';
            $countQuery->whereRaw('(customer_profiles.name LIKE ? OR customer_profiles.email LIKE ?)', [$term, $term]);
        }

        return $this->ok($ctx, [
            'data' => array_map(static fn(CustomerProfile $profile) => $profile->toArray(), $rows),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $countQuery->count(),
            ],
        ]);
    }

    public function store(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $errors = $this->validate($data, ['name' => 'required', 'email' => 'required|email']);
        if ($errors) {
            return $this->badRequest($ctx, 'Validation failed', $errors);
        }

        if (CustomerProfile::query()->where('email', trim((string)$data['email']))->first()) {
            return $this->badRequest($ctx, 'Email already exists');
        }

        $profile = new CustomerProfile([
            'name' => trim((string)$data['name']),
            'email' => trim((string)$data['email']),
            'is_active' => (int)(bool)($data['is_active'] ?? true),
        ]);
        $profile->save();

        return $this->created($ctx, $profile->toArray());
    }

    public function update(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        /** @var CustomerProfile|null $profile */
        $profile = CustomerProfile::find($id);
        if (!$profile) {
            return $this->notFound($ctx, 'Customer profile not found');
        }

        $data = $this->input();
        if (isset($data['email'])) {
            $email = trim((string)$data['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->badRequest($ctx, 'Invalid email');
            }
            $existing = CustomerProfile::query()->where('email', $email)->first();
            if ($existing && (int)$existing->id !== $id) {
                return $this->badRequest($ctx, 'Email already exists');
            }
            $profile->email = $email;
        }

        if (isset($data['name'])) {
            $profile->name = trim((string)$data['name']);
        }
        if (array_key_exists('is_active', $data)) {
            $profile->is_active = (int)(bool)$data['is_active'];
        }
        $profile->save();

        return $this->ok($ctx, $profile->toArray());
    }

    public function destroy(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        /** @var CustomerProfile|null $profile */
        $profile = CustomerProfile::find($id);
        if (!$profile) {
            return $this->notFound($ctx, 'Customer profile not found');
        }

        $profile->delete();
        return $this->ok($ctx, ['deleted' => true]);
    }
}
