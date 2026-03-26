<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

boot_database();
$user = require_auth_user();

view('dashboard/logs', [
    'user' => $user,
]);
