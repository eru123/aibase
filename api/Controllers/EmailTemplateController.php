<?php

declare(strict_types = 1)
;

namespace Api\Controllers;

use Api\Context;
use Api\Models\EmailTemplate;
use Api\Services\TemplateRenderer;

class EmailTemplateController extends BaseController
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
        $isActiveFilter = $ctx->query('is_active');

        $applyFilters = function ($query) use ($search, $isActiveFilter): void {
            if ($search !== '') {
                $term = '%' . $search . '%';
                $query->whereRaw('(email_templates.name LIKE ? OR email_templates.subject LIKE ?)', [$term, $term]);
            }

            if ($isActiveFilter !== null && $isActiveFilter !== '') {
                $values = explode(',', (string)$isActiveFilter);
                $query->whereIn('email_templates.is_active', $values);
            }
        };

        $query = EmailTemplate::query()->select(['email_templates.*']);
        $applyFilters($query);

        $templates = $query
            ->orderBy('email_templates.updated_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $templates = array_map(static fn(EmailTemplate $template) => $template->toArray(), $templates);

        $countQuery = EmailTemplate::query();
        $applyFilters($countQuery);
        $total = $countQuery->count();

        return $this->ok($ctx, [
            'data' => $templates,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
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
        $errors = $this->validate($data, [
            'name' => 'required',
            'subject' => 'required',
            'body_html' => 'required',
        ]);

        if ($errors) {
            return $this->badRequest($ctx, 'Validation failed', $errors);
        }

        [$sampleData, $sampleError] = $this->normalizeSampleData($data['sample_data'] ?? null);
        if ($sampleError) {
            return $this->badRequest($ctx, $sampleError);
        }

        $template = new EmailTemplate([
            'name' => trim((string)$data['name']),
            'description' => isset($data['description']) ? trim((string)$data['description']) : null,
            'subject' => trim((string)$data['subject']),
            'body_html' => (string)$data['body_html'],
            'body_text' => isset($data['body_text']) ? (string)$data['body_text'] : null,
            'sample_data' => $sampleData,
            'is_active' => $this->normalizeBool($data['is_active'] ?? true),
        ]);
        $template->save();

        return $this->created($ctx, $template->toArray());
    }

    public function show(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /**
         * @var EmailTemplate|null $template
         */
        $template = EmailTemplate::find($id);
        if (!$template) {
            return $this->notFound($ctx, 'Email template not found');
        }

        return $this->ok($ctx, $template->toArray());
    }

    public function update(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /**
         * @var EmailTemplate|null $template
         */
        $template = EmailTemplate::find($id);
        if (!$template) {
            return $this->notFound($ctx, 'Email template not found');
        }

        $data = $this->input();
        if (array_key_exists('sample_data', $data)) {
            [$sampleData, $sampleError] = $this->normalizeSampleData($data['sample_data']);
            if ($sampleError) {
                return $this->badRequest($ctx, $sampleError);
            }
            $data['sample_data'] = $sampleData;
        }

        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = $this->normalizeBool($data['is_active']);
        }

        foreach (['name', 'description', 'subject', 'body_html', 'body_text', 'sample_data', 'is_active'] as $field) {
            if (array_key_exists($field, $data)) {
                $template->$field = $data[$field];
            }
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
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /**
         * @var EmailTemplate|null $template
         */
        $template = EmailTemplate::find($id);
        if (!$template) {
            return $this->notFound($ctx, 'Email template not found');
        }

        $template->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }

    public function preview(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /** @var EmailTemplate|null $template */
        $template = EmailTemplate::find($id);
        if (!$template) {
            return $this->notFound($ctx, 'Email template not found');
        }

        $payload = $this->input();
        [$data, $error] = $this->decodeJsonInput($payload['data'] ?? $template['sample_data'] ?? null);
        if ($error) {
            return $this->badRequest($ctx, $error);
        }

        /** @var TemplateRenderer $renderer */
        $renderer = $ctx->service('templateRenderer');

        $subjectTemplate = isset($payload['subject']) ? (string)$payload['subject'] : (string)$template['subject'];
        $htmlTemplate = isset($payload['body_html']) ? (string)$payload['body_html'] : (string)$template['body_html'];
        $textTemplate = null;
        if (isset($payload['body_text'])) {
            $textTemplate = (string)$payload['body_text'];
        }
        elseif ($template['body_text']) {
            $textTemplate = (string)$template['body_text'];
        }

        try {
            $subject = $renderer->render($subjectTemplate, $data);
            $html = $renderer->render($htmlTemplate, $data);
            $text = $textTemplate ? $renderer->render($textTemplate, $data) : null;
        }
        catch (\Throwable $e) {
            return $this->badRequest($ctx, 'Template rendering failed: ' . $e->getMessage());
        }

        return $this->ok($ctx, [
            'subject' => $subject,
            'html' => $html,
            'text' => $text,
            'data' => $data,
        ]);
    }

    private function normalizeBool($value): int
    {
        $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        return $bool === null ? 0 : ($bool ? 1 : 0);
    }

    private function normalizeSampleData($value): array
    {
        if ($value === null || $value === '') {
            return [null, null];
        }

        if (is_array($value)) {
            return [json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), null];
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return [null, null];
            }
            $decoded = json_decode($trimmed, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [null, 'sample_data must be valid JSON'];
            }
            return [json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), null];
        }

        return [null, 'sample_data must be valid JSON'];
    }

    private function decodeJsonInput($value): array
    {
        if ($value === null || $value === '') {
            return [[], null];
        }

        if (is_array($value)) {
            return [$value, null];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [[], 'Invalid JSON payload'];
            }
            return [is_array($decoded) ? $decoded : [], null];
        }

        return [[], 'Invalid JSON payload'];
    }
}
