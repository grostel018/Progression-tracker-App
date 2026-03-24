<?php

namespace src\api\dashboard;

use PDO;
use PDOException;
use src\lib\Database;

class DashboardRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getStats(int $userId): array
    {
        $stats = [
            'total_dreams' => 0,
            'active_goals' => 0,
            'current_streak' => 0,
            'achievements' => 0,
        ];

        $stmt = $this->db->prepare('SELECT COUNT(*) FROM dreams WHERE user_id = ?');
        $stmt->execute([$userId]);
        $stats['total_dreams'] = (int) $stmt->fetchColumn();

        $stmt = $this->db->prepare('SELECT COUNT(*) FROM goals WHERE user_id = ? AND status = ?');
        $stmt->execute([$userId, 'active']);
        $stats['active_goals'] = (int) $stmt->fetchColumn();

        try {
            $stmt = $this->db->prepare('SELECT current_streak FROM streaks WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $stats['current_streak'] = (int) ($stmt->fetchColumn() ?: 0);
        } catch (PDOException) {
            $stats['current_streak'] = 0;
        }

        try {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM user_achievements WHERE user_id = ?');
            $stmt->execute([$userId]);
            $stats['achievements'] = (int) $stmt->fetchColumn();
        } catch (PDOException) {
            $stats['achievements'] = 0;
        }

        return $stats;
    }
}
