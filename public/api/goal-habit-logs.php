<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\goals\GoalHabitLogController;

boot_api();

$controller = new GoalHabitLogController();
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
