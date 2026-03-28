<?php

namespace src\api\dreams;

use src\lib\Auth;
use src\lib\Database;

/**
 * Dream Repository
 * Handles database operations for dreams
 */
class DreamRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get all dreams for a user
     */
    public function getByUser(int $userId, array $filters = []): array
    {
        $query = 'SELECT
                    d.*,
                    (
                        SELECT COUNT(*)
                        FROM history_entries he
                        WHERE he.entity_type = \'dream\'
                          AND he.entity_id = d.id
                          AND he.user_id = d.user_id
                    ) as log_count
                  FROM dreams d
                  WHERE d.user_id = ?';
        $params = [$userId];

        if (!empty($filters['status'])) {
            $query .= ' AND d.status = ?';
            $params[] = $filters['status'];
        }

        if (!empty($filters['category_id'])) {
            $query .= ' AND d.category_id = ?';
            $params[] = $filters['category_id'];
        }

        $query .= ' ORDER BY d.start_date DESC';

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Get dream by ID
     */
    public function getById(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT d.*,
                    (
                        SELECT COUNT(*)
                        FROM history_entries he
                        WHERE he.entity_type = \'dream\'
                          AND he.entity_id = d.id
                          AND he.user_id = d.user_id
                    ) as log_count
             FROM dreams d
             WHERE d.id = ? AND d.user_id = ?'
        );
        $stmt->execute([$id, $userId]);
        return $stmt->fetch();
    }

    public function isOwnedByUser(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM dreams WHERE id = ? AND user_id = ? LIMIT 1');
        $stmt->execute([$id, $userId]);
        return (bool) $stmt->fetchColumn();
    }

    /**
     * Create new dream
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO dreams (user_id, category_id, title, description, start_date, estimated_finish_date, current_progress_percent, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['user_id'],
            $data['category_id'],
            $data['title'],
            $data['description'] ?? null,
            $data['start_date'] ?? date('Y-m-d'),
            $data['estimated_finish_date'] ?? null,
            (int) ($data['current_progress_percent'] ?? 0),
            $data['status'] ?? 'active',
        ]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Update dream
     */
    public function update(int $id, int $userId, array $data): bool
    {
        $fields = [];
        $params = [];

        foreach (['category_id', 'title', 'description', 'start_date', 'estimated_finish_date', 'current_progress_percent', 'status'] as $field) {
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

        $stmt = $this->db->prepare("UPDATE dreams SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?");
        return $stmt->execute($params);
    }

    /**
     * Delete dream
     */
    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM dreams WHERE id = ? AND user_id = ?');
        return $stmt->execute([$id, $userId]);
    }

    /**
     * Get dreams with goal counts
     */
    public function getWithStats(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                d.id, d.title, d.status, d.start_date, d.current_progress_percent,
                COUNT(g.id) as goal_count,
                SUM(CASE WHEN g.goal_reached = 1 THEN 1 ELSE 0 END) as goals_reached,
                COUNT(DISTINCT he.id) as log_count
             FROM dreams d
             LEFT JOIN goals g ON d.id = g.dream_id
             LEFT JOIN history_entries he ON he.entity_type = \'dream\' AND he.entity_id = d.id
             WHERE d.user_id = ?
             GROUP BY d.id
             ORDER BY d.start_date DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function updateCurrentProgress(int $id, int $userId, int $progressPercent): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE dreams
             SET current_progress_percent = ?
             WHERE id = ? AND user_id = ?'
        );

        return $stmt->execute([$progressPercent, $id, $userId]);
    }
}
