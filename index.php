<?php

require_once __DIR__ . '/autoload.php';

use Api\Context;
use Api\Router;
use Api\Controllers\Routes;
use Api\Middleware\CorsMiddleware;

// Handle CORS before anything else
CorsMiddleware::handle(new Context(new Router(), []));

$app = new Router();

// API routes (check first before static files)
$app->group('/api', [Routes::class, 'handler']);

// Static file routes for uploads
$app->static('/assets', __DIR__ . '/uploads');

// Static files from dist (JS, CSS, images)
$app->static('/', __DIR__ . '/dist');

// Fallback route to serve index.html for SPA (for all non-matched routes)
$app->any('/(.*)?', fn(Context $ctx) => $ctx->router->serveFile(__DIR__ . '/dist/index.html'));

$app->run();
