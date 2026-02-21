<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UpdateUserRolesForAccounting extends AbstractMigration
{
    public function up(): void
    {
        // Normalize any legacy roles before tightening the enum
        $this->execute("UPDATE users SET role = 'client' WHERE role NOT IN ('admin', 'support', 'client')");

        // Ensure role enum is aligned to supported roles
        $this->execute("ALTER TABLE users MODIFY role ENUM('admin','support','client') NOT NULL DEFAULT 'client'");
    }

    public function down(): void
    {
        // Best-effort rollback keeps supported roles intact
        $this->execute("UPDATE users SET role = 'client' WHERE role NOT IN ('admin', 'support', 'client')");
        $this->execute("ALTER TABLE users MODIFY role ENUM('admin','support','client') NOT NULL DEFAULT 'client'");
    }
}
