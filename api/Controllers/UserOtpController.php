<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\UserOtp;

class UserOtpController extends BaseController
{
    public function index(Context $ctx)
    {
        // Require admin role for viewing user OTP settings
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $query = UserOtp::query()->select(['user_otps.*']);

        // Filters
        if ($userId = $ctx->query('user_id')) {
            $query->where('user_otps.user_id', $userId);
        }
        if ($methodId = $ctx->query('method_id')) {
            $query->where('user_otps.method_id', $methodId);
        }

        $userOtps = $query
            ->orderBy('user_otps.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $total = UserOtp::query()->count();

        return $this->ok($ctx, [
            'data' => $userOtps,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function store(Context $ctx)
    {
        // Require admin role for creating user OTP settings
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $errors = $this->validate($data, [
            'user_id' => 'required',
            'method_id' => 'required'
        ]);

        if ($errors)
            return $this->badRequest($ctx, 'Validation failed', $errors);

        $userOtp = new UserOtp($data);
        $userOtp->save();

        return $this->created($ctx, $userOtp->toArray());
    }

    public function show(Context $ctx)
    {
        // Require admin role for viewing user OTP settings
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var UserOtp|null $userOtp */
        $userOtp = UserOtp::find($id);
        if (!$userOtp)
            return $this->notFound($ctx, 'User OTP setting not found');

        return $this->ok($ctx, $userOtp->toArray());
    }

    public function update(Context $ctx)
    {
        // Require admin role for updating user OTP settings
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var UserOtp|null $userOtp */
        $userOtp = UserOtp::find($id);
        if (!$userOtp)
            return $this->notFound($ctx, 'User OTP setting not found');

        $data = $this->input();

        foreach ($data as $k => $v) {
            $userOtp->$k = $v;
        }
        $userOtp->save();

        return $this->ok($ctx, $userOtp->toArray());
    }

    public function destroy(Context $ctx)
    {
        // Require admin role for deleting user OTP settings
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var UserOtp|null $userOtp */
        $userOtp = UserOtp::find($id);
        if (!$userOtp)
            return $this->notFound($ctx, 'User OTP setting not found');

        $userOtp->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }
}
