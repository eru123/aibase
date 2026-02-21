<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\UserSetting;

class UserSettingController extends BaseController
{
    public function index(Context $ctx)
    {
        // Require authentication for viewing user settings
        $authResult = $ctx->auth()->authenticate($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $query = UserSetting::query()->select(['user_settings.*']);

        // Filters
        if ($userId = $ctx->query('user_id')) {
            $query->where('user_settings.user_id', $userId);
        }
        if ($key = $ctx->query('key')) {
            $query->whereRaw('`user_settings`.`key` LIKE ?', ['%' . $key . '%']);
        }

        $settings = $query
            ->orderBy('user_settings.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $total = UserSetting::query()->count();

        return $this->ok($ctx, [
            'data' => $settings,
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
        // Require authentication for creating user settings
        $authResult = $ctx->auth()->authenticate($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $errors = $this->validate($data, [
            'user_id' => 'required',
            'key' => 'required',
            'value' => 'required'
        ]);

        if ($errors)
            return $this->badRequest($ctx, 'Validation failed', $errors);

        $setting = new UserSetting($data);
        $setting->save();

        return $this->created($ctx, $setting->toArray());
    }

    public function show(Context $ctx)
    {
        // Require authentication for viewing user settings
        $authResult = $ctx->auth()->authenticate($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var UserSetting|null $setting */
        $setting = UserSetting::find($id);
        if (!$setting)
            return $this->notFound($ctx, 'User setting not found');

        return $this->ok($ctx, $setting->toArray());
    }

    public function update(Context $ctx)
    {
        // Require authentication for updating user settings
        $authResult = $ctx->auth()->authenticate($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var UserSetting|null $setting */
        $setting = UserSetting::find($id);
        if (!$setting)
            return $this->notFound($ctx, 'User setting not found');

        $data = $this->input();

        foreach ($data as $k => $v) {
            $setting->$k = $v;
        }
        $setting->save();

        return $this->ok($ctx, $setting->toArray());
    }

    public function destroy(Context $ctx)
    {
        // Require authentication for deleting user settings
        $authResult = $ctx->auth()->authenticate($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var UserSetting|null $setting */
        $setting = UserSetting::find($id);
        if (!$setting)
            return $this->notFound($ctx, 'User setting not found');

        $setting->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }
}
