<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

start_app_session();

if (request_method() !== 'POST') {
    redirect('dashboard.php');
}

require_csrf_token();
logout_current_user();
redirect('login.php');
