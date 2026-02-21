<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\OtpMethod;

class OtpMethodController extends BaseController
{
    public function index(Context $ctx)
    {
        // Require admin role for viewing OTP methods
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $query = OtpMethod::query()->select(['otp_methods.*']);

        // Filters
        if ($name = $ctx->query('name')) {
            $query->where('otp_methods.name', 'like', '%' . $name . '%');
        }
        if ($isActive = $ctx->query('is_active')) {
            $query->where('otp_methods.is_active', $isActive === 'true' ? 1 : 0);
        }

        $methods = $query
            ->orderBy('otp_methods.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $total = OtpMethod::query()->count();

        return $this->ok($ctx, [
            'data' => $methods,
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
        // Require admin role for creating OTP methods
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $errors = $this->validate($data, [
            'name' => 'required',
            'method' => 'required'
        ]);

        if ($errors)
            return $this->badRequest($ctx, 'Validation failed', $errors);

        $method = new OtpMethod($data);
        $method->save();

        return $this->created($ctx, $method->toArray());
    }

    public function show(Context $ctx)
    {
        // Require admin role for viewing OTP methods
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var OtpMethod|null $method */
        $method = OtpMethod::find($id);
        if (!$method)
            return $this->notFound($ctx, 'OTP method not found');

        return $this->ok($ctx, $method->toArray());
    }

    public function update(Context $ctx)
    {
        // Require admin role for updating OTP methods
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var OtpMethod|null $method */
        $method = OtpMethod::find($id);
        if (!$method)
            return $this->notFound($ctx, 'OTP method not found');

        $data = $this->input();

        foreach ($data as $k => $v) {
            $method->$k = $v;
        }
        $method->save();

        return $this->ok($ctx, $method->toArray());
    }

    public function destroy(Context $ctx)
    {
        // Require admin role for deleting OTP methods
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var OtpMethod|null $method */
        $method = OtpMethod::find($id);
        if (!$method)
            return $this->notFound($ctx, 'OTP method not found');

        $method->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }
}
