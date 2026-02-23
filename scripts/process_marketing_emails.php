<?php

declare(strict_types=1);

require_once __DIR__ . '/../autoload.php';

use Api\Models\MarketingEmailRequest;

$container = bootstrapServices();
$emailService = $container->get('email');
$pdo = MarketingEmailRequest::getPDO();

$batchSize = max(1, (int)($argv[1] ?? 10));

$requestsStmt = $pdo->prepare('SELECT * FROM marketing_email_requests WHERE status = ? ORDER BY requested_at ASC LIMIT ?');
$requestsStmt->bindValue(1, 'pending');
$requestsStmt->bindValue(2, $batchSize, PDO::PARAM_INT);
$requestsStmt->execute();
$requests = $requestsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

foreach ($requests as $request) {
    $requestId = (int)$request['id'];

    $pdo->prepare('UPDATE marketing_email_requests SET status = ?, updated_at = NOW() WHERE id = ?')->execute(['processing', $requestId]);

    $recipientStmt = $pdo->prepare('SELECT * FROM marketing_email_request_recipients WHERE marketing_email_request_id = ? AND status = ?');
    $recipientStmt->execute([$requestId, 'pending']);
    $recipients = $recipientStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $sent = 0;
    $failed = 0;

    foreach ($recipients as $recipient) {
        $ok = $emailService->sendMessage(
            [
                [
                    'email' => $recipient['email'],
                    'name' => $recipient['name'] ?: null,
                ],
            ],
            (string)$request['subject'],
            (string)$request['body_html'],
            []
        );

        if ($ok) {
            $sent++;
            $pdo->prepare('UPDATE marketing_email_request_recipients SET status = ?, sent_at = NOW(), updated_at = NOW() WHERE id = ?')->execute(['sent', (int)$recipient['id']]);
        } else {
            $failed++;
            $pdo->prepare('UPDATE marketing_email_request_recipients SET status = ?, error_message = ?, updated_at = NOW() WHERE id = ?')->execute(['failed', 'Failed to send using configured SMTP.', (int)$recipient['id']]);
        }
    }

    $finalStatus = $failed > 0 ? ($sent > 0 ? 'partial' : 'failed') : 'sent';
    $pdo->prepare('UPDATE marketing_email_requests
        SET status = ?, sent_count = ?, failed_count = ?, processed_at = NOW(), updated_at = NOW()
        WHERE id = ?')->execute([$finalStatus, $sent, $failed, $requestId]);

    echo sprintf("Processed request #%d: sent=%d failed=%d\n", $requestId, $sent, $failed);
}
