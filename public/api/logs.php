<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\logs\ActivityLogRepository;

boot_api();
$auth = auth_manager();
$auth->requireAuth();
json_response((new ActivityLogRepository())->getByUser((int) $auth->id()));
