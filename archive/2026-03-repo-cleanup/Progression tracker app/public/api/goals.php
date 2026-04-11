<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\api\goals\GoalController;
use src\lib\Database;

Database::init(config('database'));

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

$controller = new GoalController();
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        echo json_encode(isset($_GET['id']) ? $controller->show((int) $_GET['id']) : $controller->index());
        break;

    case 'POST':
        echo json_encode($controller->store($input));
        break;

    case 'PUT':
        parse_str(file_get_contents('php://input'), $put);
        echo json_encode($controller->update((int) ($_GET['id'] ?? 0), $put));
        break;

    case 'DELETE':
        echo json_encode($controller->delete((int) ($_GET['id'] ?? 0)));
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
