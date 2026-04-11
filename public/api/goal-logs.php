<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

boot_api();

$controller = app_container()->goalLogController();
$goalId = request_query_int('goal_id');
$logId = request_query_int('id');
$input = request_input();

if ($goalId <= 0) {
    json_response(['success' => false, 'message' => 'Missing goal_id'], 400);
    return;
}

switch (request_method()) {
    case 'GET':
        json_response($controller->index($goalId));
        return;

    case 'POST':
        json_response($controller->store($goalId, $input));
        return;

    case 'PUT':
        if ($logId <= 0) {
            json_response(['success' => false, 'message' => 'Missing log id'], 400);
            return;
        }

        json_response($controller->update($logId, $goalId, $input));
        return;

    case 'DELETE':
        if ($logId <= 0) {
            json_response(['success' => false, 'message' => 'Missing log id'], 400);
            return;
        }

        json_response($controller->delete($logId, $goalId));
        return;

    default:
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}
