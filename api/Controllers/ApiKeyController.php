<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\ApiKey;

class ApiKeyController extends BaseController
{
    /**
     * GET /api/api-keys
     * List all API keys (admin or own keys)
     */
    public function index(Context $ctx)
    {
        $currentUser = $ctx->user();
        if (!$currentUser) {
            return $this->unauthorized($ctx);
        }

        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $query = ApiKey::query()->select(['api_keys.*']);

        // Non-admin users can only see their own API keys
        if ($currentUser->role !== 'admin') {
            $query->where('api_keys.user_id', $currentUser->id);
        }
        else {
            // Admin can filter by user_id
            if ($userId = $ctx->query('user_id')) {
                $query->where('api_keys.user_id', (int)$userId);
            }
        }

        // Filter by active status
        if ($isActive = $ctx->query('is_active')) {
            $query->where('api_keys.is_active', $isActive === 'true' ? 1 : 0);
        }

        $apiKeys = $query
            ->orderBy('api_keys.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        // Remove sensitive data (key_hash)
        $apiKeysData = array_map(function ($key) {
            $data = $key->toArray();
            unset($data['key_hash']);
            return $data;
        }, $apiKeys);

        $total = ApiKey::query()->count();

        return $this->ok($ctx, [
            'data' => $apiKeysData,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * POST /api/api-keys
     * Create a new API key
     */
    public function store(Context $ctx)
    {
        $currentUser = $ctx->user();
        if (!$currentUser) {
            return $this->unauthorized($ctx);
        }

        $data = $ctx->getJsonBody();

        // Validate required fields
        if (empty($data['name'])) {
            return $this->badRequest($ctx, 'Name is required');
        }

        // Generate API key
        $apiKey = $this->generateApiKey();
        $keyHash = password_hash($apiKey, PASSWORD_ARGON2ID);

        // Set user_id
        $userId = $currentUser->id;

        // Admin can create keys for other users
        if ($currentUser->role === 'admin' && isset($data['user_id'])) {
            $userId = (int)$data['user_id'];
        }

        // Create API key record
        $apiKeyModel = new ApiKey([
            'name' => $data['name'],
            'key_hash' => $keyHash,
            'user_id' => $userId,
            'permissions' => $data['permissions'] ?? ['*'],
            'expires_at' => $data['expires_at'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'ip_whitelist' => $data['ip_whitelist'] ?? null,
            'rate_limit' => $data['rate_limit'] ?? 1000,
            'metadata' => $data['metadata'] ?? null
        ]);

        $apiKeyModel->save();

        $response = $apiKeyModel->toArray();
        unset($response['key_hash']);

        // Return the plain API key only once (it won't be stored)
        $response['api_key'] = $apiKey;
        $response['warning'] = 'Save this API key now. You will not be able to see it again.';

        return $this->created($ctx, $response);
    }

    /**
     * GET /api/api-keys/:id
     * Get a specific API key
     */
    public function show(Context $ctx)
    {
        $currentUser = $ctx->user();
        if (!$currentUser) {
            return $this->unauthorized($ctx);
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /**
         * @var ApiKey|null $apiKey
         */
        $apiKey = ApiKey::find($id);
        if (!$apiKey) {
            return $this->notFound($ctx, 'API key not found');
        }

        // Check permissions
        if ($currentUser->role !== 'admin' && $apiKey->user_id !== $currentUser->id) {
            return $this->forbidden($ctx, 'Access denied');
        }

        $response = $apiKey->toArray();
        unset($response['key_hash']);

        return $this->ok($ctx, $response);
    }

    /**
     * PUT /api/api-keys/:id
     * Update an API key
     */
    public function update(Context $ctx)
    {
        $currentUser = $ctx->user();
        if (!$currentUser) {
            return $this->unauthorized($ctx);
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /**
         * @var ApiKey|null $apiKey
         */
        $apiKey = ApiKey::find($id);
        if (!$apiKey) {
            return $this->notFound($ctx, 'API key not found');
        }

        // Check permissions
        if ($currentUser->role !== 'admin' && $apiKey->user_id !== $currentUser->id) {
            return $this->forbidden($ctx, 'Access denied');
        }

        $data = $ctx->getJsonBody();

        // Update allowed fields
        $allowedFields = ['name', 'permissions', 'expires_at', 'is_active', 'ip_whitelist', 'rate_limit', 'metadata'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $apiKey->$field = $data[$field];
            }
        }

        $apiKey->save();

        $response = $apiKey->toArray();
        unset($response['key_hash']);

        return $this->ok($ctx, $response);
    }

    /**
     * DELETE /api/api-keys/:id
     * Delete an API key
     */
    public function destroy(Context $ctx)
    {
        $currentUser = $ctx->user();
        if (!$currentUser) {
            return $this->unauthorized($ctx);
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /**
         * @var ApiKey|null $apiKey
         */
        $apiKey = ApiKey::find($id);
        if (!$apiKey) {
            return $this->notFound($ctx, 'API key not found');
        }

        // Check permissions
        if ($currentUser->role !== 'admin' && $apiKey->user_id !== $currentUser->id) {
            return $this->forbidden($ctx, 'Access denied');
        }

        $apiKey->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }

    /**
     * POST /api/api-keys/:id/regenerate
     * Regenerate an API key
     */
    public function regenerate(Context $ctx)
    {
        $currentUser = $ctx->user();
        if (!$currentUser) {
            return $this->unauthorized($ctx);
        }

        $id = (int)($ctx->param('id') ?? 0);
        if (!$id) {
            return $this->badRequest($ctx, 'Invalid id');
        }

        /**
         * @var ApiKey|null $apiKey
         */
        $apiKey = ApiKey::find($id);
        if (!$apiKey) {
            return $this->notFound($ctx, 'API key not found');
        }

        // Check permissions
        if ($currentUser->role !== 'admin' && $apiKey->user_id !== $currentUser->id) {
            return $this->forbidden($ctx, 'Access denied');
        }

        // Generate new API key
        $newApiKey = $this->generateApiKey();
        $apiKey->key_hash = password_hash($newApiKey, PASSWORD_ARGON2ID);
        $apiKey->save();

        $response = $apiKey->toArray();
        unset($response['key_hash']);
        $response['api_key'] = $newApiKey;
        $response['warning'] = 'Save this API key now. You will not be able to see it again.';

        return $this->ok($ctx, $response);
    }

    /**
     * Generate a random API key
     */
    private function generateApiKey(): string
    {
        $prefix = 'opensys'; // Project prefix
        $randomBytes = random_bytes(32);
        $key = bin2hex($randomBytes);

        return $prefix . '_' . $key;
    }

    /**
     * POST /api/api-keys/verify
     * Verify an API key (for testing purposes)
     */
    public function verify(Context $ctx)
    {
        $data = $ctx->getJsonBody();

        if (empty($data['api_key'])) {
            return $this->badRequest($ctx, 'API key is required');
        }

        $apiKeyString = $data['api_key'];

        // Find API key by comparing hashes
        $apiKeys = ApiKey::query()
            ->where('is_active', 1)
            ->get();

        foreach ($apiKeys as $apiKey) {
            if (password_verify($apiKeyString, $apiKey->key_hash)) {
                // Check if expired
                if ($apiKey->expires_at && strtotime($apiKey->expires_at) < time()) {
                    return $this->unauthorized($ctx, 'API key has expired');
                }

                // Check IP whitelist
                $clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
                $apiKeyModel = new ApiKey($apiKey->toArray());
                if (!$apiKeyModel->isIpAllowed($clientIp)) {
                    return $this->forbidden($ctx, 'IP address not whitelisted');
                }

                // Update last used
                $apiKeyModel->markAsUsed();

                return $this->ok($ctx, [
                    'valid' => true,
                    'name' => $apiKey->name,
                    'user_id' => $apiKey->user_id,
                    'permissions' => $apiKey->permissions
                ]);
            }
        }

        return $this->unauthorized($ctx, 'Invalid API key');
    }
}
