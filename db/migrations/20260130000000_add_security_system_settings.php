<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSecuritySystemSettings extends AbstractMigration
{
    public function up(): void
    {
        $this->execute(
            "INSERT INTO system_settings (`key`, `value`) VALUES
                ('enable_otp', 'true'),
                ('enable_device_verification', 'true'),
                ('enable_ip_check', 'true'),
                ('debug_enabled', 'false')
             ON DUPLICATE KEY UPDATE `value` = `value`"
        );
    }

    public function down(): void
    {
        $this->execute(
            "DELETE FROM system_settings WHERE `key` IN (
                'enable_otp',
                'enable_device_verification',
                'enable_ip_check',
                'debug_enabled'
            )"
        );
    }
}
