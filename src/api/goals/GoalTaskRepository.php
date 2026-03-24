<?php

namespace src\api\goals;

use PDO;
use src\lib\Database;

class GoalTaskRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function listByGoal(int $userId, int $goalId): array
    {
        $stmt = $this->db->prepare(
            'SELECT gt.*
             FROM goal_tasks gt
             JOIN goals g ON g.id = gt.goal_id
             WHERE gt.goal_id = ? AND gt.user_id = ? AND g.user_id = ?
             ORDER BY gt.sort_order ASC, gt.created_at ASC'
        );
        $stmt->execute([$goalId, $userId, $userId]);
        return $stmt->fetchAll();
    }

    public function getOwnedTask(int $userId, int $taskId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT gt.*
             FROM goal_tasks gt
             JOIN goals g ON g.id = gt.goal_id
             WHERE gt.id = ? AND gt.user_id = ? AND g.user_id = ?'
        );
        $stmt->execute([$taskId, $userId, $userId]);
        return $stmt->fetch() ?: null;
    }

    public function create(int $userId, int $goalId, array $data): int
    {
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        if ($sortOrder <= 0) {
            $sortOrder = $this->nextSortOrder($goalId);
        }

        $stmt = $this->db->prepare(
            'INSERT INTO goal_tasks (user_id, goal_id, title, description, sort_order)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $goalId,
            $data['title'],
            $data['description'] ?? null,
            $sortOrder,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $userId, int $taskId, array $data): bool
    {
        $task = $this->getOwnedTask($userId, $taskId);
        if (!$task) {
            return false;
        }

        $stmt = $this->db->prepare(
            'UPDATE goal_tasks
             SET title = ?, description = ?, sort_order = ?
             WHERE id = ? AND user_id = ?'
        );

        return $stmt->execute([
            $data['title'] ?? $task['title'],
            array_key_exists('description', $data) ? $data['description'] : $task['description'],
            (int) ($data['sort_order'] ?? $task['sort_order']),
            $taskId,
            $userId,
        ]);
    }

    public function setCompletionState(int $userId, int $taskId, bool $completed): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE goal_tasks
             SET is_completed = ?, completed_at = ?
             WHERE id = ? AND user_id = ?'
        );

        return $stmt->execute([
            $completed ? 1 : 0,
            $completed ? date('Y-m-d H:i:s') : null,
            $taskId,
            $userId,
        ]);
    }

    public function delete(int $userId, int $taskId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM goal_tasks WHERE id = ? AND user_id = ?');
        return $stmt->execute([$taskId, $userId]);
    }

    private function nextSortOrder(int $goalId): int
    {
        $stmt = $this->db->prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM goal_tasks WHERE goal_id = ?');
        $stmt->execute([$goalId]);
        return (int) $stmt->fetchColumn();
    }
}
