<?php

declare(strict_types=1);

namespace Api\Services;

/**
 * Simple service container for dependency injection
 */
class ServiceContainer
{
    private static ?self $instance = null;
    private array $services = [];
    private array $singletons = [];

    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Register a service factory
     */
    public function register(string $name, callable $factory): void
    {
        $this->services[$name] = $factory;
    }

    /**
     * Register a singleton service
     */
    public function singleton(string $name, callable $factory): void
    {
        $this->register($name, $factory);
        $this->singletons[$name] = null;
    }

    /**
     * Get a service instance
     */
    public function get(string $name): mixed
    {
        if (!isset($this->services[$name])) {
            throw new \RuntimeException("Service '$name' not registered");
        }

        // Return singleton instance if already created
        if (array_key_exists($name, $this->singletons)) {
            if ($this->singletons[$name] === null) {
                $this->singletons[$name] = $this->services[$name]($this);
            }
            return $this->singletons[$name];
        }

        // Create new instance
        return $this->services[$name]($this);
    }

    /**
     * Check if a service is registered
     */
    public function has(string $name): bool
    {
        return isset($this->services[$name]);
    }

    /**
     * Set a service instance directly (useful for testing)
     */
    public function set(string $name, mixed $instance): void
    {
        $this->singletons[$name] = $instance;
        if (!isset($this->services[$name])) {
            $this->services[$name] = fn() => $instance;
        }
    }
}
