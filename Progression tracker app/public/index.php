<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

redirect(isset($_SESSION['user_id']) ? 'dashboard.php' : 'login.php');
