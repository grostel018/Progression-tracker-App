<?php

namespace src\api\goals;

use PDO;
use src\lib\Database;

class GoalHabitRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function listByGoal(int $userId, int $goalId, string $todayDate): array
    {
        $stmt = $this->db->prepare(
            'SELECT gh.*, 
                    (
                        SELECT COUNT(*)
                        FROM goal_habit_logs ghl_today
                        WHERE ghl_today.habit_id = gh.id
                            AND ghl_today.user_id = gh.user_id
                            AND ghl_today.logged_on = ?
                    ) AS today_actions,
                    (
                        SELECT COUNT(*)
                        FROM goal_habit_logs ghl_total
                        WHERE ghl_total.habit_id = gh.id
                            AND ghl_total.user_id = gh.user_id
                    ) AS total_actions
             FROM goal_habits gh
             JOIN goals g ON g.id = gh.goal_id
             WHERE gh.goal_id = ? AND gh.user_id = ? AND g.user_id = ?
             ORDER BY gh.sort_order ASC, gh.created_at ASC'
        );
        $stmt->execute([$todayDate, $goalId, $userId, $userId]);
        return $stmt->fetchAll();
    }

    public function getOwnedHabit(int $userId, int $habitId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT gh.*
             FROM goal_habits gh
             JOIN goals g ON g.id = gh.goal_id
             WHERE gh.id = ? AND gh.user_id = ? AND g.user_id = ?'
        );
        $stmt->execute([$habitId, $userId, $userId]);
        return $stmt->fetch() ?: null;
    }

    public function create(int $userId, int $goalId, array $data): int
    {
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        if ($sortOrder <= 0) {
            $sortOrder = $this->nextSortOrder($goalId);
        }

        $stmt = $this->db->prepare(
            'INSERT INTO goal_habits (user_id, goal_id, title, description, sort_order)
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

    public function update(int $userId, int $habitId, array $data): bool
    {
        $habit = $this->getOwnedHabit($userId, $habitId);
        if (!$habit) {
            return false;
        }

        $stmt = $this->db->prepare(
            'UPDATE goal_habits
             SET title = ?, description = ?, sort_order = ?
             WHERE id = ? AND user_id = ?'
        );

        return $stmt->execute([
            $data['title'] ?? $habit['title'],
            array_key_exists('description', $data) ? $data['description'] : $habit['description'],
            (int) ($data['sort_order'] ?? $habit['sort_order']),
            $habitId,
            $userId,
        ]);
    }

    public function createHabitLog(int $userId, int $habitId, ?int $historyEntryId, string $loggedOn, ?string $note): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO goal_habit_logs (user_id, habit_id, history_entry_id, logged_on, note)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $habitId, $historyEntryId, $loggedOn, $note]);
        return (int) $this->db->lastInsertId();
    }

    public function delete(int $userId, int $habitId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM goal_habits WHERE id = ? AND user_id = ?');
        return $stmt->execute([$habitId, $userId]);
    }

    private function nextSortOrder(int $goalId): int
    {
        $stmt = $this->db->prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM goal_habits WHERE goal_id = ?');
        $stmt->execute([$goalId]);
        return (int) $stmt->fetchColumn();
    }
}
