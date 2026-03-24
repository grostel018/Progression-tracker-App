<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\goals\GoalController;

boot_api();
dispatch_resource_controller(new GoalController());
