<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddProfileFieldsToUsers extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('users');
        $table
            ->addColumn('display_name', 'string', ['limit' => 150, 'null' => true, 'after' => 'username'])
            ->addColumn('timezone', 'string', ['limit' => 50, 'default' => 'UTC', 'after' => 'role'])
            ->addColumn('currency', 'string', ['limit' => 10, 'default' => 'USD', 'after' => 'timezone'])
            ->addColumn('preferences', 'json', ['null' => true, 'after' => 'currency'])
            ->update();
    }
}
