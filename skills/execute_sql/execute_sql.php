<?php

require __DIR__ . '/../../../vendor/autoload.php';

use Dotenv\Dotenv;

// Load .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../../../');
$dotenv->safeLoad();

// Parse arguments
$options = getopt("", ["query:", "json"]);
$isJson = isset($options['json']);

if (!isset($options['query'])) {
    echo "Usage: php execute_sql.php --query=\"SELECT * FROM users\" [--json]\n";
    exit(1);
}

$query = $options['query'];

try {
    $dbHost = $_ENV['DB_HOST'] ?? 'localhost';
    $dbName = $_ENV['DB_NAME'] ?? 'opensys';
    $dbUser = $_ENV['DB_USER'] ?? 'opensys';
    $dbPass = $_ENV['DB_PASS'] ?? 'opensys';
    $dbPort = $_ENV['DB_PORT'] ?? 3306;

    $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4";

    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $stmt = $pdo->prepare($query);
    $stmt->execute();

    // Check if it's a SELECT query to return results
    if (stripos(trim($query), 'SELECT') === 0 || stripos(trim($query), 'SHOW') === 0) {
        $results = $stmt->fetchAll();
        if ($isJson) {
            echo json_encode($results, JSON_PRETTY_PRINT);
        }
        else {
            if (empty($results)) {
                echo "No results found.\n";
            }
            else {
                // simple table display
                $keys = array_keys($results[0]);
                echo implode("\t", $keys) . "\n";
                echo str_repeat("-", 50) . "\n";
                foreach ($results as $row) {
                    echo implode("\t", array_values($row)) . "\n";
                }
                echo "\nTotal rows: " . count($results) . "\n";
            }
        }
    }
    else {
        echo "Query executed successfully. Rows affected: " . $stmt->rowCount() . "\n";
    }
}
catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
