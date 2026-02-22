<?php

declare(strict_types = 1)
;

use Phinx\Migration\AbstractMigration;

final class AddAccountStatusEmailTemplates extends AbstractMigration
{
    public function up(): void
    {
        $this->execute(<<<'SQL'
INSERT INTO email_templates (name, description, subject, body_html, body_text, sample_data, is_active)
VALUES
    (
        'account_pending_approval',
        'Account registered and awaiting approval',
        'Your account is awaiting approval',
        '<div style="background-color: #f6f9fc; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <div style="padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
            {{#if logoUrl}}
            <div style="margin-bottom: 12px;">
                <img src="{{logoUrl}}" alt="{{companyName}}" style="max-height: 48px; max-width: 180px; height: auto; width: auto;" />
            </div>
            {{/if}}
            <div style="font-size: 24px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px;">
                {{companyName}}
            </div>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 16px; font-size: 22px; line-height: 30px; color: #111827; font-weight: 700;">
                Account registered
            </h1>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                {{#if userName}}Hi {{userName}},{{else}}Hi there,{{/if}} your account has been registered and is awaiting approval from an administrator.
            </p>
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 20px;">
                We will notify you as soon as your access is approved.
            </p>
        </div>

        <div style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                Thank you for signing up
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; {{currentYear}} {{companyName}}. All rights reserved.
            </p>
        </div>
    </div>

    <div style="max-width: 500px; margin: 20px auto 0; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 11px; color: #9ca3af; line-height: 16px;">
            This is an automated message, please do not reply.
        </p>
        {{#if companyEmail}}
        <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 16px;">
            Need help? Contact us at <a href="mailto:{{companyEmail}}" style="color: #2563eb; text-decoration: none;">{{companyEmail}}</a>.
        </p>
        {{/if}}
    </div>
</div>',
        NULL,
        '{"companyName":"AIBase","currentYear":2026,"logoUrl":null,"userName":"Alex","companyEmail":"support@example.com"}',
        1
    ),
    (
        'account_approved',
        'Account approved notification',
        'Your account has been approved',
        '<div style="background-color: #f6f9fc; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <div style="padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
            {{#if logoUrl}}
            <div style="margin-bottom: 12px;">
                <img src="{{logoUrl}}" alt="{{companyName}}" style="max-height: 48px; max-width: 180px; height: auto; width: auto;" />
            </div>
            {{/if}}
            <div style="font-size: 24px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px;">
                {{companyName}}
            </div>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 16px; font-size: 22px; line-height: 30px; color: #111827; font-weight: 700;">
                Your account is approved
            </h1>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                {{#if userName}}Hi {{userName}},{{else}}Hi there,{{/if}} you now have access to {{companyName}}.
            </p>
            <div style="margin-bottom: 24px;">
                <a href="{{loginUrl}}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Sign in
                </a>
            </div>
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 20px;">
                If you have any questions, we''re here to help.
            </p>
        </div>

        <div style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                Welcome aboard
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; {{currentYear}} {{companyName}}. All rights reserved.
            </p>
        </div>
    </div>

    <div style="max-width: 500px; margin: 20px auto 0; text-align: center;">
        {{#if companyEmail}}
        <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 16px;">
            Need help? Contact us at <a href="mailto:{{companyEmail}}" style="color: #2563eb; text-decoration: none;">{{companyEmail}}</a>.
        </p>
        {{/if}}
    </div>
</div>',
        NULL,
        '{"companyName":"AIBase","currentYear":2026,"logoUrl":null,"userName":"Alex","loginUrl":"https://example.com/login","companyEmail":"support@example.com"}',
        1
    ),
    (
        'account_rejected',
        'Account rejected notification',
        'Your account request was not approved',
        '<div style="background-color: #f6f9fc; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <div style="padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
            {{#if logoUrl}}
            <div style="margin-bottom: 12px;">
                <img src="{{logoUrl}}" alt="{{companyName}}" style="max-height: 48px; max-width: 180px; height: auto; width: auto;" />
            </div>
            {{/if}}
            <div style="font-size: 24px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px;">
                {{companyName}}
            </div>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 16px; font-size: 22px; line-height: 30px; color: #111827; font-weight: 700;">
                Request not approved
            </h1>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                {{#if userName}}Hi {{userName}},{{else}}Hi there,{{/if}} your account request was not approved at this time.
            </p>
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 20px;">
                If you believe this is a mistake, please contact support for assistance.
            </p>
        </div>

        <div style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                We''re here to help
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; {{currentYear}} {{companyName}}. All rights reserved.
            </p>
        </div>
    </div>

    <div style="max-width: 500px; margin: 20px auto 0; text-align: center;">
        {{#if companyEmail}}
        <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 16px;">
            Contact support at <a href="mailto:{{companyEmail}}" style="color: #2563eb; text-decoration: none;">{{companyEmail}}</a>.
        </p>
        {{/if}}
    </div>
</div>',
        NULL,
        '{"companyName":"AIBase","currentYear":2026,"logoUrl":null,"userName":"Alex","companyEmail":"support@example.com"}',
        1
    )
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    subject = VALUES(subject),
    body_html = VALUES(body_html),
    body_text = VALUES(body_text),
    sample_data = VALUES(sample_data),
    is_active = VALUES(is_active)
SQL);
    }

    public function down(): void
    {
        $this->execute(
            "DELETE FROM email_templates WHERE name IN (
                'account_pending_approval',
                'account_approved',
                'account_rejected'
            )"
        );
    }
}
