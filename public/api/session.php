<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\auth\SessionManager;

boot_api();
json_response((new SessionManager())->checkSession());
