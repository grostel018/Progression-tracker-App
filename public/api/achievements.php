<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\achievements\AchievementRepository;

boot_api();
$auth = auth_manager();
$auth->requireAuth();
json_response((new AchievementRepository())->getByUser((int) $auth->id()));
