<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

redirect_if_authenticated();

$token = trim((string) ($_GET['token'] ?? ''));

view('auth/reset-password', [
    'token' => $token,
]);
