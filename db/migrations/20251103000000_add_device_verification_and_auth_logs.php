<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDeviceVerificationAndAuthLogs extends AbstractMigration
{
    /**
     * Add device verification and enhanced authentication logging tables
     */
    public function change(): void
    {
        // Device Verifications table for trusted device management
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
            
            // Verification status
            ->addColumn('is_verified', 'boolean', ['default' => false])
            ->addColumn('is_trusted', 'boolean', ['default' => false])
            ->addColumn('verification_token', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('verification_token_expiry', 'timestamp', ['null' => true])
            ->addColumn('verified_at', 'timestamp', ['null' => true])
            
            // Security tracking
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

        // Authentication Logs table for comprehensive auth tracking
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
            
            // Enhanced device and security tracking
            ->addColumn('device_fingerprint', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('user_agent', 'text', ['null' => true])
            ->addColumn('ip_address', 'string', ['limit' => 45, 'null' => true])
            ->addColumn('location', 'string', ['limit' => 255, 'null' => true])
            
            // Security context
            ->addColumn('success', 'boolean')
            ->addColumn('failure_reason', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('requires_device_verification', 'boolean', ['default' => false])
            ->addColumn('device_verification_id', 'char', ['limit' => 36, 'null' => true])
            
            // Session tracking
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

        // Audit Logs table for system-wide audit trail
        $auditLogs = $this->table('audit_logs', [
            'id' => false,
            'primary_key' => ['id']
        ]);
        
        $auditLogs
            ->addColumn('id', 'char', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('action', 'enum', [
                'values' => ['create', 'read', 'update', 'delete']
            ])
            ->addColumn('resource_type', 'string', ['limit' => 100])
            ->addColumn('resource_id', 'string', ['limit' => 100, 'null' => true])
            ->addColumn('ip_address', 'string', ['limit' => 45, 'null' => true])
            ->addColumn('user_agent', 'text', ['null' => true])
            ->addColumn('changes', 'text', ['null' => true]) // JSON encoded changes
            ->addColumn('metadata', 'text', ['null' => true]) // Additional JSON metadata
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'CASCADE'
            ])
            ->addIndex(['user_id'], ['name' => 'audit_user_idx'])
            ->addIndex(['resource_type', 'resource_id'], ['name' => 'audit_resource_idx'])
            ->addIndex(['action'], ['name' => 'audit_action_idx'])
            ->addIndex(['created_at'], ['name' => 'audit_timestamp_idx'])
            ->create();

        // Refresh Tokens table for JWT token management
        $refreshTokens = $this->table('refresh_tokens', [
            'id' => false,
            'primary_key' => ['id']
        ]);
        
        $refreshTokens
            ->addColumn('id', 'char', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'integer', ['signed' => false])
            ->addColumn('token', 'text')
            ->addColumn('expires_at', 'timestamp')
            ->addColumn('is_active', 'boolean', ['default' => true])
            ->addColumn('device_fingerprint', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP'
            ])
            
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE'])
            ->addIndex(['user_id'], ['name' => 'refresh_token_user_idx'])
            ->addIndex(['token'], ['name' => 'refresh_token_idx', 'type' => 'fulltext'])
            ->addIndex(['expires_at'], ['name' => 'refresh_token_expiry_idx'])
            ->create();
    }
}
