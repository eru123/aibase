<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateCustomerProfilesTable extends AbstractMigration
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
    public function up(): void
    {
        $table = $this->table('customer_profiles');

        // Add new columns
        $table
            ->addColumn('first_name', 'string', ['limit' => 100, 'after' => 'id'])
            ->addColumn('last_name', 'string', ['limit' => 100, 'after' => 'first_name'])
            ->addColumn('middle_name', 'string', ['limit' => 100, 'null' => true, 'after' => 'last_name'])
            ->addColumn('company_name', 'string', ['limit' => 150, 'null' => true, 'after' => 'middle_name'])
            ->addColumn('phone', 'string', ['limit' => 50, 'null' => true, 'after' => 'email'])
            ->update();

        // Split name into first and last
        $this->execute("UPDATE customer_profiles SET first_name = SUBSTRING_INDEX(name, ' ', 1), last_name = TRIM(SUBSTRING(name, LENGTH(SUBSTRING_INDEX(name, ' ', 1)) + 1))");
        $this->execute("UPDATE customer_profiles SET last_name = first_name WHERE last_name = ''");

        // Drop the old name column
        $table->removeColumn('name')->update();
    }

    public function down(): void
    {
        $table = $this->table('customer_profiles');
        $table->addColumn('name', 'string', ['limit' => 150, 'after' => 'id'])->update();

        $this->execute("UPDATE customer_profiles SET name = CONCAT_WS(' ', first_name, last_name)");

        $table
            ->removeColumn('first_name')
            ->removeColumn('last_name')
            ->removeColumn('middle_name')
            ->removeColumn('company_name')
            ->removeColumn('phone')
            ->update();
    }
}
