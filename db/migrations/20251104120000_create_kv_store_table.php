<?php

use Phinx\Migration\AbstractMigration;

class CreateKvStoreTable extends AbstractMigration
{
    public function change()
    {
        $table = $this->table('kv_store', [
            'id' => false,
            'primary_key' => ['dockey']
        ]);
        
        $table->addColumn('dockey', 'string', [
                'limit' => 255,
                'null' => false,
                'comment' => 'Key for the stored value'
            ])
            ->addColumn('docval', 'json', [
                'null' => true,
                'comment' => 'JSON value stored'
            ])
            ->addColumn('expired_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => 'Expiration timestamp'
            ])
            ->addColumn('created_at', 'datetime', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP'
            ])
            ->addIndex(['expired_at'], [
                'name' => 'idx_expired_at'
            ])
            ->create();
    }
}
