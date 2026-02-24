<?php


use Phinx\Seed\AbstractSeed;

class CustomerProfilesSeeder extends AbstractSeed
{
    /**
     * Run Method.
     *
     * Write your database seeder using this method.
     *
     * More information on writing seeders is available here:
     * https://book.cakephp.org/phinx/0/en/seeding.html
     */
    public function run(): void
    {
        $firstNames = ['John', 'Jane', 'Michael', 'Emily', 'Chris', 'Sarah', 'David', 'Laura', 'Robert', 'Emma', 'Daniel', 'Olivia'];
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        $companies = ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp', 'Stark Industries', 'Wayne Enterprises'];
        
        $data = [];
        for ($i = 0; $i < 100; $i++) {
            $fName = $firstNames[array_rand($firstNames)];
            $lName = $lastNames[array_rand($lastNames)];
            $company = rand(0, 1) ? $companies[array_rand($companies)] : null;
            $phone = rand(0, 1) ? '555-' . str_pad((string)rand(0, 9999), 4, '0', STR_PAD_LEFT) : null;
            
            $data[] = [
                'first_name'   => $fName,
                'last_name'    => $lName,
                'middle_name'  => rand(0, 1) ? $firstNames[array_rand($firstNames)] : null,
                'company_name' => $company,
                'phone'        => $phone,
                'email'        => strtolower($fName . '.' . $lName . $i . '@example.com'),
                'is_active'    => rand(1, 100) <= 90 ? 1 : 0,
                'created_at'   => date('Y-m-d H:i:s'),
                'updated_at'   => date('Y-m-d H:i:s'),
            ];
        }

        $this->table('customer_profiles')->insert($data)->saveData();
    }
}
