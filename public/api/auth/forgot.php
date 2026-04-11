<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

boot_api();
$result = app_container()->forgotPasswordHandler()->handle(request_input());
$status = (int) ($result['status'] ?? 200);
unset($result['status']);
json_response($result, $status);
