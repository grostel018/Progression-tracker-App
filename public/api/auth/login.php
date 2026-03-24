<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\api\auth\LoginHandler;

boot_api();
json_response((new LoginHandler())->handle(request_input()));
