<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

use src\api\logs\ActivityLogRepository;

boot_database();
$user = require_auth_user();

$logs = (new ActivityLogRepository())->getByUser((int) $user['id']);

view('dashboard/logs', [
    'user' => $user,
    'logs' => $logs,
]);
