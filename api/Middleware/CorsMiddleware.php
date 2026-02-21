<?php

namespace Api\Middleware;

use Api\Context;

class CorsMiddleware
{
    /**
     * Handle CORS for all requests
     * 
     * @param Context $ctx
     * @return bool|null
     */
    public static function handle(Context $ctx)
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Device-Fingerprint');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400'); // 24 hours
        
        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
        
        return true; // Continue to next handler
    }
}
