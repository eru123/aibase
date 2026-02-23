<?php

require_once __DIR__ . '/autoload.php';

return [
    'paths' => [
        'migrations' => __DIR__ . '/db/migrations',
        'seeds' => __DIR__ . '/db/seeds',
    ],
    'environments' => [
        'default_migration_table' => 'migrations',
        'default_environment' => 'production',
        'production' => [
            'adapter' => 'mysql',
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'name' => $_ENV['DB_NAME'] ?? 'opensys',
            'user' => $_ENV['DB_USER'] ?? 'opensys',
            'pass' => $_ENV['DB_PASS'] ?? 'opensys',
            'port' => $_ENV['DB_PORT'] ?? 3306,
            'charset' => 'utf8mb4',
        ],
    ],
    'version_order' => 'creation',
];
