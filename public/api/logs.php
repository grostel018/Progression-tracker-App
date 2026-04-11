<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

boot_api();
$auth = auth_manager();
$auth->requireAuth();
json_response(app_container()->activityLogs()->getByUser((int) $auth->id()));
