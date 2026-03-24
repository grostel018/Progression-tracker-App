<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\goals\GoalTaskController;

boot_api();

$controller = new GoalTaskController();
$goalId = request_query_int('goal_id');
$taskId = request_query_int('id');
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
        if ($taskId <= 0) {
            json_response(['success' => false, 'message' => 'Missing task id.'], 400);
            return;
        }

        json_response($controller->update($taskId, $input));
        return;

    case 'DELETE':
        if ($taskId <= 0) {
            json_response(['success' => false, 'message' => 'Missing task id.'], 400);
            return;
        }

        json_response($controller->delete($taskId));
        return;

    default:
        json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}
