<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddIsRejectedToUsers extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('users');
        $table
            ->addColumn('is_rejected', 'boolean', ['default' => false, 'after' => 'is_approved'])
            ->addIndex(['is_rejected'])
            ->update();
    }

    public function down(): void
    {
        $table = $this->table('users');
        $table
            ->removeIndex(['is_rejected'])
            ->removeColumn('is_rejected')
            ->update();
    }
}
