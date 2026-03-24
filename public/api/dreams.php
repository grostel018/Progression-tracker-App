<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\dreams\DreamController;

boot_api();
dispatch_resource_controller(new DreamController());
