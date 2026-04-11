<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

boot_api();
dispatch_resource_controller(app_container()->categoryController());
