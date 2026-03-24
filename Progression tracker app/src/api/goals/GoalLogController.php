<?php

namespace src\api\goals;

use src\lib\Auth;
use src\lib\Database;

/**
 * Goal Log Controller
 * Handles progress logging for goals
 */
class GoalLogController
{
    private Auth $auth;
    private GoalRepository $goalRepo;

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->goalRepo = new GoalRepository();
    }

    /**
     * Get logs for a goal
     */
    public function index(int $goalId): array
    {
        $this->auth->requireAuth();

        // Verify goal belongs to user
        $goal = $this->goalRepo->getById($goalId, $this->auth->id());
        if (!$goal) {
            return [];
        }

        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM goal_logs WHERE goal_id = ? ORDER BY log_date DESC'
        );
        $stmt->execute([$goalId]);
        return $stmt->fetchAll();
    }

    /**
     * Create log entry
     */
    public function store(int $goalId, array $data): array
    {
        $this->auth->requireAuth();

        // Verify goal belongs to user
        $goal = $this->goalRepo->getById($goalId, $this->auth->id());
        if (!$goal) {
            return ['success' => false, 'message' => 'Goal not found'];
        }

        $stmt = Database::getConnection()->prepare(
            'INSERT INTO goal_logs (goal_id, log_date, progress_percent, note) VALUES (?, ?, ?, ?)'
        );

        try {
            $stmt->execute([
                $goalId,
                $data['log_date'] ?? date('Y-m-d'),
                $data['progress_percent'] ?? 0,
                $data['note'] ?? null,
            ]);
            return ['success' => true, 'message' => 'Progress logged'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to log progress'];
        }
    }

    /**
     * Update log entry
     */
    public function update(int $logId, int $goalId, array $data): array
    {
        $this->auth->requireAuth();

        // Verify ownership
        $stmt = Database::getConnection()->prepare(
            'UPDATE goal_logs
             SET progress_percent = ?, note = ?
             WHERE id = ? AND goal_id = ? AND
                   (SELECT user_id FROM goals WHERE id = ?) = ?'
        );

        try {
            $stmt->execute([
                $data['progress_percent'] ?? 0,
                $data['note'] ?? null,
                $logId,
                $goalId,
                $goalId,
                $this->auth->id(),
            ]);
            return ['success' => true, 'message' => 'Log updated'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to update log'];
        }
    }

    /**
     * Delete log entry
     */
    public function delete(int $logId, int $goalId): array
    {
        $this->auth->requireAuth();

        $stmt = Database::getConnection()->prepare(
            'DELETE FROM goal_logs
             WHERE id = ? AND goal_id = ? AND
                   (SELECT user_id FROM goals WHERE id = ?) = ?'
        );

        try {
            $stmt->execute([$logId, $goalId, $goalId, $this->auth->id()]);
            return ['success' => true, 'message' => 'Log deleted'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to delete log'];
        }
    }
}
