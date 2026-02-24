<?php

declare(strict_types = 1)
;

use Phinx\Migration\AbstractMigration;

final class AddEmailTemplates extends AbstractMigration
{
    public function up(): void
    {
        $this->execute(
            "CREATE TABLE IF NOT EXISTS email_templates (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT NULL,
                subject VARCHAR(255) NOT NULL,
                body_html MEDIUMTEXT NOT NULL,
                body_text MEDIUMTEXT NULL,
                sample_data LONGTEXT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY email_templates_name_unique (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->execute(<<<'SQL'
INSERT INTO email_templates (name, description, subject, body_html, body_text, sample_data, is_active)
VALUES
    (
        'otp',
        'One-time passcode email',
        'Your Verification Code',
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
                Verification Code
            </h1>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                {{#if userName}}Hi {{userName}},{{else}}Hi there,{{/if}} use the following code to complete your request. This code is valid for <strong>{{expiryMinutes}} minutes</strong>.
            </p>

            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <span style="font-family: ''Courier New'', Courier, monospace; font-size: 36px; font-weight: 700; color: #2563eb; letter-spacing: 8px; display: inline-block;">
                    {{otpCode}}
                </span>
            </div>

            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 20px;">
                If you didn''t request this, you can safely ignore this email.
            </p>
        </div>

        <div style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                Securing your account
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; {{currentYear}} {{companyName}}. All rights reserved.
            </p>
        </div>
    </div>

    <div style="max-width: 500px; margin: 20px auto 0; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 16px;">
            This is an automated message, please do not reply. You received this because an account action was initiated at {{companyName}}.
        </p>
    </div>
</div>',
        NULL,
        '{"companyName":"OpenSys","currentYear":2026,"logoUrl":null,"userName":"Alex","otpCode":"123456","expiryMinutes":10}',
        1
    ),
    (
        'device_verification',
        'New device verification email',
        'New Device Login',
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
                Verify a New Device
            </h1>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                {{#if userName}}Hi {{userName}},{{else}}Hi there,{{/if}} we noticed a login from a new device:
                <strong>{{deviceInfo}}</strong>.
            </p>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                If this was you, please verify this device using the button below.
            </p>
            <div style="margin-bottom: 24px;">
                <a href="{{verificationUrl}}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Verify Device
                </a>
            </div>
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 20px;">
                If you didn''t attempt to log in, please secure your account immediately.
            </p>
        </div>

        <div style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                Securing your account
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; {{currentYear}} {{companyName}}. All rights reserved.
            </p>
        </div>
    </div>

    <div style="max-width: 500px; margin: 20px auto 0; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 16px;">
            This is an automated message, please do not reply. You received this because an account action was initiated at {{companyName}}.
        </p>
    </div>
</div>',
        NULL,
        '{"companyName":"OpenSys","currentYear":2026,"logoUrl":null,"userName":"Alex","deviceInfo":"Chrome on Windows","verificationUrl":"https://example.com/auth/verify-device?token=token"}',
        1
    ),
    (
        'user_invitation',
        'User invitation email',
        'You''re invited to OpenSys',
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
                You''re invited
            </h1>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                {{#if userName}}Hi {{userName}},{{else}}Hi there,{{/if}} {{inviterText}} invited you to join their workspace.
            </p>
            <div style="margin-bottom: 24px;">
                <a href="{{inviteUrl}}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Accept invitation
                </a>
            </div>
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 20px;">
                If you weren''t expecting this invitation, you can ignore this email.
            </p>
        </div>

        <div style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                Securing your account
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; {{currentYear}} {{companyName}}. All rights reserved.
            </p>
        </div>
    </div>

    <div style="max-width: 500px; margin: 20px auto 0; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 16px;">
            This is an automated message, please do not reply. You received this because an account action was initiated at {{companyName}}.
        </p>
    </div>
</div>',
        NULL,
        '{"companyName":"OpenSys","currentYear":2026,"logoUrl":null,"inviterText":"Alex","inviteUrl":"https://example.com/invite?token=token"}',
        1
    ),
    (
        'email_verification',
        'Email verification link',
        'Verify your email',
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
                Verify your email
            </h1>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                {{#if userName}}Hi {{userName}},{{else}}Hi there,{{/if}} please confirm your email address to finish setting up your account.
            </p>
            <div style="margin-bottom: 24px;">
                <a href="{{verificationUrl}}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Verify email
                </a>
            </div>
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 20px;">
                If you didn''t create an account, you can ignore this email.
            </p>
        </div>

        <div style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                Securing your account
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; {{currentYear}} {{companyName}}. All rights reserved.
            </p>
        </div>
    </div>

    <div style="max-width: 500px; margin: 20px auto 0; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 16px;">
            This is an automated message, please do not reply. You received this because an account action was initiated at {{companyName}}.
        </p>
    </div>
</div>',
        NULL,
        '{"companyName":"OpenSys","currentYear":2026,"logoUrl":null,"verificationUrl":"https://example.com/auth/verify-email?token=token"}',
        1
    ),
    (
        'password_reset',
        'Password reset link',
        'Reset your password',
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
                Reset your password
            </h1>
            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                {{#if userName}}Hi {{userName}},{{else}}Hi there,{{/if}} we received a request to reset your password. Click the button below to continue.
            </p>
            <div style="margin-bottom: 24px;">
                <a href="{{resetUrl}}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Reset password
                </a>
            </div>
            <p style="margin: 0 0 12px; font-size: 14px; color: #9ca3af; line-height: 20px;">
                This link will expire in 1 hour.
            </p>
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 20px;">
                If you didn''t request this, you can ignore this email.
            </p>
        </div>

        <div style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                Securing your account
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; {{currentYear}} {{companyName}}. All rights reserved.
            </p>
        </div>
    </div>

    <div style="max-width: 500px; margin: 20px auto 0; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 16px;">
            This is an automated message, please do not reply. You received this because an account action was initiated at {{companyName}}.
        </p>
    </div>
</div>',
        NULL,
        '{"companyName":"OpenSys","currentYear":2026,"logoUrl":null,"resetUrl":"https://example.com/auth/reset-password?token=token"}',
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
        $this->execute("DROP TABLE IF EXISTS email_templates");
    }
}
