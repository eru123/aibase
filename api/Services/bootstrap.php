<?php

declare(strict_types=1);

use Api\Services\ServiceContainer;
use Api\Services\SmtpService;
use Api\Services\AuthorizationService;
use Api\Services\AuditService;
use Api\Services\AuthenticationService;
use Api\Services\EmailService;
use Api\Services\TemplateRenderer;
use Api\Middleware\AuthMiddleware;

/**
 * Bootstrap all services
 */
function bootstrapServices(): ServiceContainer
{
    $container = ServiceContainer::getInstance();

    // Register singletons
    $container->singleton('smtp', fn() => new SmtpService());
    $container->singleton('authorization', fn() => new AuthorizationService());
    $container->singleton('audit', fn() => new AuditService());
    $container->singleton('templateRenderer', fn() => new TemplateRenderer());
    $container->singleton('email', fn($c) => new EmailService(
        $c->get('smtp'),
        $c->get('templateRenderer')
    ));

    $container->singleton('authentication', fn($c) => new AuthenticationService(
        $c->get('audit'),
        $c->get('authorization')
    ));

    // Middleware
    $container->singleton('authMiddleware', fn($c) => new AuthMiddleware(
        $c->get('authentication'),
        $c->get('authorization')
    ));

    return $container;
}

// Bootstrap services
$services = bootstrapServices();
