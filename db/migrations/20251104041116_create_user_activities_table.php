<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateUserActivitiesTable extends AbstractMigration
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
        $table = $this->table('user_activities');
        $table->addColumn('user_id', 'integer', ['null' => false, 'signed' => false])
              ->addColumn('action', 'string', ['limit' => 100, 'null' => false])
              ->addColumn('description', 'text', ['null' => true])
              ->addColumn('ip_address', 'string', ['limit' => 45, 'null' => true])
              ->addColumn('user_agent', 'string', ['limit' => 500, 'null' => true])
              ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
              ->addIndex(['user_id'])
              ->addIndex(['action'])
              ->addIndex(['created_at'])
              ->create();
    }
}
