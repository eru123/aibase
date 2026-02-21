<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddUserOnboardingSettings extends AbstractMigration
{
    public function up(): void
    {
        $this->execute(
            "INSERT INTO system_settings (`key`, `value`) VALUES
                ('auto_approve_invited_users', 'false'),
                ('require_email_verifications', 'false')
             ON DUPLICATE KEY UPDATE `value` = `value`"
        );
    }

    public function down(): void
    {
        $this->execute(
            "DELETE FROM system_settings WHERE `key` IN (
                'auto_approve_invited_users',
                'require_email_verifications'
            )"
        );
    }
}
