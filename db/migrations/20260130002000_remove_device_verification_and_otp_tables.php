<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RemoveDeviceVerificationAndOtpTables extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('authentication_logs')) {
            $this->table('authentication_logs')->drop()->save();
        }

        if ($this->hasTable('device_verifications')) {
            $this->table('device_verifications')->drop()->save();
        }

        if ($this->hasTable('user_otps')) {
            $this->table('user_otps')->drop()->save();
        }

        if ($this->hasTable('otp_methods')) {
            $this->table('otp_methods')->drop()->save();
        }

        if ($this->hasTable('users')) {
            $table = $this->table('users');
            $changed = false;

            if ($table->hasColumn('mfa_enabled')) {
                $table->removeColumn('mfa_enabled');
                $changed = true;
            }
            if ($table->hasColumn('mfa_method')) {
                $table->removeColumn('mfa_method');
                $changed = true;
            }

            if ($changed) {
                $table->update();
            }
        }

        if ($this->hasTable('system_settings')) {
            $this->execute(
                "DELETE FROM `system_settings` WHERE `key` IN ('enable_otp', 'enable_device_verification')"
            );
        }
    }

    public function down(): void
    {
        if ($this->hasTable('users')) {
            $table = $this->table('users');
            $changed = false;

            if (!$table->hasColumn('mfa_enabled')) {
                $table->addColumn('mfa_enabled', 'boolean', [
                    'default' => false,
                    'null' => false,
                    'after' => 'role',
                ]);
                $changed = true;
            }

            if (!$table->hasColumn('mfa_method')) {
                $table->addColumn('mfa_method', 'enum', [
                    'values' => ['email', 'authenticator'],
                    'null' => true,
                    'after' => 'mfa_enabled',
                ]);
                $changed = true;
            }

            if ($changed) {
                $table->update();
            }
        }

        if (!$this->hasTable('otp_methods')) {
            $otpMethods = $this->table('otp_methods', ['id' => false, 'primary_key' => ['id']]);
            $otpMethods
                ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
                ->addColumn('name', 'string', ['limit' => 255])
                ->addColumn('type', 'enum', ['values' => ['email', 'authenticator', 'sms']])
                ->create();
        }

        if (!$this->hasTable('user_otps')) {
            $userOtps = $this->table('user_otps', ['id' => false, 'primary_key' => ['id']]);
            $userOtps
                ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
                ->addColumn('user_id', 'integer', ['signed' => false])
                ->addColumn('otp_method_id', 'integer', ['signed' => false])
                ->addColumn('secret', 'string', ['limit' => 255, 'null' => true])
                ->addColumn('enabled', 'boolean', ['default' => false])
                ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
                ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
                ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE'])
                ->addForeignKey('otp_method_id', 'otp_methods', 'id', ['delete' => 'CASCADE'])
                ->addIndex(['user_id', 'otp_method_id'], ['unique' => true])
                ->create();
        }

        if (!$this->hasTable('device_verifications')) {
            $deviceVerifications = $this->table('device_verifications', [
                'id' => false,
                'primary_key' => ['id']
            ]);

            $deviceVerifications
                ->addColumn('id', 'char', ['limit' => 36, 'null' => false])
                ->addColumn('user_id', 'integer', ['signed' => false])
                ->addColumn('device_fingerprint', 'string', ['limit' => 255])
                ->addColumn('user_agent', 'text', ['null' => true])
                ->addColumn('ip_address', 'string', ['limit' => 45, 'null' => true])
                ->addColumn('location', 'string', ['limit' => 255, 'null' => true])
                ->addColumn('is_verified', 'boolean', ['default' => false])
                ->addColumn('is_trusted', 'boolean', ['default' => false])
                ->addColumn('verification_token', 'string', ['limit' => 255, 'null' => true])
                ->addColumn('verification_token_expiry', 'timestamp', ['null' => true])
                ->addColumn('verified_at', 'timestamp', ['null' => true])
                ->addColumn('verification_method', 'enum', [
                    'values' => ['email', 'sms', 'manual'],
                    'default' => 'email'
                ])
                ->addColumn('failed_attempts', 'integer', ['default' => 0])
                ->addColumn('last_login_at', 'timestamp', ['null' => true])
                ->addColumn('expires_at', 'timestamp', ['null' => true])
                ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
                ->addColumn('updated_at', 'timestamp', [
                    'default' => 'CURRENT_TIMESTAMP',
                    'update' => 'CURRENT_TIMESTAMP'
                ])
                ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE'])
                ->addIndex(['user_id', 'device_fingerprint'], ['name' => 'user_device_idx'])
                ->addIndex(['verification_token'], ['name' => 'verification_token_idx'])
                ->addIndex(['user_id', 'is_trusted'], ['name' => 'trusted_devices_idx'])
                ->create();
        }

        if (!$this->hasTable('authentication_logs')) {
            $authenticationLogs = $this->table('authentication_logs', [
                'id' => false,
                'primary_key' => ['id']
            ]);

            $authenticationLogs
                ->addColumn('id', 'char', ['limit' => 36, 'null' => false])
                ->addColumn('user_id', 'integer', ['signed' => false, 'null' => true])
                ->addColumn('email', 'string', ['limit' => 255])
                ->addColumn('action', 'enum', [
                    'values' => [
                        'login',
                        'logout',
                        'password_reset',
                        'device_verification',
                        'failed_login',
                        'account_locked'
                    ]
                ])
                ->addColumn('device_fingerprint', 'string', ['limit' => 255, 'null' => true])
                ->addColumn('user_agent', 'text', ['null' => true])
                ->addColumn('ip_address', 'string', ['limit' => 45, 'null' => true])
                ->addColumn('location', 'string', ['limit' => 255, 'null' => true])
                ->addColumn('success', 'boolean')
                ->addColumn('failure_reason', 'string', ['limit' => 255, 'null' => true])
                ->addColumn('requires_device_verification', 'boolean', ['default' => false])
                ->addColumn('device_verification_id', 'char', ['limit' => 36, 'null' => true])
                ->addColumn('session_id', 'string', ['limit' => 255, 'null' => true])
                ->addColumn('token_type', 'enum', [
                    'values' => ['access', 'refresh', 'verification'],
                    'null' => true
                ])
                ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
                ->addForeignKey('user_id', 'users', 'id', [
                    'delete' => 'SET_NULL',
                    'update' => 'CASCADE'
                ])
                ->addForeignKey('device_verification_id', 'device_verifications', 'id', [
                    'delete' => 'SET_NULL',
                    'update' => 'CASCADE'
                ])
                ->addIndex(['user_id', 'action'], ['name' => 'user_action_idx'])
                ->addIndex(['email', 'action'], ['name' => 'email_action_idx'])
                ->addIndex(['device_fingerprint'], ['name' => 'device_idx'])
                ->addIndex(['created_at'], ['name' => 'timestamp_idx'])
                ->addIndex(['ip_address'], ['name' => 'ip_address_idx'])
                ->create();
        }

        if ($this->hasTable('system_settings')) {
            $this->execute(
                "INSERT INTO `system_settings` (`key`, `value`, `created_at`, `updated_at`)
                 SELECT 'enable_otp', 'true', NOW(), NOW()
                 WHERE NOT EXISTS (
                     SELECT 1 FROM `system_settings` WHERE `key` = 'enable_otp'
                 )"
            );
            $this->execute(
                "INSERT INTO `system_settings` (`key`, `value`, `created_at`, `updated_at`)
                 SELECT 'enable_device_verification', 'true', NOW(), NOW()
                 WHERE NOT EXISTS (
                     SELECT 1 FROM `system_settings` WHERE `key` = 'enable_device_verification'
                 )"
            );
        }
    }
}
