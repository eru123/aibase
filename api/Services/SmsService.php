<?php

declare(strict_types=1);

namespace Api\Services;

use Api\Models\SystemSetting;

/**
 * SMS Service (supports multiple providers)
 */
class SmsService
{
    private ?string $provider = null;
    private ?string $apiKey = null;
    private ?string $apiSecret = null;
    private ?string $senderId = null;

    public function __construct()
    {
        $this->loadSettings();
    }

    private function loadSettings(): void
    {
        $settings = SystemSetting::query()
            ->whereRaw("`key` IN ('sms_provider', 'sms_api_key', 'sms_api_secret', 'sms_sender_id')")
            ->get();

        foreach ($settings as $setting) {
            match ($setting['key']) {
                'sms_provider' => $this->provider = $setting['value'],
                'sms_api_key' => $this->apiKey = $setting['value'],
                'sms_api_secret' => $this->apiSecret = $setting['value'],
                'sms_sender_id' => $this->senderId = $setting['value'],
                default => null
            };
        }
    }

    /**
     * Send SMS
     */
    public function send(string $to, string $message): bool
    {
        if (!$this->isConfigured()) {
            error_log("SMS not configured");
            return false;
        }

        return match ($this->provider) {
            'twilio' => $this->sendViaTwilio($to, $message),
            'nexmo' => $this->sendViaNexmo($to, $message),
            'test' => $this->sendViaTest($to, $message),
            default => false
        };
    }

    private function sendViaTwilio(string $to, string $message): bool
    {
        // Twilio API implementation
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$this->apiKey}/Messages.json";

        $data = [
            'From' => $this->senderId,
            'To' => $to,
            'Body' => $message
        ];

        return $this->makeHttpRequest($url, $data, [
            'Authorization: Basic ' . base64_encode("{$this->apiKey}:{$this->apiSecret}")
        ]);
    }

    private function sendViaNexmo(string $to, string $message): bool
    {
        // Nexmo/Vonage API implementation
        $url = "https://rest.nexmo.com/sms/json";

        $data = [
            'api_key' => $this->apiKey,
            'api_secret' => $this->apiSecret,
            'from' => $this->senderId,
            'to' => $to,
            'text' => $message
        ];

        return $this->makeHttpRequest($url, $data);
    }

    private function sendViaTest(string $to, string $message): bool
    {
        // For testing: just log the message
        error_log("TEST SMS to $to: $message");
        return true;
    }

    private function makeHttpRequest(string $url, array $data, array $headers = []): bool
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge([
            'Content-Type: application/x-www-form-urlencoded'
        ], $headers));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            return true;
        }

        error_log("SMS API Error (HTTP $httpCode): $response");
        return false;
    }

    private function isConfigured(): bool
    {
        return $this->provider !== null && $this->apiKey !== null;
    }

    /**
     * Send OTP via SMS
     */
    public function sendOtp(string $to, string $code): bool
    {
        $message = "Your verification code is: $code. Valid for 10 minutes.";
        return $this->send($to, $message);
    }
}
