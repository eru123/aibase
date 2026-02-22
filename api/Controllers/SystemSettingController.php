<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\SystemSetting;

class SystemSettingController extends BaseController
{
    use \Api\Traits\Sortable;

    private const SECURITY_DEFAULTS = [
        'enable_ip_check' => true,
        'auto_approve_invited_users' => false,
        'require_email_verifications' => false,
        'allow_registration' => false,
        'allow_mail_sending' => false,
        'debug_enabled' => false,
        'show_ui_components' => false,
    ];
    private const COMPANY_DEFAULTS = [
        'company_name' => 'AIBase',
        'company_logo_url' => '',
        'company_email' => '',
        'company_phone' => '',
        'company_website' => '',
        'company_address' => '',
    ];
    private const SMTP_DEFAULTS = [
        'smtp_host' => '',
        'smtp_port' => '',
        'smtp_username' => '',
        'smtp_password' => '',
        'smtp_encryption' => '',
        'smtp_from_email' => '',
        'smtp_from_name' => '',
        'smtp_mail' => false,
        'smtp_ses' => false,
    ];

    public function publicSettings(Context $ctx)
    {
        $defaults = array_intersect_key(
            self::SECURITY_DEFAULTS,
            array_flip(['allow_registration', 'require_email_verifications'])
        );
        $defaults = array_merge($defaults, self::COMPANY_DEFAULTS);
        $values = SystemSetting::getValues(array_keys($defaults), $defaults);

        $payload = array_merge(
            $this->normalizeSecuritySettings($values),
            $this->normalizeCompanySettings($values)
        );

        $safePayload = [];
        $allowed = array_merge(
            array_keys(self::COMPANY_DEFAULTS),
        ['allow_registration', 'require_email_verifications', 'show_ui_components']
        );

        foreach ($payload as $k => $v) {
            if (in_array($k, $allowed)) {
                $safePayload[$k] = $v;
            }
        }

        return $this->ok($ctx, [
            'success' => true,
            'data' => $safePayload,
        ]);
    }

    public function getSecuritySettings(Context $ctx)
    {
        $auth = $ctx->auth()->requireAdmin($ctx);
        if ($auth !== true)
            return $auth;

        $values = SystemSetting::getValues(array_keys(self::SECURITY_DEFAULTS), self::SECURITY_DEFAULTS);
        $security = $this->normalizeSecuritySettings($values);

        $companyValues = SystemSetting::getValues(array_keys(self::COMPANY_DEFAULTS), self::COMPANY_DEFAULTS);
        $company = $this->normalizeCompanySettings($companyValues);

        return $this->ok($ctx, [
            'success' => true,
            'data' => array_merge($security, $company),
        ]);
    }

    public function updateSecuritySettings(Context $ctx)
    {
        $payload = $this->input();

        $settings = $payload['settings'] ?? $payload;

        if (!is_array($settings)) {
            return $this->badRequest($ctx, 'settings payload must be an object');
        }

        $updated = [];
        foreach (self::SECURITY_DEFAULTS as $key => $default) {
            if (!array_key_exists($key, $settings)) {
                continue;
            }
            $normalized = SystemSetting::castBool($settings[$key], (bool)$default);
            SystemSetting::upsertValue($key, $normalized);
            $updated[$key] = $normalized;
        }

        if (empty($updated)) {
            return $this->badRequest($ctx, 'No valid settings provided');
        }

        $values = SystemSetting::getValues(array_keys(self::SECURITY_DEFAULTS), self::SECURITY_DEFAULTS);
        $payload = $this->normalizeSecuritySettings($values);

        return $this->ok($ctx, [
            'success' => true,
            'data' => $payload,
        ]);
    }

    public function updateCompanySettings(Context $ctx)
    {
        $payload = $this->input();

        $settings = $payload['settings'] ?? $payload;

        if (!is_array($settings)) {
            return $this->badRequest($ctx, 'settings payload must be an object');
        }

        $updated = [];
        foreach (self::COMPANY_DEFAULTS as $key => $default) {
            if (!array_key_exists($key, $settings)) {
                continue;
            }
            $raw = $settings[$key];
            $normalized = $raw === null ? '' : (is_string($raw) ? trim($raw) : (string)$raw);
            SystemSetting::upsertValue($key, $normalized);
            $updated[$key] = $normalized;
        }

        if (empty($updated)) {
            return $this->badRequest($ctx, 'No valid settings provided');
        }

        $values = SystemSetting::getValues(array_keys(self::COMPANY_DEFAULTS), self::COMPANY_DEFAULTS);
        $payload = $this->normalizeCompanySettings($values);

        return $this->ok($ctx, [
            'success' => true,
            'data' => $payload,
        ]);
    }

    public function getSmtpSettings(Context $ctx)
    {
        $auth = $ctx->auth()->requireAdmin($ctx);
        if ($auth !== true)
            return $auth;

        $values = SystemSetting::getValues(array_keys(self::SMTP_DEFAULTS), self::SMTP_DEFAULTS);
        $payload = $this->normalizeSmtpSettings($values);

        return $this->ok($ctx, [
            'success' => true,
            'data' => $payload,
        ]);
    }

    public function updateSmtpSettings(Context $ctx)
    {
        $payload = $this->input();

        $settings = $payload['settings'] ?? $payload;

        if (!is_array($settings)) {
            return $this->badRequest($ctx, 'settings payload must be an object');
        }

        $updated = [];
        foreach (self::SMTP_DEFAULTS as $key => $default) {
            if (!array_key_exists($key, $settings)) {
                continue;
            }
            $raw = $settings[$key];
            if (is_bool($default)) {
                $normalized = SystemSetting::castBool($raw, $default);
            }
            else {
                $normalized = $raw === null ? '' : (is_string($raw) ? trim($raw) : (string)$raw);
            }
            SystemSetting::upsertValue($key, $normalized);
            $updated[$key] = $normalized;
        }

        if (empty($updated)) {
            return $this->badRequest($ctx, 'No valid settings provided');
        }

        $values = SystemSetting::getValues(array_keys(self::SMTP_DEFAULTS), self::SMTP_DEFAULTS);
        $payload = $this->normalizeSmtpSettings($values);

        return $this->ok($ctx, [
            'success' => true,
            'data' => $payload,
        ]);
    }

    private function normalizeSecuritySettings(array $values): array
    {
        $normalized = [];
        foreach (self::SECURITY_DEFAULTS as $key => $default) {
            $normalized[$key] = SystemSetting::castBool($values[$key] ?? $default, (bool)$default);
        }
        return $normalized;
    }

    private function normalizeCompanySettings(array $values): array
    {
        $normalized = [];
        foreach (self::COMPANY_DEFAULTS as $key => $default) {
            $value = $values[$key] ?? $default;
            if ($value === null) {
                $normalized[$key] = '';
                continue;
            }
            $normalized[$key] = is_string($value) ? $value : (string)$value;
        }
        return $normalized;
    }

    private function normalizeSmtpSettings(array $values): array
    {
        $normalized = [];
        foreach (self::SMTP_DEFAULTS as $key => $default) {
            if (is_bool($default)) {
                $normalized[$key] = SystemSetting::castBool($values[$key] ?? $default, $default);
            }
            else {
                $value = $values[$key] ?? $default;
                $normalized[$key] = $value === null ? '' : (is_string($value) ? $value : (string)$value);
            }
        }
        return $normalized;
    }

    public function index(Context $ctx)
    {


        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $query = SystemSetting::query()->select(['system_settings.*']);

        // Filters
        if ($key = $ctx->query('key')) {
            $query->whereRaw('`system_settings`.`key` LIKE ?', ['%' . $key . '%']);
        }

        $query = $this->applySorting($query, ['key', 'value', 'created_at', 'updated_at'], 'created_at', 'desc');

        $settings = $query
            ->limit($limit)
            ->offset($offset)
            ->get();

        $total = SystemSetting::query()->count();

        return $this->ok($ctx, [
            'data' => $settings,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function store(Context $ctx)
    {


        $data = $this->input();
        $errors = $this->validate($data, [
            'key' => 'required',
            'value' => 'required'
        ]);

        if ($errors)
            return $this->badRequest($ctx, 'Validation failed', $errors);

        $setting = new SystemSetting($data);
        $setting->save();

        return $this->created($ctx, $setting->toArray());
    }

    public function show(Context $ctx)
    {


        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var SystemSetting|null $setting */
        $setting = SystemSetting::find($id);
        if (!$setting)
            return $this->notFound($ctx, 'System setting not found');

        return $this->ok($ctx, $setting->toArray());
    }

    public function update(Context $ctx)
    {


        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var SystemSetting|null $setting */
        $setting = SystemSetting::find($id);
        if (!$setting)
            return $this->notFound($ctx, 'System setting not found');

        $data = $this->input();

        foreach ($data as $k => $v) {
            $setting->$k = $v;
        }
        $setting->save();

        return $this->ok($ctx, $setting->toArray());
    }

    public function destroy(Context $ctx)
    {
        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var SystemSetting|null $setting */
        $setting = SystemSetting::find($id);
        if (!$setting)
            return $this->notFound($ctx, 'System setting not found');

        $setting->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }
}
