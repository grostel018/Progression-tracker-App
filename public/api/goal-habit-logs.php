<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

boot_api();

$controller = app_container()->goalHabitLogController();
$habitId = request_query_int('habit_id');
$input = request_input();

if ($habitId <= 0) {
    json_response(['success' => false, 'message' => 'Missing habit_id.'], 400);
    return;
}

if (request_method() !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
    return;
}

json_response($controller->store($habitId, $input));
