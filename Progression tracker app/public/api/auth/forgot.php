<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../src/bootstrap.php';

use src\lib\Database;

Database::init(config('database'));

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

$email = trim($_POST['email'] ?? '');

if ($email === '') {
    echo json_encode(['success' => false, 'message' => 'Email is required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

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
