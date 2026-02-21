<?php

require __DIR__ . '/../../../vendor/autoload.php';

use Dotenv\Dotenv;
use Api\Models\User;
use Api\Models\Session;
use Api\Services\SecurityService;

// Load .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../../../');
$dotenv->safeLoad();

// Parse arguments
$options = getopt("", ["user:", "expire::", "remember"]);

if (!isset($options['user'])) {
    echo "Usage: php generate_auth_token.php --user=USERNAME_OR_EMAIL [--expire=DAYS] [--remember]\n";
    exit(1);
}

$identifier = $options['user'];
$expireDays = isset($options['expire']) ? (int)$options['expire'] : 7;
if (isset($options['remember'])) {
    $expireDays = 30;
}

try {
    // Find User
    $user = User::query()
        ->whereRaw('(username = ? OR email = ?)', [$identifier, $identifier])
        ->first();

    if (!$user) {
        echo "Error: User not found with identifier '$identifier'\n";
        exit(1);
    }

    if (!(bool) ($user['is_active'] ?? false)) {
        echo "Warning: User is not active.\n";
    }

    // Generate Token
    // Logic mirrored from AuthenticationService::generateToken() and login()
    $rawToken = bin2hex(random_bytes(32));
    $hashedToken = hash('sha256', $rawToken);

    // Calculate expiry (UTC)
    $expiresAt = gmdate('Y-m-d H:i:s', strtotime("+$expireDays days"));

    // Create Session
    Session::create([
        'user_id' => $user['id'],
        'token' => $hashedToken,
        'expires_at' => $expiresAt
    ]);

    echo "Token generated successfully for user: {$user['username']} ({$user['id']})\n";
    echo "---------------------------------------------------\n";
    echo "Files Content:\n$rawToken\n"; // "Files Content" is just a label, but I'll make it cleaner
    echo "---------------------------------------------------\n";
    echo "Expires: $expiresAt (UTC)\n";
    echo "\nUsage Example:\n";
    echo "Authorization: Bearer $rawToken\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
