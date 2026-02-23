<?php

require __DIR__ . '/../../autoload.php';

use Api\Services\SmtpService;

// Parse arguments
$options = getopt("", ["to:", "subject:", "body:", "from:"]);

if (!isset($options['to']) || !isset($options['subject']) || !isset($options['body'])) {
    echo "Usage: php send_email.php --to=email --subject=subject --body=body [--from=email]\n";
    exit(1);
}

$to = $options['to'];
$subject = $options['subject'];
$body = $options['body'];

$smtp = new SmtpService();

$sendOptions = [];
if (isset($options['from'])) {
    $sendOptions['from_email'] = $options['from'];
}

try {
    $result = $smtp->sendMessage(
        [['email' => $to]],
        $subject,
        $body,
        $sendOptions
    );

    if ($result) {
        echo "Message has been sent to $to\n";
    } else {
        echo "Failed to send message\n";
        exit(1);
    }
} catch (\Throwable $e) {
    echo "Message could not be sent. Error: {$e->getMessage()}\n";
    exit(1);
}
