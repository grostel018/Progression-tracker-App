<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

start_app_session();

redirect(isset($_SESSION['user_id']) ? 'dashboard.php' : 'login.php');
