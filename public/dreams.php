<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

boot_database();
$user = require_auth_user();

$dreams = app_container()->dreamRepository()->getByUser((int) $user['id']);

view('dashboard/dreams', [
    'user' => $user,
    'dreams' => $dreams,
]);
