<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDeactivatedAtToUsers extends AbstractMigration
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
        $table->addColumn('is_active', 'boolean', ['default' => true, 'after' => 'role'])
              ->addColumn('deactivated_at', 'timestamp', ['null' => true, 'after' => 'is_active'])
              ->update();
    }
}
