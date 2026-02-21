<?php

declare(strict_types = 1)
;

namespace Api\Controllers;

use Api\Context;
use Api\Models\EmailTemplate;
use Api\Models\SystemSetting;
use Api\Models\Upload;
use Api\Services\TemplateRenderer;

class EmailSendController extends BaseController
{
    public function sendTemplate(Context $ctx)
    {
        if (!SystemSetting::getBool('allow_mail_sending', false)) {
            return $this->forbidden($ctx, 'Mail sending is currently disabled.');
        }

        $payload = $this->input();
        $templateId = (int)($payload['template_id'] ?? 0);
        if (!$templateId) {
            return $this->badRequest($ctx, 'template_id is required');
        }

        /**
         * @var EmailTemplate|null $template
         */
        $template = EmailTemplate::find($templateId);
        if (!$template) {
            return $this->notFound($ctx, 'Email template not found');
        }
        if (isset($template['is_active']) && (int)$template['is_active'] !== 1) {
            return $this->badRequest($ctx, 'Email template is disabled');
        }

        [$data, $dataError] = $this->decodeJsonInput($payload['data'] ?? $template['sample_data'] ?? null);
        if ($dataError) {
            return $this->badRequest($ctx, $dataError);
        }

        [$recipients, $invalidRecipients] = $this->parseRecipients($payload['recipients'] ?? $payload['to'] ?? '');
        if (!empty($invalidRecipients)) {
            return $this->badRequest($ctx, 'Invalid recipients', ['recipients' => $invalidRecipients]);
        }
        if (empty($recipients)) {
            return $this->badRequest($ctx, 'At least one recipient is required');
        }

        [$attachments, $invalidAttachments] = $this->resolveAttachments($payload['attachments'] ?? []);
        if (!empty($invalidAttachments)) {
            return $this->badRequest($ctx, 'Invalid attachments', ['attachments' => $invalidAttachments]);
        }

        /** @var TemplateRenderer $renderer */
        $renderer = $ctx->service('templateRenderer');

        $altBody = null;
        try {
            $subject = $renderer->render((string)$template['subject'], $data);
            $html = $renderer->render((string)$template['body_html'], $data);
            if (!empty($template['body_text'])) {
                $altBody = $renderer->render((string)$template['body_text'], $data);
            }
        }
        catch (\Throwable $e) {
            return $this->badRequest($ctx, 'Template rendering failed: ' . $e->getMessage());
        }

        $options = [
            'attachments' => $attachments,
        ];
        if ($altBody) {
            $options['alt_body'] = $altBody;
        }
        if (!empty($payload['reply_to'])) {
            $options['reply_to'] = trim((string)$payload['reply_to']);
            $options['reply_to_name'] = trim((string)($payload['reply_to_name'] ?? ''));
        }

        return $this->sendBatch($ctx, $recipients, $subject, $html, $options);
    }

    public function sendRaw(Context $ctx)
    {
        if (!SystemSetting::getBool('allow_mail_sending', false)) {
            return $this->forbidden($ctx, 'Mail sending is currently disabled.');
        }


        $payload = $this->input();
        $subject = trim((string)($payload['subject'] ?? ''));
        $html = (string)($payload['html'] ?? $payload['body_html'] ?? '');

        if ($subject === '') {
            return $this->badRequest($ctx, 'subject is required');
        }
        if (trim($html) === '') {
            return $this->badRequest($ctx, 'html content is required');
        }

        [$recipients, $invalidRecipients] = $this->parseRecipients($payload['recipients'] ?? $payload['to'] ?? '');
        if (!empty($invalidRecipients)) {
            return $this->badRequest($ctx, 'Invalid recipients', ['recipients' => $invalidRecipients]);
        }
        if (empty($recipients)) {
            return $this->badRequest($ctx, 'At least one recipient is required');
        }

        [$attachments, $invalidAttachments] = $this->resolveAttachments($payload['attachments'] ?? []);
        if (!empty($invalidAttachments)) {
            return $this->badRequest($ctx, 'Invalid attachments', ['attachments' => $invalidAttachments]);
        }

        $options = [
            'attachments' => $attachments,
        ];
        if (!empty($payload['reply_to'])) {
            $options['reply_to'] = trim((string)$payload['reply_to']);
            $options['reply_to_name'] = trim((string)($payload['reply_to_name'] ?? ''));
        }

        return $this->sendBatch($ctx, $recipients, $subject, $html, $options);
    }

    private function sendBatch(Context $ctx, array $recipients, string $subject, string $html, array $options)
    {
        $email = $ctx->service('email');
        $results = [];
        $sent = 0;
        $failed = 0;

        foreach ($recipients as $recipient) {
            $ok = $email->sendMessage([$recipient], $subject, $html, $options);
            $results[] = [
                'email' => $recipient['email'],
                'name' => $recipient['name'] ?? null,
                'sent' => $ok,
            ];
            if ($ok) {
                $sent++;
            }
            else {
                $failed++;
            }
        }

        return $this->ok($ctx, [
            'success' => true,
            'sent' => $sent,
            'failed' => $failed,
            'results' => $results,
        ]);
    }

    private function parseRecipients($input): array
    {
        $raw = [];
        if (is_string($input)) {
            $normalized = str_replace(["\r\n", "\r"], "\n", $input);
            $raw = preg_split('/[,\n]+/', $normalized) ?: [];
        }
        elseif (is_array($input)) {
            $raw = $input;
        }

        $recipients = [];
        $invalid = [];

        foreach ($raw as $item) {
            if (is_array($item)) {
                $email = trim((string)($item['email'] ?? ''));
                $name = isset($item['name']) ? trim((string)$item['name']) : null;
            }
            else {
                $entry = trim((string)$item);
                if ($entry === '') {
                    continue;
                }
                if (preg_match('/^(.*)<([^>]+)>$/', $entry, $matches)) {
                    $name = trim($matches[1], " \t\n\r\0\x0B\"'");
                    $email = trim($matches[2]);
                }
                else {
                    $name = null;
                    $email = $entry;
                }
            }

            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $invalid[] = $item;
                continue;
            }

            $recipients[] = [
                'email' => $email,
                'name' => $name !== '' ? $name : null,
            ];
        }

        return [$recipients, $invalid];
    }

    private function resolveAttachments($input): array
    {
        if (!is_array($input)) {
            return [[], []];
        }

        $attachments = [];
        $invalid = [];
        $uploadDir = realpath(__DIR__ . '/../../uploads');

        foreach ($input as $attachmentId) {
            $id = is_string($attachmentId) ? trim($attachmentId) : (string)$attachmentId;
            if ($id === '') {
                continue;
            }

            /**
             * @var Upload|null $upload
             */
            $upload = Upload::find($id);
            if (!$upload) {
                $invalid[] = $id;
                continue;
            }

            $storagePath = $upload['storage_path'] ?? null;
            if (!$storagePath) {
                $invalid[] = $id;
                continue;
            }

            $fullPath = $uploadDir ? $uploadDir . DIRECTORY_SEPARATOR . $storagePath : null;
            if (!$fullPath || !is_file($fullPath)) {
                $invalid[] = $id;
                continue;
            }

            $attachments[] = [
                'path' => $fullPath,
                'name' => $upload['original_name'] ?? basename($fullPath),
                'mime' => $upload['mime_type'] ?? '',
            ];
        }

        return [$attachments, $invalid];
    }

    private function decodeJsonInput($value): array
    {
        if ($value === null || $value === '') {
            return [[], null];
        }

        if (is_array($value)) {
            return [$value, null];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [[], 'Invalid JSON payload'];
            }
            return [is_array($decoded) ? $decoded : [], null];
        }

        return [[], 'Invalid JSON payload'];
    }
}
