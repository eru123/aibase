<?php

// Parse arguments
$options = getopt("", ["count::", "gender::"]);

$count = isset($options['count']) ? (int)$options['count'] : 1;
$count = max(1, min($count, 20)); // Limit between 1 and 20

$gender = isset($options['gender']) ? $options['gender'] : null;

$targetDir = __DIR__ . '/../../../uploads/downloaded_avatars';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

echo "Downloading $count avatar(s)...\n";

for ($i = 0; $i < $count; $i++) {
    $seed = bin2hex(random_bytes(8));
    if ($gender) {
        $seed .= '-' . $gender;
    }

    // DiceBear Avataaars API
    $url = "https://api.dicebear.com/9.x/avataaars/png?seed=$seed";

    echo "[$i] Fetching $url ... ";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // DiceBear redirects
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    curl_close($ch);

    if ($error) {
        echo "Failed: $error\n";
        continue;
    }

    if ($httpCode !== 200) {
        echo "Failed (HTTP $httpCode)\n";
        continue;
    }

    $filename = "avatar_" . date('Ymd_His') . "_$seed.png";
    $filepath = $targetDir . '/' . $filename;

    if (file_put_contents($filepath, $imageData)) {
        echo "Saved to $filepath\n";
    } else {
        echo "Failed to save file\n";
    }

    // Slight pause to be nice to the API if doing many
    if ($count > 1) {
        usleep(200000); // 200ms
    }
}

echo "Done.\n";
