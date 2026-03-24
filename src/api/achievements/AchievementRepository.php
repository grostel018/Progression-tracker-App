<?php

namespace src\api\achievements;

use PDO;
use PDOException;
use src\lib\Database;

class AchievementRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getByUser(int $userId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT a.id, a.name, a.description, ua.earned_at
                 FROM user_achievements ua
                 JOIN achievements a ON a.id = ua.achievement_id
                 WHERE ua.user_id = ?
                 ORDER BY ua.earned_at DESC'
            );
            $stmt->execute([$userId]);
            return $stmt->fetchAll();
        } catch (PDOException) {
            return [];
        }
    }
}
