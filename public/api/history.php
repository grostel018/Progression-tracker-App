<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\history\HistoryController;

boot_api();

$controller = new HistoryController();
$mode = strtolower((string) ($_GET['mode'] ?? 'overview'));
$input = request_input();

switch (request_method()) {
    case 'GET':
        if ($mode === 'weekly-review') {
            json_response($controller->weeklyReview());
            return;
        }

        if ($mode === 'day') {
            json_response($controller->day($_GET));
            return;
        }

        json_response($controller->overview($_GET));
        return;

    case 'POST':
        json_response($controller->create($input));
        return;

    default:
        json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

