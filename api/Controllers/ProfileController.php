<?php

declare(strict_types = 1)
;

namespace Api\Controllers;

use Api\Context;
use Api\Models\User;

class ProfileController extends BaseController
{
    public function show(Context $ctx)
    {
        $sessionUser = $ctx->requireAuth();
        /** @var User|null $user */
        $user = User::find((int)$sessionUser['id']);
        if (!$user) {
            return $this->unauthorized($ctx);
        }

        $data = $user->toArray();
        $data['preferences'] = $this->decodePreferences($data['preferences'] ?? null);

        return $this->ok($ctx, [
            'success' => true,
            'data' => $data,
        ]);
    }

    public function publicShow(Context $ctx)
    {
        $username = (string)($ctx->param('username') ?? '');
        if (empty($username)) {
            return $this->badRequest($ctx, 'Username is required');
        }

        $user = User::query()->where('username', $username)->first();
        if (!$user) {
            return $this->notFound($ctx, 'User not found');
        }

        // Return public data (including email as requested for admin/management visibility)
        $data = [
            'id' => $user->id,
            'username' => $user->username,
            'display_name' => $user->display_name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'role' => $user->role,
            'created_at' => $user->created_at,
        ];

        return $this->ok($ctx, [
            'success' => true,
            'data' => $data,
        ]);
    }

    public function update(Context $ctx)
    {
        $sessionUser = $ctx->requireAuth();
        /** @var User|null $user */
        $user = User::find((int)$sessionUser['id']);
        if (!$user) {
            return $this->unauthorized($ctx);
        }

        $data = $ctx->getJsonBody();

        try {
            $displayName = array_key_exists('display_name', $data)
                ? $this->sanitizeNullableString($data['display_name'], 150)
                : $user['display_name'];

            $avatarUrl = array_key_exists('avatar_url', $data)
                ? $this->sanitizeNullableString($data['avatar_url'], 255)
                : $user['avatar_url'];

            $timezone = array_key_exists('timezone', $data)
                ? $this->validateTimezone($data['timezone'])
                : ($user['timezone'] ?? 'UTC');

            $currency = array_key_exists('currency', $data)
                ? $this->validateCurrency($data['currency'])
                : ($user['currency'] ?? 'USD');

            $preferencesRaw = array_key_exists('preferences', $data)
                ? $data['preferences']
                : ($user['preferences'] ?? null);

            $preferences = $this->encodePreferences($preferencesRaw);
        }
        catch (\InvalidArgumentException $e) {
            return $this->badRequest($ctx, $e->getMessage());
        }

        $user->display_name = $displayName;
        $user->avatar_url = $avatarUrl;
        $user->timezone = $timezone;
        $user->currency = $currency;
        $user->preferences = $preferences;
        $user->save();

        $updated = $user->toArray();
        $updated['preferences'] = $this->decodePreferences($updated['preferences'] ?? null);

        return $this->ok($ctx, [
            'success' => true,
            'data' => $updated,
        ]);
    }

    public function updatePassword(Context $ctx)
    {
        $sessionUser = $ctx->requireAuth();
        /** @var User|null $user */
        $user = User::find((int)$sessionUser['id']);
        if (!$user) {
            return $this->unauthorized($ctx);
        }

        $data = $ctx->getJsonBody();
        $currentPassword = (string)($data['current_password'] ?? '');
        $newPassword = (string)($data['new_password'] ?? '');

        if (empty($currentPassword) || empty($newPassword)) {
            return $this->badRequest($ctx, 'Current and new password are required');
        }

        // Check current password
        if (!password_verify($currentPassword, $user->password_hash)) {
            return $this->badRequest($ctx, 'Invalid current password');
        }

        // Validate new password (at least 7 chars)
        if (strlen($newPassword) < 7) {
            return $this->badRequest($ctx, 'New password must be at least 7 characters long');
        }

        $user->password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $user->password_changed_at = date('Y-m-d H:i:s');
        $user->save();

        return $this->ok($ctx, [
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
    }

    private function sanitizeNullableString(mixed $value, int $maxLength): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_string($value)) {
            throw new \InvalidArgumentException('Value must be a string');
        }
        $value = trim($value);
        if ($value === '') {
            return null;
        }
        if (strlen($value) > $maxLength) {
            throw new \InvalidArgumentException('Value is too long');
        }
        return $value;
    }

    private function validateTimezone(mixed $timezone): string
    {
        if (!is_string($timezone)) {
            throw new \InvalidArgumentException('Timezone must be a string');
        }
        $timezone = trim($timezone);
        if (!in_array($timezone, timezone_identifiers_list(), true)) {
            throw new \InvalidArgumentException('Invalid timezone');
        }
        return $timezone;
    }

    private function validateCurrency(mixed $currency): string
    {
        if (!is_string($currency)) {
            throw new \InvalidArgumentException('Currency must be a string');
        }
        $currency = strtoupper(trim($currency));
        if (!preg_match('/^[A-Z]{3,10}$/', $currency)) {
            throw new \InvalidArgumentException('Currency must be 3-10 uppercase letters');
        }
        return $currency;
    }

    private function encodePreferences(mixed $preferences): ?string
    {
        if ($preferences === null) {
            return null;
        }
        if (is_string($preferences)) {
            $decoded = json_decode($preferences, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \InvalidArgumentException('Preferences must be valid JSON');
            }
            $preferences = $decoded;
        }
        if (!is_array($preferences)) {
            throw new \InvalidArgumentException('Preferences must be an object');
        }
        $encoded = json_encode($preferences, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encoded === false || strlen($encoded) > 20000) {
            throw new \InvalidArgumentException('Preferences are too large');
        }
        return $encoded;
    }

    private function decodePreferences(mixed $preferences): array
    {
        if (is_array($preferences)) {
            return $preferences;
        }
        if (!is_string($preferences) || trim($preferences) === '') {
            return [];
        }
        $decoded = json_decode($preferences, true);
        return is_array($decoded) ? $decoded : [];
    }

}
