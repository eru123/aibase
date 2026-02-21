<?php

use Phinx\Migration\AbstractMigration;

class AddPasswordResetToUsers extends AbstractMigration
{
    public function change()
    {
        $table = $this->table('users');
        
        $table->addColumn('password_reset_token', 'string', [
                'limit' => 255,
                'null' => true,
                'after' => 'password_hash',
                'comment' => 'Hashed password reset token'
            ])
            ->addColumn('password_reset_expires', 'datetime', [
                'null' => true,
                'after' => 'password_reset_token',
                'comment' => 'Password reset token expiration timestamp'
            ])
            ->addIndex(['password_reset_token'])
            ->update();
    }
}
