<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Context;
use Api\Models\CustomerGroup;
use Api\Models\CustomerProfile;

class CustomerGroupController extends BaseController
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

        $pdo = CustomerGroup::getPDO();
        $whereSql = '';
        $params = [];
        if ($search !== '') {
            $whereSql = 'WHERE cg.name LIKE ?';
            $params[] = '%' . $search . '%';
        }

        $stmt = $pdo->prepare("SELECT cg.*, COUNT(cgm.customer_profile_id) AS members_count
            FROM customer_groups cg
            LEFT JOIN customer_group_members cgm ON cgm.customer_group_id = cg.id
            {$whereSql}
            GROUP BY cg.id
            ORDER BY cg.updated_at DESC
            LIMIT {$limit} OFFSET {$offset}");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $countStmt = $pdo->prepare("SELECT COUNT(*) AS count FROM customer_groups cg {$whereSql}");
        $countStmt->execute($params);
        $total = (int)($countStmt->fetchColumn() ?: 0);

        return $this->ok($ctx, [
            'data' => $rows,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total],
        ]);
    }

    public function show(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        $group = CustomerGroup::find($id);
        if (!$group) {
            return $this->notFound($ctx, 'Customer group not found');
        }

        $members = $this->fetchMemberIds($id);

        return $this->ok($ctx, [
            ...$group->toArray(),
            'member_ids' => $members,
        ]);
    }

    public function store(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $data = $this->input();
        $errors = $this->validate($data, ['name' => 'required']);
        if ($errors) {
            return $this->badRequest($ctx, 'Validation failed', $errors);
        }

        $group = new CustomerGroup([
            'name' => trim((string)$data['name']),
            'description' => isset($data['description']) ? trim((string)$data['description']) : null,
        ]);
        $group->save();

        $memberIds = $this->validateMemberIds($data['member_ids'] ?? []);
        $this->syncMemberIds((int)$group->id, $memberIds);

        return $this->created($ctx, [
            ...$group->toArray(),
            'member_ids' => $memberIds,
        ]);
    }

    public function update(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        /** @var CustomerGroup|null $group */
        $group = CustomerGroup::find($id);
        if (!$group) {
            return $this->notFound($ctx, 'Customer group not found');
        }

        $data = $this->input();
        if (isset($data['name'])) {
            $group->name = trim((string)$data['name']);
        }
        if (array_key_exists('description', $data)) {
            $group->description = $data['description'] !== null ? trim((string)$data['description']) : null;
        }
        $group->save();

        if (array_key_exists('member_ids', $data)) {
            $memberIds = $this->validateMemberIds($data['member_ids']);
            $this->syncMemberIds($id, $memberIds);
        }

        return $this->ok($ctx, [
            ...$group->toArray(),
            'member_ids' => $this->fetchMemberIds($id),
        ]);
    }

    public function destroy(Context $ctx)
    {
        $authResult = $ctx->auth()->requireAdmin($ctx);
        if ($authResult !== true) {
            return $authResult;
        }

        $id = (int)($ctx->param('id') ?? 0);
        /** @var CustomerGroup|null $group */
        $group = CustomerGroup::find($id);
        if (!$group) {
            return $this->notFound($ctx, 'Customer group not found');
        }

        $group->delete();
        return $this->ok($ctx, ['deleted' => true]);
    }

    private function validateMemberIds(mixed $memberIds): array
    {
        if (!is_array($memberIds)) {
            return [];
        }

        $ids = array_values(array_unique(array_map(static fn($id) => (int)$id, $memberIds)));
        $ids = array_filter($ids, static fn($id) => $id > 0);
        if (empty($ids)) {
            return [];
        }

        $valid = CustomerProfile::query()->whereIn('id', $ids)->get();
        $validIds = array_map(static fn(CustomerProfile $profile) => (int)$profile->id, $valid);
        sort($validIds);
        return $validIds;
    }

    private function syncMemberIds(int $groupId, array $memberIds): void
    {
        $pdo = CustomerGroup::getPDO();
        $pdo->prepare('DELETE FROM customer_group_members WHERE customer_group_id = ?')->execute([$groupId]);
        if (empty($memberIds)) {
            return;
        }

        $stmt = $pdo->prepare('INSERT INTO customer_group_members (customer_group_id, customer_profile_id) VALUES (?, ?)');
        foreach ($memberIds as $memberId) {
            $stmt->execute([$groupId, $memberId]);
        }
    }

    private function fetchMemberIds(int $groupId): array
    {
        $pdo = CustomerGroup::getPDO();
        $stmt = $pdo->prepare('SELECT customer_profile_id FROM customer_group_members WHERE customer_group_id = ? ORDER BY customer_profile_id ASC');
        $stmt->execute([$groupId]);
        return array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN) ?: []);
    }
}
