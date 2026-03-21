<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\api\auth\AuthInputValidator;
use src\lib\Database;

Database::init(config('database'));

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

$validator = new AuthInputValidator(config('app'));
$validation = $validator->validateRecovery($_POST);

if ($validation !== []) {
    echo json_encode(['success' => false] + $validation);
    exit;
}

$email = trim((string) ($_POST['email'] ?? ''));

try {
    $db = Database::getConnection();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $stmt->fetchColumn();
} catch (\PDOException) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Password reset is not implemented yet. Email lookup succeeded.',
]);
