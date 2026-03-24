<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\api\auth\RegisterHandler;

boot_api();
json_response((new RegisterHandler())->handle(request_input()));
