<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

use src\api\dashboard\DashboardRepository;

boot_database();
$user = require_auth_user();
$stats = (new DashboardRepository())->getStats((int) $user['id']);

view('dashboard/index', [
    'user' => $user,
    'stats' => $stats,
]);
