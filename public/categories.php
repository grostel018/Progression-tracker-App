<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

use src\api\categories\CategoryRepository;

boot_database();
$user = require_auth_user();

$categories = (new CategoryRepository())->getByUser((int) $user['id']);

view('dashboard/categories', [
    'user' => $user,
    'categories' => $categories,
]);
