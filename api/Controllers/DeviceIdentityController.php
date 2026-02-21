<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\DeviceIdentity;

class DeviceIdentityController extends BaseController
{
    public function index(Context $ctx)
    {
        // Require admin role for viewing device identities
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $query = DeviceIdentity::query()->select(['device_identities.*']);

        // Filters
        if ($userId = $ctx->query('user_id')) {
            $query->where('device_identities.user_id', $userId);
        }
        if ($deviceId = $ctx->query('device_id')) {
            $query->where('device_identities.device_id', $deviceId);
        }

        $devices = $query
            ->orderBy('device_identities.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $total = DeviceIdentity::query()->count();

        return $this->ok($ctx, [
            'data' => $devices,
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
        // Require admin role for creating device identities
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $errors = $this->validate($data, [
            'user_id' => 'required',
            'device_id' => 'required'
        ]);

        if ($errors)
            return $this->badRequest($ctx, 'Validation failed', $errors);

        $device = new DeviceIdentity($data);
        $device->save();

        return $this->created($ctx, $device->toArray());
    }

    public function show(Context $ctx)
    {
        // Require admin role for viewing device identities
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /**
         * @var DeviceIdentity|null $device
         */
        $device = DeviceIdentity::find($id);
        if (!$device)
            return $this->notFound($ctx, 'Device identity not found');

        return $this->ok($ctx, $device->toArray());
    }

    public function update(Context $ctx)
    {
        // Require admin role for updating device identities
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /**
         * @var DeviceIdentity|null $device
         */
        $device = DeviceIdentity::find($id);
        if (!$device)
            return $this->notFound($ctx, 'Device identity not found');

        $data = $this->input();

        foreach ($data as $k => $v) {
            $device->$k = $v;
        }
        $device->save();

        return $this->ok($ctx, $device->toArray());
    }

    public function destroy(Context $ctx)
    {
        // Require admin role for deleting device identities
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /**
         * @var DeviceIdentity|null $device
         */
        $device = DeviceIdentity::find($id);
        if (!$device)
            return $this->notFound($ctx, 'Device identity not found');

        $device->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }
}
