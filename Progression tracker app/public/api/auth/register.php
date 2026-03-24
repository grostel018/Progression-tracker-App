<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\api\auth\RegisterHandler;
use src\lib\Database;

Database::init(config('database'));

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
echo json_encode((new RegisterHandler())->handle($_POST));
