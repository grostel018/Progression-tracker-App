<?php

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));
define('SRC_PATH', __DIR__);

spl_autoload_register(static function (string $class): void {
    $prefix = 'src\\';

    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $path = SRC_PATH . '/' . str_replace('\\', '/', $relativeClass) . '.php';

    if (is_file($path)) {
        require_once $path;
    }
});

require_once SRC_PATH . '/lib/helpers.php';

date_default_timezone_set(config('app.timezone', 'UTC'));

$sessionPath = BASE_PATH . '/var/sessions';

if (!is_dir($sessionPath)) {
    mkdir($sessionPath, 0777, true);
}

if (is_dir($sessionPath) && is_writable($sessionPath) && session_status() === PHP_SESSION_NONE) {
    session_save_path($sessionPath);
}
