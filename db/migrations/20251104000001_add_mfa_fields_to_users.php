<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddMfaFieldsToUsers extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('users');
        
        $table->addColumn('mfa_enabled', 'boolean', [
            'default' => false,
            'null' => false,
            'after' => 'role'
        ])
        ->addColumn('mfa_method', 'enum', [
            'values' => ['email', 'authenticator'],
            'null' => true,
            'after' => 'mfa_enabled'
        ])
        ->update();
    }
}
