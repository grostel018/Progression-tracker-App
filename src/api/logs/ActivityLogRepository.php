<?php

namespace src\api\logs;

use src\lib\Auth;
use src\lib\Database;

/**
 * User Activity Log Repository
 * Handles database operations for user activity logs
 */
class ActivityLogRepository
{
    private \PDO $db;

    public function __construct(?\PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Get activity logs for a user
     */
    public function getByUser(int $userId, array $filters = []): array
    {
        try {
            $query = 'SELECT * FROM activity_logs WHERE user_id = ?';
            $params = [$userId];

            if (!empty($filters['action'])) {
                $query .= ' AND action = ?';
                $params[] = $filters['action'];
            }

            if (!empty($filters['start_date'])) {
                $query .= ' AND created_at >= ?';
                $params[] = $filters['start_date'];
            }

            $query .= ' ORDER BY created_at DESC LIMIT 100';

            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (\PDOException) {
            return [];
        }
    }

    /**
     * Create activity log
     */
    public function create(array $data): int
    {
        try {
            $stmt = $this->db->prepare(
                'INSERT INTO activity_logs (user_id, action, target_type, target_id, details)
                 VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $data['user_id'],
                $data['action'],
                $data['target_type'] ?? null,
                $data['target_id'] ?? null,
                $data['details'] ?? null,
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException) {
            return 0;
        }
    }

    /**
     * Track login activity
     */
    public function trackLogin(int $userId): int
    {
        return $this->create([
            'user_id' => $userId,
            'action' => 'login',
            'target_type' => 'user',
            'target_id' => $userId,
            'details' => json_encode(['ip' => $_SERVER['REMOTE_ADDR'] ?? null]),
        ]);
    }

    /**
     * Track goal progress update
     */
    public function trackGoalProgress(int $userId, int $goalId, int $percent): int
    {
        return $this->create([
            'user_id' => $userId,
            'action' => 'goal_update',
            'target_type' => 'goal',
            'target_id' => $goalId,
            'details' => json_encode(['progress' => $percent]),
        ]);
    }

    /**
     * Track dream creation
     */
    public function trackDreamCreated(int $userId, int $dreamId): int
    {
        return $this->create([
            'user_id' => $userId,
            'action' => 'dream_create',
            'target_type' => 'dream',
            'target_id' => $dreamId,
            'details' => json_encode([]),
        ]);
    }
}
