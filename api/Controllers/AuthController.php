<?php

declare(strict_types = 1)
;

namespace Api\Controllers;

use Api\Context;
use Api\Models\RefreshToken;
use Api\Models\Session;
use Api\Models\User;
use Api\Models\UserInvitation;
use Api\Models\PendingRegistration;
use Api\Models\SystemSetting;
use Api\Services\AuthenticationService;
use Api\Services\AuthorizationService;
use Api\Services\AuditContext;
use Api\Services\PasswordPolicyService;
use Api\Services\SecurityService;
use Api\Models\Organization;
use Api\Helpers\ReservedWords;

class AuthController extends BaseController
{
    private const SIGNUP_OTP_EXPIRY_MINUTES = 10;
    private const SIGNUP_OTP_MAX_ATTEMPTS = 5;

    public function adminCount(Context $ctx)
    {
        $adminCount = User::query()
            ->where('role', 'admin')
            ->count();

        return $this->ok($ctx, [
            'success' => true,
            'count' => $adminCount,
            'hasAdmin' => $adminCount > 0,
        ]);
    }

    public function setupAdmin(Context $ctx)
    {
        $existingUsers = User::query()->count();
        if ($existingUsers > 0) {
            return $this->forbidden($ctx, 'Admin setup is only available when no users exist');
        }

        $data = $ctx->getJsonBody();
        $username = trim((string)($data['username'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if ($username === '' || $email === '' || $password === '') {
            return $this->badRequest($ctx, 'username, email, and password are required');
        }

        /** @var AuthenticationService $auth */
        $auth = $ctx->service('authentication');
        $result = $auth->register($username, $email, $password, 'admin', true, true, null, true);

        if (!$result['success']) {
            return $this->badRequest($ctx, $result['error'] ?? 'Admin setup failed');
        }

        return $this->created($ctx, [
            'success' => true,
            'user' => $result['user'],
        ]);
    }

    public function register(Context $ctx)
    {
        if (!SystemSetting::getBool('allow_registration', false)) {
            return $this->forbidden($ctx, 'Registration is currently disabled.');
        }

        $data = $ctx->getJsonBody();
        $username = trim((string)($data['username'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if ($username === '' || $email === '' || $password === '') {
            return $this->badRequest($ctx, 'username, email, and password are required');
        }

        $existing = User::query()
            ->whereRaw('(username = ? OR email = ?)', [$username, $email])
            ->first();
        if ($existing) {
            if ((int)($existing['is_rejected'] ?? 0) === 1) {
                return $this->badRequest($ctx, $this->rejectedRegistrationMessage());
            }
            return $this->badRequest($ctx, 'User already exists');
        }

        // Check if username is reserved
        if (ReservedWords::isReserved($username)) {
            return $this->badRequest($ctx, 'Username is reserved');
        }

        /** @var AuthenticationService $auth */
        $auth = $ctx->service('authentication');
        $requiresEmailVerification = SystemSetting::getBool('require_email_verifications', false);
        if ($requiresEmailVerification) {
            $pending = $this->startSignupVerification($ctx, $username, $email, $password);
            if (!$pending['success']) {
                return $this->badRequest($ctx, $pending['error'] ?? 'Registration failed');
            }

            return $this->created($ctx, [
                'success' => true,
                'status' => 'verification_required',
                'verification_id' => $pending['verification_id'],
                'expires_at' => $pending['expires_at'],
                'message' => 'Check your email for the verification code to complete registration.',
            ]);
        }

        $registerResult = $auth->register(
            $username,
            $email,
            $password,
            'client',
            false,
            false,
            null,
            true
        );

        if (!$registerResult['success']) {
            return $this->badRequest($ctx, $registerResult['error'] ?? 'Registration failed');
        }

        if (!(bool)($registerResult['user']['is_approved'] ?? false)) {
            $emailService = $ctx->service('email');
            $emailService->sendAccountPendingApproval($email, $username);

            return $this->created($ctx, [
                'success' => true,
                'user' => $registerResult['user'],
                'message' => 'Account created. An administrator must approve your access before you can sign in.',
            ]);
        }

        $loginResult = $auth->login($email, $password, true);
        if (!($loginResult['success'] ?? false)) {
            return $this->created($ctx, [
                'success' => true,
                'user' => $registerResult['user'],
                'message' => 'Account created. Please log in to continue.',
            ]);
        }

        return $this->created($ctx, [
            'success' => true,
            'user' => $loginResult['user'],
            'token' => $loginResult['token'],
            'refreshToken' => $loginResult['refreshToken'],
            'tokens' => [
                'accessToken' => $loginResult['token'],
                'refreshToken' => $loginResult['refreshToken'],
                'expiresAt' => $loginResult['expires_at'] ?? null,
            ],
        ]);
    }

    public function verifySignup(Context $ctx)
    {
        $data = $ctx->getJsonBody();
        $verificationId = trim((string)($data['verification_id'] ?? ''));
        $code = trim((string)($data['code'] ?? ''));

        if ($verificationId === '' || $code === '') {
            return $this->badRequest($ctx, 'verification_id and code are required');
        }

        /**
         * @var PendingRegistration|null $pending
         */
        $pending = PendingRegistration::find($verificationId);
        if (!$pending) {
            return $this->notFound($ctx, 'Verification request not found');
        }

        $pendingData = $pending->toArray();
        $expiresAt = $pendingData['verification_expires_at'] ?? null;
        if ($expiresAt && strtotime((string)$expiresAt) < time()) {
            PendingRegistration::query()->where('id', $pendingData['id'])->delete();
            return $this->badRequest($ctx, 'Verification code expired. Please sign up again.');
        }

        $attempts = (int)($pendingData['attempts'] ?? 0);
        if ($attempts >= self::SIGNUP_OTP_MAX_ATTEMPTS) {
            return $this->badRequest($ctx, 'Too many verification attempts. Please sign up again.');
        }

        if (!password_verify($code, (string)($pendingData['verification_code_hash'] ?? ''))) {
            PendingRegistration::query()
                ->where('id', $pendingData['id'])
                ->update(['attempts' => $attempts + 1]);
            return $this->badRequest($ctx, 'Invalid verification code');
        }

        /** @var AuthenticationService $auth */
        $auth = $ctx->service('authentication');
        $registerResult = $auth->registerWithPasswordHash(
            (string)($pendingData['username'] ?? ''),
            (string)($pendingData['email'] ?? ''),
            (string)($pendingData['password_hash'] ?? ''),
            (string)($pendingData['role'] ?? 'client'),
            false,
            false,
            null,
            true
        );

        if (!$registerResult['success']) {
            if (($registerResult['error'] ?? '') === 'User already exists') {
                PendingRegistration::query()->where('id', $pendingData['id'])->delete();
                $existing = User::query()
                    ->whereRaw('(username = ? OR email = ?)', [$pendingData['username'], $pendingData['email']])
                    ->first();
                if ($existing && (int)($existing['is_rejected'] ?? 0) === 1) {
                    return $this->badRequest($ctx, $this->rejectedRegistrationMessage());
                }
            }
            return $this->badRequest($ctx, $registerResult['error'] ?? 'Registration failed');
        }

        PendingRegistration::query()->where('id', $pendingData['id'])->delete();

        if (!(bool)($registerResult['user']['is_approved'] ?? false)) {
            $emailService = $ctx->service('email');
            $emailService->sendAccountPendingApproval(
                (string)($pendingData['email'] ?? ''),
                (string)($pendingData['username'] ?? '')
            );

            return $this->created($ctx, [
                'success' => true,
                'user' => $registerResult['user'],
                'message' => 'Email verified. Your account is awaiting approval.',
            ]);
        }

        return $this->created($ctx, [
            'success' => true,
            'user' => $registerResult['user'],
            'message' => 'Email verified. You can now sign in.',
        ]);
    }

    public function login(Context $ctx)
    {
        $data = $ctx->getJsonBody();
        $identifier = trim((string)($data['identifier'] ?? ''));
        $password = (string)($data['password'] ?? '');
        $rememberMe = (bool)($data['remember_me'] ?? false);

        if ($identifier === '' || $password === '') {
            return $this->badRequest($ctx, 'identifier and password are required');
        }

        /** @var AuthenticationService $auth */
        $auth = $ctx->service('authentication');
        $result = $auth->login($identifier, $password, $rememberMe);

        if (!($result['success'] ?? false)) {
            return $this->badRequest($ctx, $result['error'] ?? 'Invalid credentials');
        }

        return $this->ok($ctx, [
            'success' => true,
            'user' => $result['user'],
            'token' => $result['token'],
            'refreshToken' => $result['refreshToken'],
            'tokens' => [
                'accessToken' => $result['token'],
                'refreshToken' => $result['refreshToken'],
                'expiresAt' => $result['expires_at'] ?? null,
            ],
        ]);
    }

    public function logout(Context $ctx)
    {
        $ctx->requireAuth();
        $token = $ctx->getBearerToken();
        if (!$token) {
            return $this->badRequest($ctx, 'Token is required');
        }

        /** @var AuthenticationService $auth */
        $auth = $ctx->service('authentication');
        $auth->logout($token);

        return $this->ok($ctx, ['success' => true]);
    }

    public function refreshToken(Context $ctx)
    {
        $data = $ctx->getJsonBody();
        $refreshToken = trim((string)($data['refreshToken'] ?? ''));
        if ($refreshToken === '') {
            return $this->badRequest($ctx, 'refreshToken is required');
        }

        /** @var AuthenticationService $auth */
        $auth = $ctx->service('authentication');
        $result = $auth->refreshToken($refreshToken);

        if (!($result['success'] ?? false)) {
            return $this->unauthorized($ctx, $result['error'] ?? 'Invalid refresh token');
        }

        return $this->ok($ctx, [
            'success' => true,
            'tokens' => $result['tokens'],
        ]);
    }

    public function me(Context $ctx)
    {
        $sessionUser = $ctx->requireAuth();

        /**
         * @var User|null $user
         */
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

    public function invite(Context $ctx)
    {
        $authMiddleware = $ctx->auth();
        $authCheck = $authMiddleware->requireAdmin($ctx);
        if ($authCheck !== true) {
            return $authCheck;
        }

        $inviter = $ctx->requireAuth();
        $data = $ctx->getJsonBody();

        $email = strtolower(trim((string)($data['email'] ?? '')));
        $role = strtolower(trim((string)($data['role'] ?? 'client')));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->badRequest($ctx, 'A valid email is required');
        }

        /** @var AuthorizationService $authz */
        $authz = $ctx->service('authorization');
        if (!$authz->isValidRole($role)) {
            return $this->badRequest($ctx, 'Invalid role');
        }

        $existing = User::query()->where('email', $email)->first();
        if ($existing) {
            $existingData = $existing->toArray();
            if ((int)$existingData['id'] === (int)$inviter['id'] && $role !== $existingData['role']) {
                return $this->badRequest($ctx, 'You cannot change your own role');
            }

            if ($existingData['role'] !== $role) {
                $model = new User($existingData);
                $model->role = $role;
                $model->save();
            }

            /**
             * @var User|null $existingModel
             */
            $existingModel = User::find((int)$existingData['id']);
            if (!$existingModel) {
                return $this->error($ctx, 'Failed to load updated user', 500);
            }

            return $this->ok($ctx, [
                'success' => true,
                'status' => 'updated_existing_user',
                'user' => $existingModel->toArray(),
            ]);
        }

        $pdo = UserInvitation::getPDO();
        $pdo->beginTransaction();

        try {
            // Revoke any prior pending invitations for this email
            $revokeStmt = $pdo->prepare(
                'UPDATE user_invitations SET status = ? WHERE email = ? AND status = ?'
            );
            $revokeStmt->execute(['revoked', $email, 'pending']);

            $token = SecurityService::generateUUID();
            $expiresAt = (new \DateTimeImmutable('+7 days'))->format('Y-m-d H:i:s');

            $inviteStmt = $pdo->prepare(
                'INSERT INTO user_invitations (email, role, invited_by, token, expires_at, status)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $inviteStmt->execute([$email, $role, (int)$inviter['id'], $token, $expiresAt, 'pending']);
            $inviteId = $pdo->lastInsertId();

            $pdo->commit();

            $inviteUrl = $this->appUrl('/invite?token=' . urlencode($token));
            $emailService = $ctx->service('email');
            $emailSent = $emailService->sendInvitation($email, $inviteUrl, $inviter['username'] ?? null);

            if ($inviteId) {
                AuditContext::log(
                    'create',
                    'user_invitations',
                    (string)$inviteId,
                [
                    'email' => ['from' => null, 'to' => $email],
                    'role' => ['from' => null, 'to' => $role],
                    'invited_by' => ['from' => null, 'to' => (int)$inviter['id']],
                    'token' => ['from' => null, 'to' => $token],
                    'expires_at' => ['from' => null, 'to' => $expiresAt],
                    'status' => ['from' => null, 'to' => 'pending'],
                ]
                );
            }

            return $this->created($ctx, [
                'success' => true,
                'invitation' => [
                    'email' => $email,
                    'role' => $role,
                    'token' => $token,
                    'expires_at' => $expiresAt,
                ],
                'email_sent' => $emailSent,
            ]);
        }
        catch (\Throwable $e) {
            $pdo->rollBack();
            return $this->error($ctx, 'Failed to create invitation');
        }
    }

    public function getInvitation(Context $ctx)
    {
        $token = trim((string)($ctx->query('token') ?? ''));
        if ($token === '') {
            return $this->badRequest($ctx, 'token is required');
        }
        $invitation = UserInvitation::query()->where('token', $token)->first();
        if (!$invitation) {
            return $this->notFound($ctx, 'Invitation not found');
        }

        $invitationData = $invitation->toArray();
        if (!$this->isInvitationActive($invitationData)) {
            return $this->badRequest($ctx, 'Invitation is no longer valid');
        }

        return $this->ok($ctx, [
            'success' => true,
            'data' => [
                'email' => $invitationData['email'],
                'role' => $invitationData['role'],
                'expires_at' => $invitationData['expires_at'],
            ],
        ]);
    }

    public function acceptInvitation(Context $ctx)
    {
        $data = $ctx->getJsonBody();
        $token = trim((string)($data['token'] ?? ''));
        $username = trim((string)($data['username'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if ($token === '' || $username === '' || $password === '') {
            return $this->badRequest($ctx, 'token, username, and password are required');
        }
        $invitation = UserInvitation::query()->where('token', $token)->first();
        if (!$invitation) {
            return $this->notFound($ctx, 'Invitation not found');
        }

        $invitationData = $invitation->toArray();
        if (!$this->isInvitationActive($invitationData)) {
            return $this->badRequest($ctx, 'Invitation is no longer valid');
        }

        $existing = User::query()->where('email', $invitationData['email'])->first();
        if ($existing) {
            $ctx->http(409);
            return [
                'error' => true,
                'message' => 'An account with this email already exists. Please log in and request a new invitation if needed.',
            ];
        }
        /** @var User|null $inviter */
        $inviter = User::find((int)$invitationData['invited_by']);
        /** @var AuthorizationService $authz */
        $authz = $ctx->service('authorization');
        if ($authz->isPrivilegedRole($invitationData['role']) && (!$inviter || $inviter['role'] !== 'admin')) {
            return $this->forbidden($ctx, 'Only admins can grant privileged roles');
        }

        $autoApproveInvited = SystemSetting::getBool('auto_approve_invited_users', false);

        /** @var AuthenticationService $auth */
        $auth = $ctx->service('authentication');
        $registerResult = $auth->register(
            $username,
            $invitationData['email'],
            $password,
            $invitationData['role'],
            true,
            $autoApproveInvited,
            $autoApproveInvited ? (int)$invitationData['invited_by'] : null,
            true
        );
        if (!$registerResult['success']) {
            return $this->badRequest($ctx, $registerResult['error'] ?? 'Invitation acceptance failed');
        }

        $pdo = UserInvitation::getPDO();
        $updateStmt = $pdo->prepare(
            'UPDATE user_invitations SET status = ?, accepted_at = ? WHERE id = ? AND status = ?'
        );
        $acceptedAt = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $updateStmt->execute(['accepted', $acceptedAt, (int)$invitationData['id'], 'pending']);

        AuditContext::log(
            'update',
            'user_invitations',
            (string)$invitationData['id'],
        [
            'status' => ['from' => $invitationData['status'] ?? 'pending', 'to' => 'accepted'],
            'accepted_at' => ['from' => $invitationData['accepted_at'] ?? null, 'to' => $acceptedAt],
        ]
        );

        return $this->created($ctx, [
            'success' => true,
            'user' => $registerResult['user'],
            'message' => $autoApproveInvited
            ? 'Invitation accepted. You can now log in.'
            : 'Invitation accepted. An administrator must approve your access before you can sign in.',
        ]);
    }

    public function verifyEmail(Context $ctx)
    {
        $token = trim((string)($ctx->query('token') ?? ''));
        if ($token === '') {
            return $this->badRequest($ctx, 'token is required');
        }

        $tokenHash = hash('sha256', $token);
        $now = gmdate('Y-m-d H:i:s');

        $user = User::query()
            ->where('email_verification_token', $tokenHash)
            ->whereRaw('(email_verification_expires IS NULL OR email_verification_expires > ?)', [$now])
            ->first();

        if (!$user) {
            return $this->badRequest($ctx, 'Verification link is invalid or expired');
        }

        $user->email_verified_at = $now;
        $user->email_verification_token = null;
        $user->email_verification_expires = null;
        $user->save();

        return $this->ok($ctx, [
            'success' => true,
            'message' => 'Email verified successfully.',
        ]);
    }

    public function forgotPassword(Context $ctx)
    {
        $data = $ctx->getJsonBody();
        $email = strtolower(trim((string)($data['email'] ?? '')));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->badRequest($ctx, 'A valid email is required');
        }

        $user = User::query()->where('email', $email)->first();
        if ($user) {
            $resetToken = $this->createPasswordResetToken($user);
            if ($resetToken) {
                $resetUrl = $this->appUrl('/auth/reset-password?token=' . urlencode($resetToken));
                $emailService = $ctx->service('email');
                $emailService->sendPasswordReset($email, $resetUrl);
            }
        }

        return $this->ok($ctx, [
            'success' => true,
            'message' => 'If an account exists for that email, a reset link has been sent.',
        ]);
    }

    public function resetPassword(Context $ctx)
    {
        $data = $ctx->getJsonBody();
        $token = trim((string)($data['token'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if ($token === '' || $password === '') {
            return $this->badRequest($ctx, 'token and password are required');
        }

        if (strlen($password) < 7) {
            return $this->badRequest($ctx, 'Password must be at least 7 characters');
        }

        $tokenHash = hash('sha256', $token);
        $now = gmdate('Y-m-d H:i:s');

        $user = User::query()
            ->where('password_reset_token', $tokenHash)
            ->whereRaw('password_reset_expires IS NOT NULL AND password_reset_expires > ?', [$now])
            ->first();

        if (!$user) {
            return $this->badRequest($ctx, 'Reset link is invalid or expired');
        }

        $policy = new PasswordPolicyService();
        if (!$policy->updatePassword((int)$user['id'], $password)) {
            return $this->error($ctx, 'Failed to reset password');
        }

        User::query()
            ->where('id', $user['id'])
            ->update([
            'password_reset_token' => null,
            'password_reset_expires' => null,
        ]);

        Session::query()->where('user_id', $user['id'])->delete();
        RefreshToken::revokeAllUserTokens((int)$user['id']);

        return $this->ok($ctx, [
            'success' => true,
            'message' => 'Password reset successfully.',
        ]);
    }

    private function createEmailVerificationToken(int $userId): ?string
    {
        /** @var User|null $user */
        $user = User::find($userId);
        if (!$user) {
            return null;
        }

        $token = SecurityService::generateToken(32);
        $tokenHash = hash('sha256', $token);
        $expiresAt = gmdate('Y-m-d H:i:s', strtotime('+24 hours'));

        $user->email_verification_token = $tokenHash;
        $user->email_verification_expires = $expiresAt;
        $user->save();

        return $token;
    }

    private function startSignupVerification(Context $ctx, string $username, string $email, string $password): array
    {
        $username = trim($username);
        $email = strtolower(trim($email));

        if ($username === '' || strlen($username) > 150) {
            return ['success' => false, 'error' => 'Invalid username'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid email address'];
        }

        if (strlen($password) < 7) {
            return ['success' => false, 'error' => 'Password must be at least 7 characters'];
        }

        $existing = User::query()
            ->whereRaw('(username = ? OR email = ?)', [$username, $email])
            ->first();

        if ($existing) {
            if ((int)($existing['is_rejected'] ?? 0) === 1) {
                return ['success' => false, 'error' => $this->rejectedRegistrationMessage()];
            }
            return ['success' => false, 'error' => 'User already exists'];
        }

        $pending = PendingRegistration::query()
            ->whereRaw('(username = ? OR email = ?)', [$username, $email])
            ->first();

        $otpCode = $this->generateOtpCode();
        $expiresAt = gmdate('Y-m-d H:i:s', strtotime('+' . self::SIGNUP_OTP_EXPIRY_MINUTES . ' minutes'));

        $payload = [
            'username' => $username,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'role' => 'client',
            'verification_code_hash' => password_hash($otpCode, PASSWORD_DEFAULT),
            'verification_expires_at' => $expiresAt,
            'attempts' => 0,
        ];

        if ($pending) {
            $pendingData = $pending->toArray();
            PendingRegistration::query()
                ->where('id', $pendingData['id'])
                ->update($payload);
            $verificationId = $pendingData['id'];
        }
        else {
            $verificationId = SecurityService::generateUUID();
            PendingRegistration::create(array_merge($payload, [
                'id' => $verificationId,
            ]));
        }

        $emailService = $ctx->service('email');
        $sent = $emailService->sendOTP($email, $otpCode, self::SIGNUP_OTP_EXPIRY_MINUTES, $username);

        if (!$sent) {
            return ['success' => false, 'error' => 'Failed to send verification code'];
        }

        return [
            'success' => true,
            'verification_id' => $verificationId,
            'expires_at' => $expiresAt,
        ];
    }

    private function generateOtpCode(int $length = 6): string
    {
        $max = (10 ** $length) - 1;
        $min = 10 ** ($length - 1);
        return str_pad((string)random_int($min, $max), $length, '0', STR_PAD_LEFT);
    }

    private function rejectedRegistrationMessage(): string
    {
        $companyEmail = SystemSetting::getValue('company_email');
        $email = is_string($companyEmail) ? trim($companyEmail) : '';

        $contactLine = $email !== ''
            ? "Please contact {$email} to appeal."
            : 'Please contact company support to appeal.';

        return "This email belongs to an account that was created but rejected from using the system. {$contactLine} Try another email for now.";
    }

    private function createPasswordResetToken(User $user): ?string
    {
        $token = SecurityService::generateToken(32);
        $tokenHash = hash('sha256', $token);
        $expiresAt = gmdate('Y-m-d H:i:s', strtotime('+1 hour'));

        $user->password_reset_token = $tokenHash;
        $user->password_reset_expires = $expiresAt;
        $user->save();

        return $token;
    }

    private function isInvitationActive(array $invitation): bool
    {
        if (($invitation['status'] ?? null) !== 'pending') {
            return false;
        }

        if (!empty($invitation['accepted_at'])) {
            return false;
        }

        if (empty($invitation['expires_at'])) {
            return true;
        }

        $expires = new \DateTimeImmutable((string)$invitation['expires_at']);
        return $expires > new \DateTimeImmutable();
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
