<?php

declare(strict_types = 1)
;

namespace Api\Services;

/**
 * TOTP (Time-based One-Time Password) Authenticator Service
 * Compatible with Google Authenticator, Authy, etc.
 */
class AuthenticatorService
{
    private const PERIOD = 30; // 30 seconds
    private const DIGITS = 6;
    private const ALGORITHM = 'sha1';

    /**
     * Generate a new secret key
     */
    public function generateSecret(int $length = 32): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
        $secret = '';
        $max = strlen($chars) - 1;

        for ($i = 0; $i < $length; $i++) {
            $secret .= $chars[random_int(0, $max)];
        }

        return $secret;
    }

    /**
     * Verify a TOTP code
     */
    public function verify(string $secret, string $code, int $window = 1): bool
    {
        $timestamp = time();

        // Check current time and adjacent windows
        for ($i = -$window; $i <= $window; $i++) {
            $time = $timestamp + ($i * self::PERIOD);
            if ($this->generateCode($secret, $time) === $code) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate TOTP code for current time
     */
    public function getCurrentCode(string $secret): string
    {
        return $this->generateCode($secret, time());
    }

    /**
     * Generate TOTP code for a specific timestamp
     */
    private function generateCode(string $secret, int $timestamp): string
    {
        $time = pack('N*', 0) . pack('N*', intdiv($timestamp, self::PERIOD));
        $key = $this->base32Decode($secret);
        $hash = hash_hmac(self::ALGORITHM, $time, $key, true);

        $offset = ord($hash[strlen($hash) - 1]) & 0xf;
        $code = (
            ((ord($hash[$offset]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
            ) % (10 ** self::DIGITS);

        return str_pad((string)$code, self::DIGITS, '0', STR_PAD_LEFT);
    }

    /**
     * Get QR code provisioning URI
     */
    public function getProvisioningUri(string $secret, string $accountName, string $issuer = 'OpenSys'): string
    {
        $params = [
            'secret' => $secret,
            'issuer' => $issuer,
            'algorithm' => strtoupper(self::ALGORITHM),
            'digits' => self::DIGITS,
            'period' => self::PERIOD
        ];

        $query = http_build_query($params);
        return "otpauth://totp/" . urlencode($issuer) . ":" . urlencode($accountName) . "?$query";
    }

    /**
     * Get QR code data URL
     */
    public function getQrCodeDataUrl(string $provisioningUri): string
    {
        // Use QR Server API (free and reliable alternative)
        // Larger size for better scanning
        $size = 300;
        return "https://api.qrserver.com/v1/create-qr-code/?size={$size}x{$size}&data=" . urlencode($provisioningUri);
    }

    /**
     * Decode Base32 string
     */
    private function base32Decode(string $secret): string
    {
        $secret = strtoupper($secret);
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $paddingCharCount = substr_count($secret, '=');
        $allowedValues = [6, 4, 3, 1, 0];

        if (!in_array($paddingCharCount, $allowedValues)) {
            return '';
        }

        for ($i = 0; $i < 4; $i++) {
            if (
            $paddingCharCount === $allowedValues[$i] &&
            substr($secret, -($allowedValues[$i])) !== str_repeat('=', $allowedValues[$i])
            ) {
                return '';
            }
        }

        $secret = str_replace('=', '', $secret);
        $secret = str_split($secret);
        $binaryString = '';

        for ($i = 0; $i < count($secret); $i += 8) {
            $x = '';
            for ($j = 0; $j < 8; $j++) {
                if (!isset($secret[$i + $j]) || ($y = strpos($alphabet, $secret[$i + $j])) === false) {
                    $x .= '00000';
                }
                else {
                    $x .= str_pad(decbin($y), 5, '0', STR_PAD_LEFT);
                }
            }
            $eightBits = str_split($x, 8);
            for ($j = 0; $j < count($eightBits); $j++) {
                $binaryString .= chr(bindec(str_pad($eightBits[$j], 8, '0', STR_PAD_RIGHT)));
            }
        }

        return $binaryString;
    }
}
