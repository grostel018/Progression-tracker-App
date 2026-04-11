<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

use src\api\logs\ActivityLogRepository;
use src\lib\Auth;
use src\lib\Database;

Database::init(config('database'));

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$db = Database::getConnection();
$auth = new Auth($db, config('app'));
$auth->requireAuth();
$user = $auth->user();

$logs = (new ActivityLogRepository())->getByUser((int) $user['id']);

view('dashboard/logs', [
    'user' => $user,
    'logs' => $logs,
]);
