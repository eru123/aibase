<?php

declare(strict_types = 1);

use Phinx\Migration\AbstractMigration;

final class AddCustomersMarketingTables extends AbstractMigration
{
    public function up(): void
    {
        $this->execute(
            "CREATE TABLE IF NOT EXISTS customer_profiles (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(255) NOT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY customer_profiles_email_unique (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->execute(
            "CREATE TABLE IF NOT EXISTS customer_groups (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY customer_groups_name_unique (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->execute(
            "CREATE TABLE IF NOT EXISTS customer_group_members (
                customer_group_id INT UNSIGNED NOT NULL,
                customer_profile_id INT UNSIGNED NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (customer_group_id, customer_profile_id),
                KEY customer_group_members_profile_idx (customer_profile_id),
                CONSTRAINT customer_group_members_group_fk FOREIGN KEY (customer_group_id) REFERENCES customer_groups(id) ON DELETE CASCADE,
                CONSTRAINT customer_group_members_profile_fk FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->execute(
            "CREATE TABLE IF NOT EXISTS marketing_email_templates (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                body_html MEDIUMTEXT NOT NULL,
                body_text MEDIUMTEXT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY marketing_email_templates_name_unique (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->execute(
            "CREATE TABLE IF NOT EXISTS marketing_email_requests (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                marketing_email_template_id INT UNSIGNED NOT NULL,
                customer_group_id INT UNSIGNED NULL,
                requested_by VARCHAR(36) NULL,
                subject VARCHAR(255) NOT NULL,
                body_html MEDIUMTEXT NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                total_recipients INT UNSIGNED NOT NULL DEFAULT 0,
                sent_count INT UNSIGNED NOT NULL DEFAULT 0,
                failed_count INT UNSIGNED NOT NULL DEFAULT 0,
                error_message TEXT NULL,
                requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY marketing_email_requests_status_idx (status),
                KEY marketing_email_requests_template_idx (marketing_email_template_id),
                KEY marketing_email_requests_group_idx (customer_group_id),
                CONSTRAINT marketing_email_requests_template_fk FOREIGN KEY (marketing_email_template_id) REFERENCES marketing_email_templates(id),
                CONSTRAINT marketing_email_requests_group_fk FOREIGN KEY (customer_group_id) REFERENCES customer_groups(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->execute(
            "CREATE TABLE IF NOT EXISTS marketing_email_request_recipients (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                marketing_email_request_id BIGINT UNSIGNED NOT NULL,
                customer_profile_id INT UNSIGNED NULL,
                name VARCHAR(150) NULL,
                email VARCHAR(255) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                error_message TEXT NULL,
                sent_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY marketing_email_request_recipients_request_idx (marketing_email_request_id),
                KEY marketing_email_request_recipients_status_idx (status),
                CONSTRAINT marketing_email_request_recipients_request_fk FOREIGN KEY (marketing_email_request_id) REFERENCES marketing_email_requests(id) ON DELETE CASCADE,
                CONSTRAINT marketing_email_request_recipients_customer_fk FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    public function down(): void
    {
        $this->execute('DROP TABLE IF EXISTS marketing_email_request_recipients');
        $this->execute('DROP TABLE IF EXISTS marketing_email_requests');
        $this->execute('DROP TABLE IF EXISTS marketing_email_templates');
        $this->execute('DROP TABLE IF EXISTS customer_group_members');
        $this->execute('DROP TABLE IF EXISTS customer_groups');
        $this->execute('DROP TABLE IF EXISTS customer_profiles');
    }
}
