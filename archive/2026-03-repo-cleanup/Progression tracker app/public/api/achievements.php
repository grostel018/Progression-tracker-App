<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use src\lib\Auth;
use src\lib\Database;

Database::init(config('database'));

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

$db = Database::getConnection();
$auth = new Auth($db, config('app'));
$auth->requireAuth();

try {
    $stmt = $db->prepare(
        'SELECT a.id, a.name, a.description, ua.earned_at
         FROM user_achievements ua
         JOIN achievements a ON a.id = ua.achievement_id
         WHERE ua.user_id = ?
         ORDER BY ua.earned_at DESC'
    );
    $stmt->execute([$auth->id()]);
    echo json_encode($stmt->fetchAll());
} catch (\PDOException) {
    echo json_encode([]);
}
