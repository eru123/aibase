<?php

declare(strict_types = 1)
;

use Phinx\Migration\AbstractMigration;

final class AddCompanySystemSettings extends AbstractMigration
{
    public function up(): void
    {
        $this->execute(
            "INSERT INTO system_settings (`key`, `value`) VALUES
                ('company_name', 'AIBase'),
                ('company_logo_url', ''),
                ('company_email', ''),
                ('company_phone', ''),
                ('company_website', ''),
                ('company_address', '')
             ON DUPLICATE KEY UPDATE `value` = `value`"
        );
    }

    public function down(): void
    {
        $this->execute(
            "DELETE FROM system_settings WHERE `key` IN (
                'company_name',
                'company_logo_url',
                'company_email',
                'company_phone',
                'company_website',
                'company_address'
            )"
        );
    }
}
