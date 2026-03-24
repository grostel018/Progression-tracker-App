<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\api\auth\ResetPasswordHandler;

boot_api();

json_response((new ResetPasswordHandler())->reset(request_input()));
