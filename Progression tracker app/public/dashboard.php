<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

use src\lib\Auth;
use src\lib\Database;

Database::init(config('database'));

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$db = Database::getConnection();
$auth = new Auth($db, config('app'));
$auth->requireAuth();
$user = $auth->user();

$stats = [
    'total_dreams' => 0,
    'active_goals' => 0,
    'current_streak' => 0,
    'achievements' => 0,
];

$stmt = $db->prepare('SELECT COUNT(*) FROM dreams WHERE user_id = ?');
$stmt->execute([$user['id']]);
$stats['total_dreams'] = (int) $stmt->fetchColumn();

$stmt = $db->prepare('SELECT COUNT(*) FROM goals WHERE user_id = ? AND status = ?');
$stmt->execute([$user['id'], 'active']);
$stats['active_goals'] = (int) $stmt->fetchColumn();

try {
    $stmt = $db->prepare('SELECT current_streak FROM streaks WHERE user_id = ? LIMIT 1');
    $stmt->execute([$user['id']]);
    $stats['current_streak'] = (int) ($stmt->fetchColumn() ?: 0);
} catch (\PDOException) {
    $stats['current_streak'] = 0;
}

try {
    $stmt = $db->prepare('SELECT COUNT(*) FROM user_achievements WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $stats['achievements'] = (int) $stmt->fetchColumn();
} catch (\PDOException) {
    $stats['achievements'] = 0;
}

view('dashboard/index', [
    'user' => $user,
    'stats' => $stats,
]);
