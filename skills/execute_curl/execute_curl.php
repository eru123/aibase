<?php

// Parse arguments
$options = getopt("", ["url:", "method::", "data::", "data-base64::", "header::"]);

if (!isset($options['url'])) {
    echo "Usage: php execute_curl.php --url=URL [--method=GET] [--data=DATA] [--header=HEADER]\n";
    exit(1);
}

$url = $options['url'];
$method = strtoupper($options['method'] ?? 'GET');
$data = $options['data'] ?? null;
if (isset($options['data-base64'])) {
    $data = base64_decode($options['data-base64']);
}
$headers = [];

if (isset($options['header'])) {
    if (is_array($options['header'])) {
        $headers = $options['header'];
    } else {
        $headers[] = $options['header'];
    }
}

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Follow redirects
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Skip SSL verify if needed (user had a task about ENFORCING it, so I should probably enforce it or default to system)
// Default is verify.
// In the conversation history "Enforcing SSL Verification", the user wanted to enforce it.
// So I will explicitely enable it or just leave default (which is usually enabled).
// But for development (Laragon), sometimes we need to point to CA.
// I'll leave it to default but add an option to insecure if needed?
// No, I'll stick to secure by default.

if ($data) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);


if ($error) {
    echo "Error: $error\n";
    exit(1);
}

echo "HTTP Status: $httpCode\n";
echo "Response:\n$response\n";
