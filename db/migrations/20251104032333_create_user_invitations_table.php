<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateUserInvitationsTable extends AbstractMigration
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
        $table = $this->table('user_invitations');
        $table->addColumn('email', 'string', ['limit' => 255])
              ->addColumn('role', 'string', ['limit' => 50])
              ->addColumn('invited_by', 'integer', ['null' => false, 'signed' => false])
              ->addColumn('token', 'string', ['limit' => 255])
              ->addColumn('expires_at', 'datetime', ['null' => false])
              ->addColumn('accepted_at', 'datetime', ['null' => true])
              ->addColumn('status', 'string', ['limit' => 20, 'default' => 'pending'])
              ->addColumn('created_at', 'datetime', ['default' => 'CURRENT_TIMESTAMP'])
              ->addColumn('updated_at', 'datetime', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
              ->addIndex(['email'])
              ->addIndex(['token'], ['unique' => true])
              ->addIndex(['status'])
              ->addForeignKey('invited_by', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'NO_ACTION'])
              ->create();
    }
}
