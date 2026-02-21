<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class DefaultMfaEnabledForUsers extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('users');
        $table->changeColumn('mfa_enabled', 'boolean', [
            'default' => true,
            'null' => false,
        ])->update();

        $this->execute("UPDATE users SET mfa_enabled = 1 WHERE mfa_enabled = 0");
        $this->execute("UPDATE users SET mfa_method = 'email' WHERE (mfa_method IS NULL OR mfa_method = '') AND mfa_enabled = 1");
    }

    public function down(): void
    {
        $table = $this->table('users');
        $table->changeColumn('mfa_enabled', 'boolean', [
            'default' => false,
            'null' => false,
        ])->update();
    }
}
