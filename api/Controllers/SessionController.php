<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\Session;
use Api\Middleware\CsrfMiddleware;

class SessionController extends BaseController
{
    public function index(Context $ctx)
    {
        // Require admin role for viewing sessions
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $query = Session::query()->select(['sessions.*']);

        // Filters
        if ($userId = $ctx->query('user_id')) {
            $query->where('sessions.user_id', $userId);
        }
        if ($isActive = $ctx->query('is_active')) {
            $query->where('sessions.is_active', $isActive === 'true' ? 1 : 0);
        }

        $sessions = $query
            ->orderBy('sessions.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $total = Session::query()->count();

        return $this->ok($ctx, [
            'data' => $sessions,
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
        // Require admin role for creating sessions
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $errors = $this->validate($data, [
            'user_id' => 'required',
            'token' => 'required'
        ]);

        if ($errors)
            return $this->badRequest($ctx, 'Validation failed', $errors);

        $session = new Session($data);
        $session->save();

        return $this->created($ctx, $session->toArray());
    }

    public function show(Context $ctx)
    {
        // Require admin role for viewing sessions
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var Session|null $session */
        $session = Session::find($id);
        if (!$session)
            return $this->notFound($ctx, 'Session not found');

        return $this->ok($ctx, $session->toArray());
    }

    public function update(Context $ctx)
    {
        // Require admin role for updating sessions
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var Session|null $session */
        $session = Session::find($id);
        if (!$session)
            return $this->notFound($ctx, 'Session not found');

        $data = $this->input();

        foreach ($data as $k => $v) {
            $session->$k = $v;
        }
        $session->save();

        return $this->ok($ctx, $session->toArray());
    }

    public function destroy(Context $ctx)
    {
        // Require admin role for deleting sessions
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var Session|null $session */
        $session = Session::find($id);
        if (!$session)
            return $this->notFound($ctx, 'Session not found');

        $session->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }

    /**
     * GET /api/sessions/csrf-token
     * Get a CSRF token for the current session
     */
    public function getCsrfToken(Context $ctx)
    {
        $csrf = new CsrfMiddleware();
        $token = $csrf->getToken($ctx);

        return $this->ok($ctx, [
            'csrf_token' => $token,
            'expires_in' => 7200 // 2 hours
        ]);
    }
}
