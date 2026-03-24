<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

use src\api\dreams\DreamRepository;

boot_database();
$user = require_auth_user();

$dreams = (new DreamRepository())->getByUser((int) $user['id']);

view('dashboard/dreams', [
    'user' => $user,
    'dreams' => $dreams,
]);
