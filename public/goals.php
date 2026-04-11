<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

boot_database();
$user = require_auth_user();

$goals = app_container()->goalRepository()->getByUser((int) $user['id']);

view('dashboard/goals', [
    'user' => $user,
    'goals' => $goals,
]);
