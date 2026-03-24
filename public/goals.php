<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

use src\api\goals\GoalRepository;

boot_database();
$user = require_auth_user();

$goals = (new GoalRepository())->getByUser((int) $user['id']);

view('dashboard/goals', [
    'user' => $user,
    'goals' => $goals,
]);
