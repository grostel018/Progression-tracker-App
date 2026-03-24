<?php

namespace src\api\goals;

use PDO;
use src\lib\Database;

/**
 * Goal Repository
 * Handles database operations for goals
 */
class GoalRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get all goals for a user
     */
    public function getByUser(int $userId, array $filters = []): array
    {
        $query = 'SELECT
                    g.*,
                    d.title as dream_title,
                    d.status as dream_status,
                    (
                        SELECT COUNT(*)
                        FROM history_entries he
                        WHERE he.entity_type = \'goal\'
                          AND he.entity_id = g.id
                    ) as log_count,
                    (
                        SELECT COUNT(*)
                        FROM goal_tasks gt
                        WHERE gt.goal_id = g.id
                    ) as task_count,
                    (
                        SELECT COUNT(*)
                        FROM goal_tasks gt_completed
                        WHERE gt_completed.goal_id = g.id
                          AND gt_completed.is_completed = 1
                    ) as completed_task_count,
                    (
                        SELECT COUNT(*)
                        FROM goal_habits gh
                        WHERE gh.goal_id = g.id
                    ) as habit_count
                  FROM goals g
                  JOIN dreams d ON g.dream_id = d.id
                  WHERE g.user_id = ?';

        $params = [$userId];

        if (!empty($filters['status'])) {
            $query .= ' AND g.status = ?';
            $params[] = $filters['status'];
        }

        if (!empty($filters['type'])) {
            $query .= ' AND g.goal_type = ?';
            $params[] = $filters['type'];
        }

        $query .= ' ORDER BY g.created_at DESC';

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Get goal by ID
     */
    public function getById(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT g.*,
                    d.title as dream_title,
                    d.status as dream_status,
                    (
                        SELECT COUNT(*)
                        FROM history_entries he
                        WHERE he.entity_type = \'goal\'
                          AND he.entity_id = g.id
                    ) as log_count
             FROM goals g
             JOIN dreams d ON g.dream_id = d.id
             WHERE g.id = ? AND g.user_id = ?'
        );
        $stmt->execute([$id, $userId]);
        return $stmt->fetch();
    }

    /**
     * Create new goal
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO goals (user_id, dream_id, title, description, goal_type, start_date, estimated_finish_date, current_progress_percent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['user_id'],
            $data['dream_id'],
            $data['title'],
            $data['description'] ?? null,
            $data['goal_type'],
            $data['start_date'],
            $data['estimated_finish_date'] ?? null,
            (int) ($data['current_progress_percent'] ?? 0),
        ]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Update goal
     */
    public function update(int $id, int $userId, array $data): bool
    {
        $fields = [];
        $params = [];

        foreach (['dream_id', 'title', 'description', 'goal_type', 'start_date', 'estimated_finish_date', 'current_progress_percent', 'status'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $params[] = $userId;

        $stmt = $this->db->prepare("UPDATE goals SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
        return $stmt->execute($params);
    }

    /**
     * Delete goal
     */
    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM goals WHERE id = ? AND user_id = ?');
        return $stmt->execute([$id, $userId]);
    }

    /**
     * Get goals with progress statistics
     */
    public function getWithStats(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                g.id, g.title, g.goal_type, g.status, g.current_progress_percent,
                COUNT(DISTINCT he.id) as log_count,
                COALESCE(AVG(ps.progress_percent), 0) as avg_progress
             FROM goals g
             LEFT JOIN history_entries he ON he.entity_type = \'goal\' AND he.entity_id = g.id
             LEFT JOIN progress_snapshots ps ON ps.entity_type = \'goal\' AND ps.entity_id = g.id
             WHERE g.user_id = ?
             GROUP BY g.id
             ORDER BY g.created_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function updateCurrentProgress(int $id, int $userId, int $progressPercent): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE goals
             SET current_progress_percent = ?
             WHERE id = ? AND user_id = ?'
        );

        return $stmt->execute([$progressPercent, $id, $userId]);
    }
}
