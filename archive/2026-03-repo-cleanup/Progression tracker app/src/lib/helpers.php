<?php

declare(strict_types=1);

/**
 * Helper Functions
 * Global utility functions for the application
 */

// Load all config files on first load
if (!isset($GLOBALS['config_loaded'])) {
    $GLOBALS['config'] = [];
    $configDir = defined('BASE_PATH')
        ? BASE_PATH . '/config/'
        : dirname(__DIR__, 2) . '/config/';
    if (file_exists($configDir . 'database.php')) {
        $GLOBALS['config']['database'] = require $configDir . 'database.php';
    }
    if (file_exists($configDir . 'app.php')) {
        $GLOBALS['config']['app'] = require $configDir . 'app.php';
    }
    $GLOBALS['config_loaded'] = true;
}

if (!function_exists('config')) {
    /**
     * Get configuration value
     */
    function config(string $key, $default = null)
    {
        $parts = explode('.', $key);
        $config = $GLOBALS['config'] ?? [];

        $current = $config;

        foreach ($parts as $part) {
            if (isset($current[$part])) {
                $current = $current[$part];
            } else {
                return $default;
            }
        }

        return $current;
    }
}

if (!function_exists('view')) {
    /**
     * Render a view template
     */
    function view(string $template, array $data = []): void
    {
        $path = __DIR__ . '/../views/' . $template . '.php';

        if (!file_exists($path)) {
            http_response_code(404);
            echo "View not found: " . htmlspecialchars($template);
            return;
        }

        extract($data);
        include $path;
    }
}

if (!function_exists('redirect')) {
    /**
     * Redirect to a URL
     */
    function redirect(string $url, int $code = 302): void
    {
        header('Location: ' . $url, true, $code);
        exit;
    }
}

if (!function_exists('safe_output')) {
    /**
     * Escape output for HTML
     */
    function safe_output(string $string): string
    {
        return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('is_post')) {
    /**
     * Check if request method is POST
     */
    function is_post(): bool
    {
        return $_SERVER['REQUEST_METHOD'] === 'POST';
    }
}

if (!function_exists('is_ajax')) {
    /**
     * Check if request is AJAX
     */
    function is_ajax(): bool
    {
        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
}

if (!function_exists('wants_json')) {
    /**
     * Check if request expects a JSON response
     */
    function wants_json(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';

        return str_contains($accept, 'application/json') ||
            is_ajax() ||
            str_contains($requestUri, '/api/');
    }
}
