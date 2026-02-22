<?php

require __DIR__ . '/../../../vendor/autoload.php';

use Dotenv\Dotenv;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Load .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../../../');
$dotenv->safeLoad();

// Parse arguments
$options = getopt("", ["to:", "subject:", "body:", "from:"]);

if (!isset($options['to']) || !isset($options['subject']) || !isset($options['body'])) {
    echo "Usage: php send_email.php --to=email --subject=subject --body=body [--from=email]\n";
    exit(1);
}

$to = $options['to'];
$subject = $options['subject'];
$body = $options['body'];
$from = isset($options['from']) ? $options['from'] : ($_ENV['SMTP_SENDER_EMAIL'] ?? 'no-reply@localhost');
$fromName = $_ENV['SMTP_SENDER_NAME'] ?? 'AIBase App';

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host = $_ENV['SMTP_HOST'];
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['SMTP_USER'];
    $mail->Password = $_ENV['SMTP_PASS'];
    $mail->SMTPSecure = ($_ENV['SMTP_SECURE'] == 'true') ?PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $_ENV['SMTP_PORT'];

    // Recipients
    $mail->setFrom($from, $fromName);
    $mail->addAddress($to);

    // Content
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $body;
    $mail->AltBody = strip_tags($body);

    $mail->send();
    echo "Message has been sent to $to\n";
}
catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}\n";
    exit(1);
}
