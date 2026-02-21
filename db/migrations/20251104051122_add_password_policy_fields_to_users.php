<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPasswordPolicyFieldsToUsers extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        $table = $this->table('users');
        $table->addColumn('password_history', 'json', ['null' => true, 'after' => 'password_hash'])
              ->addColumn('password_changed_at', 'timestamp', ['null' => true, 'after' => 'password_history'])
              ->addColumn('password_expires_at', 'timestamp', ['null' => true, 'after' => 'password_changed_at'])
              ->update();
    }
}
