<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class InitialAccountingSchema extends AbstractMigration
{
    public function change(): void
    {
        $users = $this->table('users', ['id' => false, 'primary_key' => ['id']]);
        $users
            ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
            ->addColumn('username', 'string', ['limit' => 255])
            ->addColumn('email', 'string', ['limit' => 255])
            ->addColumn('password_hash', 'string', ['limit' => 255])
            ->addColumn('role', 'enum', ['values' => ['admin', 'support', 'client'], 'default' => 'client'])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['email'], ['unique' => true])
            ->addIndex(['username'], ['unique' => true])
            ->create();

        $userSettings = $this->table('user_settings', ['id' => false, 'primary_key' => ['id']]);
        $userSettings
            ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
            ->addColumn('user_id', 'integer', ['signed' => false])
            ->addColumn('key', 'string', ['limit' => 255])
            ->addColumn('value', 'text')
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE'])
            ->addIndex(['user_id', 'key'], ['unique' => true])
            ->create();

        $systemSettings = $this->table('system_settings', ['id' => false, 'primary_key' => ['id']]);
        $systemSettings
            ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
            ->addColumn('key', 'string', ['limit' => 255])
            ->addColumn('value', 'text')
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['key'], ['unique' => true])
            ->create();

        $authLogs = $this->table('auth_logs', ['id' => false, 'primary_key' => ['id']]);
        $authLogs
            ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
            ->addColumn('user_id', 'integer', ['null' => true, 'signed' => false])
            ->addColumn('action', 'string', ['limit' => 255])
            ->addColumn('ip_address', 'string', ['limit' => 45])
            ->addColumn('user_agent', 'text')
            ->addColumn('details', 'json', ['null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'SET_NULL'])
            ->create();

        $otpMethods = $this->table('otp_methods', ['id' => false, 'primary_key' => ['id']]);
        $otpMethods
            ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
            ->addColumn('name', 'string', ['limit' => 255])
            ->addColumn('type', 'enum', ['values' => ['email', 'authenticator', 'sms']])
            ->create();

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

        $sessions = $this->table('sessions', ['id' => false, 'primary_key' => ['id']]);
        $sessions
            ->addColumn('id', 'integer', ['identity' => true, 'signed' => false])
            ->addColumn('user_id', 'integer', ['signed' => false])
            ->addColumn('token', 'string', ['limit' => 255])
            ->addColumn('expires_at', 'timestamp')
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE'])
            ->addIndex(['token'], ['unique' => true])
            ->create();

        $uploads = $this->table('uploads', ['id' => false, 'primary_key' => 'id']);
        $uploads
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('hash', 'string', ['limit' => 64])
            ->addColumn('original_name', 'string', ['limit' => 255])
            ->addColumn('mime_type', 'string', ['limit' => 255])
            ->addColumn('extension', 'string', ['limit' => 16])
            ->addColumn('size', 'integer')
            ->addColumn('storage_path', 'string', ['limit' => 500])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['hash'], ['unique' => true])
            ->create();
    }
}
