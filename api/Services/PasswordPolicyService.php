<?php

namespace Api\Services;

use Api\Models\User;

class PasswordPolicyService
{
    private array $config;

    public function __construct()
    {
        // Default password policy configuration
        $this->config = [
            'min_length' => 7,
            'max_length' => 128,
            'require_uppercase' => true,
            'require_lowercase' => true,
            'require_numbers' => true,
            'require_special_chars' => true,
            'password_expiry_days' => 90,
            'password_history_count' => 5,
            'min_password_age_hours' => 24,
            'max_failed_attempts' => 5,
            'lockout_duration_minutes' => 30
        ];
    }

    /**
     * Validate password against policy
     */
    public function validate(string $password): array
    {
        $errors = [];

        if (strlen($password) < $this->config['min_length']) {
            $errors[] = "Password must be at least {$this->config['min_length']} characters long";
        }

        if (strlen($password) > $this->config['max_length']) {
            $errors[] = "Password must not exceed {$this->config['max_length']} characters";
        }

        if ($this->config['require_uppercase'] && !preg_match('/[A-Z]/', $password)) {
            $errors[] = "Password must contain at least one uppercase letter";
        }

        if ($this->config['require_lowercase'] && !preg_match('/[a-z]/', $password)) {
            $errors[] = "Password must contain at least one lowercase letter";
        }

        if ($this->config['require_numbers'] && !preg_match('/[0-9]/', $password)) {
            $errors[] = "Password must contain at least one number";
        }

        if ($this->config['require_special_chars'] && !preg_match('/[^A-Za-z0-9]/', $password)) {
            $errors[] = "Password must contain at least one special character";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Check if password has been used before (password history)
     */
    public function isPasswordReused(int $userId, string $password): bool
    {
        /** @var User|null $user */
        $user = User::find($userId);
        if (!$user) {
            return false;
        }

        // Check current password
        if (password_verify($password, $user->password_hash)) {
            return true;
        }

        // Check password history if available
        $history = json_decode($user->password_history ?? '[]', true);
        foreach ($history as $hash) {
            if (password_verify($password, $hash)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Update password and maintain history
     */
    public function updatePassword(int $userId, string $newPassword): bool
    {
        /** @var User|null $user */
        $user = User::find($userId);
        if (!$user) {
            return false;
        }

        // Get current password history
        $history = json_decode($user->password_history ?? '[]', true);

        // Add current password to history
        if (!empty($user['password_hash'])) {
            array_unshift($history, $user['password_hash']);
        }

        // Keep only the configured number of passwords in history
        $history = array_slice($history, 0, $this->config['password_history_count']);

        // Update user
        $user->password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $user->password_history = json_encode($history);
        $user->password_changed_at = date('Y-m-d H:i:s');
        $user->password_expires_at = date('Y-m-d H:i:s', strtotime("+{$this->config['password_expiry_days']} days"));
        $user->save();

        return true;
    }

    /**
     * Check if password has expired
     */
    public function isPasswordExpired(int $userId): bool
    {
        /** @var User|null $user */
        $user = User::find($userId);
        if (!$user || empty($user['password_expires_at'])) {
            return false;
        }

        return strtotime($user['password_expires_at']) < time();
    }

    /**
     * Check if password can be changed (min age check)
     */
    public function canChangePassword(int $userId): array
    {
        /** @var User|null $user */
        $user = User::find($userId);
        if (!$user || empty($user['password_changed_at'])) {
            return ['can_change' => true];
        }

        $minChangeTime = strtotime($user['password_changed_at']) + ($this->config['min_password_age_hours'] * 3600);
        $canChange = time() >= $minChangeTime;

        if (!$canChange) {
            $hoursLeft = ceil(($minChangeTime - time()) / 3600);
            return [
                'can_change' => false,
                'message' => "You can change your password in {$hoursLeft} hours"
            ];
        }

        return ['can_change' => true];
    }

    /**
     * Get password strength score (0-100)
     */
    public function getPasswordStrength(string $password): int
    {
        $score = 0;

        // Length score (max 30 points)
        $length = strlen($password);
        if ($length >= 7)
            $score += 10;
        if ($length >= 12)
            $score += 10;
        if ($length >= 16)
            $score += 10;

        // Character variety (max 40 points)
        if (preg_match('/[a-z]/', $password))
            $score += 10;
        if (preg_match('/[A-Z]/', $password))
            $score += 10;
        if (preg_match('/[0-9]/', $password))
            $score += 10;
        if (preg_match('/[^A-Za-z0-9]/', $password))
            $score += 10;

        // Complexity (max 30 points)
        if (preg_match('/[a-z].*[A-Z]|[A-Z].*[a-z]/', $password))
            $score += 10; // Mixed case
        if (preg_match('/[0-9].*[^A-Za-z0-9]|[^A-Za-z0-9].*[0-9]/', $password))
            $score += 10; // Numbers with symbols
        if (!preg_match('/(.)\1{2,}/', $password))
            $score += 10; // No repeated characters

        return min(100, $score);
    }

    /**
     * Get policy configuration
     */
    public function getConfig(): array
    {
        return $this->config;
    }

    /**
     * Update policy configuration
     */
    public function updateConfig(array $newConfig): void
    {
        $this->config = array_merge($this->config, $newConfig);
    }
}
