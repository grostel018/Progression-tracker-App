<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

boot_database();
$user = require_auth_user();

$categories = app_container()->categoryRepository()->getByUser((int) $user['id']);

view('dashboard/categories', [
    'user' => $user,
    'categories' => $categories,
]);
