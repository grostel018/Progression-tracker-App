<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\goals\GoalHabitController;

boot_api();

$controller = new GoalHabitController();
$goalId = request_query_int('goal_id');
$habitId = request_query_int('id');
$input = request_input();

switch (request_method()) {
    case 'GET':
        if ($goalId <= 0) {
            json_response(['success' => false, 'message' => 'Missing goal_id.'], 400);
            return;
        }

        json_response($controller->index($goalId));
        return;

    case 'POST':
        if ($goalId <= 0) {
            json_response(['success' => false, 'message' => 'Missing goal_id.'], 400);
            return;
        }

        json_response($controller->store($goalId, $input));
        return;

    case 'PUT':
        if ($habitId <= 0) {
            json_response(['success' => false, 'message' => 'Missing habit id.'], 400);
            return;
        }

        json_response($controller->update($habitId, $input));
        return;

    case 'DELETE':
        if ($habitId <= 0) {
            json_response(['success' => false, 'message' => 'Missing habit id.'], 400);
            return;
        }

        json_response($controller->delete($habitId));
        return;

    default:
        json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}
