<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddUserApprovalAndEmailVerification extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('users');
        $table
            ->addColumn('is_approved', 'boolean', ['default' => false, 'after' => 'is_active'])
            ->addColumn('approved_at', 'timestamp', ['null' => true, 'after' => 'is_approved'])
            ->addColumn('approved_by', 'integer', ['null' => true, 'signed' => false, 'after' => 'approved_at'])
            ->addColumn('email_verified_at', 'timestamp', ['null' => true, 'after' => 'approved_by'])
            ->addColumn('email_verification_token', 'string', ['limit' => 64, 'null' => true, 'after' => 'email_verified_at'])
            ->addColumn('email_verification_expires', 'timestamp', ['null' => true, 'after' => 'email_verification_token'])
            ->addIndex(['is_approved'])
            ->addIndex(['approved_by'])
            ->update();

        $this->execute("UPDATE users SET is_approved = 1, approved_at = CURRENT_TIMESTAMP, email_verified_at = CURRENT_TIMESTAMP");
    }

    public function down(): void
    {
        $table = $this->table('users');
        $table
            ->removeIndex(['is_approved'])
            ->removeIndex(['approved_by'])
            ->removeColumn('email_verification_expires')
            ->removeColumn('email_verification_token')
            ->removeColumn('email_verified_at')
            ->removeColumn('approved_by')
            ->removeColumn('approved_at')
            ->removeColumn('is_approved')
            ->update();
    }
}
