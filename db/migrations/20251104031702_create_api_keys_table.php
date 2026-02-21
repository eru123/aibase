<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateApiKeysTable extends AbstractMigration
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
        $table = $this->table('api_keys');
        $table->addColumn('name', 'string', ['limit' => 255])
              ->addColumn('key_hash', 'string', ['limit' => 255])
              ->addColumn('user_id', 'integer', ['null' => false, 'signed' => false])
              ->addColumn('permissions', 'json', ['null' => true])
              ->addColumn('last_used_at', 'datetime', ['null' => true])
              ->addColumn('expires_at', 'datetime', ['null' => true])
              ->addColumn('is_active', 'boolean', ['default' => true])
              ->addColumn('ip_whitelist', 'json', ['null' => true])
              ->addColumn('rate_limit', 'integer', ['default' => 1000])
              ->addColumn('metadata', 'json', ['null' => true])
              ->addColumn('created_at', 'datetime', ['default' => 'CURRENT_TIMESTAMP'])
              ->addColumn('updated_at', 'datetime', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
              ->addIndex(['user_id'])
              ->addIndex(['is_active'])
              ->addIndex(['key_hash'], ['unique' => true])
              ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'NO_ACTION'])
              ->create();
    }
}
