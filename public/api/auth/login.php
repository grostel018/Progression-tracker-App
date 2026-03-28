<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\api\auth\LoginHandler;

boot_api();
$result = (new LoginHandler())->handle(request_input());
$status = (int) ($result['status'] ?? 200);
unset($result['status']);
json_response($result, $status);
