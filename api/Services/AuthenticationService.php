<?php

declare(strict_types = 1)
;

namespace Api\Services;

use Api\Models\User;
use Api\Models\Session;
use Api\Models\SystemSetting;
use Api\Services\AuditContext;

/**
 * Authentication Service with JWT-like token management
 */
class AuthenticationService
{
    private AuditService $audit;
    private AuthorizationService $authz;

    public function __construct(
        AuditService $audit,
        AuthorizationService $authz
        )
    {
        $this->audit = $audit;
        $this->authz = $authz;
    }

    /**
     * Register a new user
     */
    public function register(
        string $username,
        string $email,
        string $password,
        string $role = 'client',
        bool $allowPrivileged = false,
        bool $isApproved = false,
        ?int $approvedBy = null,
        bool $emailVerified = false
        ): array
    {
        if (strlen($password) < 7) {
            return ['success' => false, 'error' => 'Password must be at least 7 characters'];
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        return $this->createUser(
            $username,
            $email,
            $passwordHash,
            $role,
            $allowPrivileged,
            $isApproved,
            $approvedBy,
            $emailVerified
        );
    }

    /**
     * Register a new user using a pre-hashed password (OTP verified flows).
     */
    public function registerWithPasswordHash(
        string $username,
        string $email,
        string $passwordHash,
        string $role = 'client',
        bool $allowPrivileged = false,
        bool $isApproved = false,
        ?int $approvedBy = null,
        bool $emailVerified = false
        ): array
    {
        if ($passwordHash === '') {
            return ['success' => false, 'error' => 'Invalid password'];
        }

        return $this->createUser(
            $username,
            $email,
            $passwordHash,
            $role,
            $allowPrivileged,
            $isApproved,
            $approvedBy,
            $emailVerified
        );
    }

    private function createUser(
        string $username,
        string $email,
        string $passwordHash,
        string $role,
        bool $allowPrivileged,
        bool $isApproved,
        ?int $approvedBy,
        bool $emailVerified
        ): array
    {
        $username = trim($username);
        $email = strtolower(trim($email));

        if ($username === '' || strlen($username) > 150) {
            return ['success' => false, 'error' => 'Invalid username'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid email address'];
        }

        if (!$this->authz->isValidRole($role)) {
            return ['success' => false, 'error' => 'Invalid role'];
        }

        if ($this->authz->isPrivilegedRole($role) && !$allowPrivileged) {
            return ['success' => false, 'error' => 'Privileged roles require admin approval'];
        }

        // Check if user exists
        $existing = User::query()
            ->whereRaw('(username = ? OR email = ?)', [$username, $email])
            ->first();

        if ($existing) {
            return ['success' => false, 'error' => 'User already exists'];
        }

        try {
            $approvedAt = $isApproved ? gmdate('Y-m-d H:i:s') : null;
            $emailVerifiedAt = $emailVerified ? gmdate('Y-m-d H:i:s') : null;
            $user = User::create([
                'username' => $username,
                'display_name' => $username,
                'email' => $email,
                'password_hash' => $passwordHash,
                'role' => $role,
                'is_active' => 1,
                'is_approved' => $isApproved ? 1 : 0,
                'approved_at' => $approvedAt,
                'approved_by' => $approvedBy,
                'email_verified_at' => $emailVerifiedAt,
                'email_verification_token' => null,
                'email_verification_expires' => null,
                'timezone' => 'UTC',
                'currency' => 'USD',
                'preferences' => json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);
        }
        catch (\PDOException $e) {
            if (stripos($e->getMessage(), 'duplicate') !== false) {
                return ['success' => false, 'error' => 'User already exists'];
            }
            throw $e;
        }

        $this->audit->logAuth(
            (int)$user['id'],
            'register',
            $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
        ['username' => $username, 'email' => $email]
        );

        return [
            'success' => true,
            'user' => $user->toArray()
        ];
    }

    /**
     * Login user
     */
    public function login(string $identifier, string $password, bool $rememberMe = false): array
    {
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        $ipCheckDisabled = $this->isIpCheckDisabled();
        $requiresEmailVerification = SystemSetting::getBool('require_email_verifications', false);

        // Check if IP is suspicious
        if (!$ipCheckDisabled && $this->audit->isSuspiciousIp($ipAddress)) {
            return [
                'success' => false,
                'error' => 'Too many failed attempts. Please try again later.'
            ];
        }

        // Find user by username or email
        $user = User::query()
            ->whereRaw('(username = ? OR email = ?)', [$identifier, $identifier])
            ->first();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            $this->audit->logAuth(
                null,
                'login_failed',
                $ipAddress,
                $userAgent,
            ['identifier' => $identifier]
            );
            return ['success' => false, 'error' => 'Invalid credentials'];
        }

        // Set user context for audit logs
        AuditContext::setUser($user->toArray());

        if (!(bool)($user['is_active'] ?? false)) {
            return ['success' => false, 'error' => 'Account is deactivated'];
        }

        if (!(bool)($user['is_approved'] ?? false)) {
            return ['success' => false, 'error' => 'Account is awaiting for approval'];
        }

        if ($requiresEmailVerification && empty($user['email_verified_at'])) {
            return ['success' => false, 'error' => 'Email verification required'];
        }

        $deviceFingerprint = hash('sha256', $userAgent . '|' . $ipAddress);

        // Create session with both access and refresh tokens
        // Remember me: extended expiry
        $token = $this->generateToken();
        $refreshToken = $this->generateToken();

        $tokenExpiry = $rememberMe ? '+7 days' : '+1 hour';
        $refreshExpiry = $rememberMe ? '+30 days' : '+7 days';

        // Use gmdate() to store in UTC, matching database timezone
        $expiresAt = gmdate('Y-m-d H:i:s', strtotime($tokenExpiry));
        $refreshExpiresAt = gmdate('Y-m-d H:i:s', strtotime($refreshExpiry));

        // Create session for access token
        Session::create([
            'user_id' => $user['id'],
            'token' => hash('sha256', $token),
            'expires_at' => $expiresAt
        ]);

        // Store refresh token
        \Api\Models\RefreshToken::create([
            'id' => \Api\Services\SecurityService::generateUUID(),
            'user_id' => $user['id'],
            'token' => hash('sha256', $refreshToken),
            'expires_at' => $refreshExpiresAt,
            'is_active' => true,
            'device_fingerprint' => $deviceFingerprint
        ]);

        $this->audit->logAuth(
            (int)$user['id'],
            'login_success',
            $ipAddress,
            $userAgent
        );

        return [
            'success' => true,
            'token' => $token,
            'refreshToken' => $refreshToken,
            'user' => $user->toArray(),
            'expires_at' => $expiresAt
        ];
    }

    private function isIpCheckDisabled(): bool
    {
        return !SystemSetting::getBool('enable_ip_check', true);
    }

    /**
     * Validate token and get user
     */
    public function validateToken(string $token): ?array
    {
        $hashedToken = hash('sha256', $token);

        // Use UTC time for comparison to match how expires_at is stored
        $now = gmdate('Y-m-d H:i:s');
        $requiresEmailVerification = SystemSetting::getBool('require_email_verifications', false);

        $session = Session::query()
            ->where('token', $hashedToken)
            ->where('expires_at', '>', $now)
            ->first();

        if (!$session) {
            return null;
        }

        /** @var User|null $user */
        $user = User::find($session['user_id']);

        if (!$user) {
            return null;
        }

        if (!$user->is_active) {
            return null;
        }

        if (!$user->is_approved) {
            return null;
        }

        if ($requiresEmailVerification && empty($user->email_verified_at)) {
            return null;
        }

        return [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'display_name' => $user['display_name'] ?? $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'timezone' => $user['timezone'] ?? 'UTC',
            'currency' => $user['currency'] ?? 'USD'
        ];
    }

    /**
     * Logout user
     */
    public function logout(string $token): bool
    {
        $hashedToken = hash('sha256', $token);

        $deleted = Session::query()
            ->where('token', $hashedToken)
            ->delete();

        if ($deleted > 0) {
            $this->audit->logAuth(
                null,
                'logout',
                $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
                $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
            );
        }

        return $deleted > 0;
    }

    /**
     * Refresh token (extend expiry)
     */
    public function refreshToken(string $token): ?array
    {
        // Validate refresh token
        $hashedToken = hash('sha256', $token);
        $now = gmdate('Y-m-d H:i:s');
        $refreshToken = \Api\Models\RefreshToken::query()
            ->where('token', $hashedToken)
            ->where('is_active', true)
            ->where('expires_at', '>', $now)
            ->first();

        if (!$refreshToken) {
            return [
                'success' => false,
                'error' => 'Invalid or expired refresh token'
            ];
        }

        // Get user
        /** @var User|null $user */
        $user = User::find((int)$refreshToken['user_id']);
        if (!$user) {
            return [
                'success' => false,
                'error' => 'User not found'
            ];
        }

        if (!(bool)($user['is_active'] ?? false)) {
            return [
                'success' => false,
                'error' => 'Account is deactivated'
            ];
        }

        if (!(bool)($user['is_approved'] ?? false)) {
            return [
                'success' => false,
                'error' => 'Account is awaiting for approval'
            ];
        }

        if (SystemSetting::getBool('require_email_verifications', false) && empty($user['email_verified_at'])) {
            return [
                'success' => false,
                'error' => 'Email verification required'
            ];
        }

        // Set user context for audit logs
        AuditContext::setUser($user->toArray());

        // Generate new tokens
        $newAccessToken = $this->generateToken();
        $newRefreshToken = $this->generateToken();
        $accessExpiresAt = gmdate('Y-m-d H:i:s', strtotime('+7 days'));
        $refreshExpiresAt = gmdate('Y-m-d H:i:s', strtotime('+30 days'));

        // Invalidate old refresh token
        \Api\Models\RefreshToken::query()
            ->where('id', $refreshToken['id'])
            ->update(['is_active' => false]);

        // Create new session for access token
        Session::create([
            'user_id' => $user['id'],
            'token' => hash('sha256', $newAccessToken),
            'expires_at' => $accessExpiresAt
        ]);

        // Create new refresh token
        \Api\Models\RefreshToken::create([
            'id' => \Api\Services\SecurityService::generateUUID(),
            'user_id' => $user['id'],
            'token' => hash('sha256', $newRefreshToken),
            'expires_at' => $refreshExpiresAt,
            'is_active' => true,
            'device_fingerprint' => $refreshToken['device_fingerprint']
        ]);

        return [
            'success' => true,
            'tokens' => [
                'accessToken' => $newAccessToken,
                'refreshToken' => $newRefreshToken
            ],
            'user' => $user->toArray(),
            'expires_at' => $accessExpiresAt
        ];
    }

    /**
     * Generate secure random token
     */
    private function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Clean up expired sessions
     */
    public function cleanupExpiredSessions(): int
    {
        return Session::query()
            ->whereRaw('expires_at < datetime(\'now\')')
            ->delete();
    }
}
