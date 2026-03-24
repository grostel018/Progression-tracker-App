<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

logout_current_user();
redirect('login.php');
