<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Context;
use Api\Models\MarketingEmailTemplate;

class MarketingEmailTemplateController extends BaseController
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

        $query = MarketingEmailTemplate::query()->select(['marketing_email_templates.*']);
        if ($search !== '') {
            $term = '%' . $search . '%';
            $query->whereRaw('(marketing_email_templates.name LIKE ? OR marketing_email_templates.subject LIKE ?)', [$term, $term]);
        }

        $rows = $query->orderBy('marketing_email_templates.updated_at', 'desc')->limit($limit)->offset($offset)->get();
        $countQuery = MarketingEmailTemplate::query();
        if ($search !== '') {
            $term = '%' . $search . '%';
            $countQuery->whereRaw('(marketing_email_templates.name LIKE ? OR marketing_email_templates.subject LIKE ?)', [$term, $term]);
        }

        return $this->ok($ctx, [
            'data' => array_map(static fn(MarketingEmailTemplate $item) => $item->toArray(), $rows),
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $countQuery->count()],
        ]);
    }

    public function store(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $errors = $this->validate($data, ['name' => 'required', 'subject' => 'required', 'body_html' => 'required']);
        if ($errors) {
            return $this->badRequest($ctx, 'Validation failed', $errors);
        }

        $template = new MarketingEmailTemplate([
            'name' => trim((string)$data['name']),
            'subject' => trim((string)$data['subject']),
            'body_html' => (string)$data['body_html'],
            'body_text' => isset($data['body_text']) ? (string)$data['body_text'] : null,
            'is_active' => (int)(bool)($data['is_active'] ?? true),
        ]);
        $template->save();

        return $this->created($ctx, $template->toArray());
    }

    public function update(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        /** @var MarketingEmailTemplate|null $template */
        $template = MarketingEmailTemplate::find($id);
        if (!$template) {
            return $this->notFound($ctx, 'Marketing email template not found');
        }

        $data = $this->input();
        foreach (['name', 'subject', 'body_html', 'body_text'] as $field) {
            if (array_key_exists($field, $data)) {
                $template->$field = is_string($data[$field]) ? trim($data[$field]) : $data[$field];
            }
        }
        if (array_key_exists('is_active', $data)) {
            $template->is_active = (int)(bool)$data['is_active'];
        }
        $template->save();

        return $this->ok($ctx, $template->toArray());
    }

    public function destroy(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        /** @var MarketingEmailTemplate|null $template */
        $template = MarketingEmailTemplate::find($id);
        if (!$template) {
            return $this->notFound($ctx, 'Marketing email template not found');
        }

        $template->delete();
        return $this->ok($ctx, ['deleted' => true]);
    }
}
