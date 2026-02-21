<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreatePendingRegistrations extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('pending_registrations', ['id' => false, 'primary_key' => ['id']]);
        $table
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('username', 'string', ['limit' => 150])
            ->addColumn('email', 'string', ['limit' => 255])
            ->addColumn('password_hash', 'string', ['limit' => 255])
            ->addColumn('role', 'string', ['limit' => 50, 'default' => 'client'])
            ->addColumn('verification_code_hash', 'string', ['limit' => 255])
            ->addColumn('verification_expires_at', 'timestamp')
            ->addColumn('attempts', 'integer', ['default' => 0])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['email'], ['unique' => true])
            ->addIndex(['username'], ['unique' => true])
            ->addIndex(['verification_expires_at'])
            ->create();
    }
}
