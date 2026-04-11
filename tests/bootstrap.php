<?php

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once dirname(__DIR__) . '/src/bootstrap.php';

$testRuntimePath = BASE_PATH . '/var/tests-runtime';

if (!is_dir($testRuntimePath)) {
    mkdir($testRuntimePath, 0775, true);
}

$testSessionPath = $testRuntimePath . '/sessions';

if (!is_dir($testSessionPath)) {
    mkdir($testSessionPath, 0775, true);
}

if (session_status() === PHP_SESSION_NONE) {
    session_save_path($testSessionPath);
}
