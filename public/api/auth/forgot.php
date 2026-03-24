<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\api\auth\ForgotPasswordHandler;

boot_api();
json_response((new ForgotPasswordHandler())->handle(request_input()));
