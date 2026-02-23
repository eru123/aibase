<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Context;
use Api\Models\CustomerGroup;
use Api\Models\CustomerProfile;
use Api\Models\MarketingEmailRequest;
use Api\Models\MarketingEmailTemplate;

class MarketingEmailRequestController extends BaseController
{
    public function queue(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $templateId = (int)($data['template_id'] ?? 0);
        $groupId = isset($data['group_id']) ? (int)$data['group_id'] : null;

        /** @var MarketingEmailTemplate|null $template */
        $template = MarketingEmailTemplate::find($templateId);
        if (!$template) {
            return $this->badRequest($ctx, 'Template not found');
        }

        $recipients = $this->resolveRecipients($groupId, $data['recipient_ids'] ?? null);
        if (count($recipients) === 0) {
            return $this->badRequest($ctx, 'No recipients selected');
        }

        $user = $ctx->user();
        $request = new MarketingEmailRequest([
            'marketing_email_template_id' => $templateId,
            'customer_group_id' => $groupId,
            'requested_by' => $user['id'] ?? null,
            'subject' => trim((string)($data['subject'] ?? $template->subject)),
            'body_html' => (string)($data['body_html'] ?? $template->body_html),
            'status' => 'pending',
            'total_recipients' => count($recipients),
            'sent_count' => 0,
            'failed_count' => 0,
        ]);
        $request->save();

        $pdo = MarketingEmailRequest::getPDO();
        $stmt = $pdo->prepare('INSERT INTO marketing_email_request_recipients (marketing_email_request_id, customer_profile_id, name, email, status) VALUES (?, ?, ?, ?, ?)');
        foreach ($recipients as $recipient) {
            $stmt->execute([(int)$request->id, $recipient['id'], $recipient['name'], $recipient['email'], 'pending']);
        }

        return $this->created($ctx, [
            'id' => (int)$request->id,
            'status' => 'pending',
            'queued_recipients' => count($recipients),
        ]);
    }

    public function index(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $pdo = MarketingEmailRequest::getPDO();
        $search = trim((string)($ctx->query('search') ?? ''));
        $status = trim((string)($ctx->query('status') ?? ''));

        $conditions = [];
        $params = [];
        if ($search !== '') {
            $conditions[] = '(mer.subject LIKE ? OR met.name LIKE ? OR cg.name LIKE ?)';
            $term = '%' . $search . '%';
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }
        if ($status !== '') {
            $conditions[] = 'mer.status = ?';
            $params[] = $status;
        }

        $whereSql = empty($conditions) ? '' : ('WHERE ' . implode(' AND ', $conditions));

        $sql = "SELECT mer.*, met.name AS template_name, cg.name AS group_name
            FROM marketing_email_requests mer
            INNER JOIN marketing_email_templates met ON met.id = mer.marketing_email_template_id
            LEFT JOIN customer_groups cg ON cg.id = mer.customer_group_id
            {$whereSql}
            ORDER BY mer.created_at DESC
            LIMIT {$limit} OFFSET {$offset}";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $countSql = "SELECT COUNT(*) FROM marketing_email_requests mer
            INNER JOIN marketing_email_templates met ON met.id = mer.marketing_email_template_id
            LEFT JOIN customer_groups cg ON cg.id = mer.customer_group_id
            {$whereSql}";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)($countStmt->fetchColumn() ?: 0);

        return $this->ok($ctx, [
            'data' => $rows,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total],
        ]);
    }

    private function resolveRecipients(?int $groupId, mixed $recipientIds): array
    {
        if ($groupId) {
            $pdo = CustomerGroup::getPDO();
            $stmt = $pdo->prepare('SELECT cp.id, cp.name, cp.email
                FROM customer_group_members cgm
                INNER JOIN customer_profiles cp ON cp.id = cgm.customer_profile_id
                WHERE cgm.customer_group_id = ? AND cp.is_active = 1');
            $stmt->execute([$groupId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
        }

        if (!is_array($recipientIds)) {
            return [];
        }

        $ids = array_values(array_unique(array_filter(array_map(static fn($id) => (int)$id, $recipientIds), static fn($id) => $id > 0)));
        if (empty($ids)) {
            return [];
        }

        $items = CustomerProfile::query()->whereIn('id', $ids)->where('is_active', 1)->get();
        return array_map(static fn(CustomerProfile $profile) => [
            'id' => (int)$profile->id,
            'name' => (string)$profile->name,
            'email' => (string)$profile->email,
        ], $items);
    }
}
