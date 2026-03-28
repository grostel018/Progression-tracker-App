<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\api\auth\RegisterHandler;

boot_api();
$result = (new RegisterHandler())->handle(request_input());
$status = (int) ($result['status'] ?? 200);
unset($result['status']);
json_response($result, $status);
