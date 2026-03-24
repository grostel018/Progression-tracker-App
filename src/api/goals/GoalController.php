<?php

namespace src\api\goals;

use src\api\logs\ActivityLogRepository;
use src\lib\Auth;
use src\lib\Database;

/**
 * Goal Controller
 * Handles goal-related API requests
 */
class GoalController
{
    private Auth $auth;
    private GoalRepository $repository;
    private ActivityLogRepository $activityLogRepository;

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->repository = new GoalRepository();
        $this->activityLogRepository = new ActivityLogRepository();
    }

    /**
     * Get all goals
     */
    public function index(): array
    {
        $this->auth->requireAuth();
        return $this->repository->getByUser($this->auth->id());
    }

    /**
     * Get single goal
     */
    public function show(int $id): ?array
    {
        $this->auth->requireAuth();
        return $this->repository->getById($id, $this->auth->id());
    }

    /**
     * Create goal
     */
    public function store(array $data): array
    {
        $this->auth->requireAuth();

        $required = ['dream_id', 'title', 'goal_type', 'start_date'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'message' => "Missing required field: $field"];
            }
        }

        $data['user_id'] = $this->auth->id();

        try {
            $id = $this->repository->create($data);
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'goal_create',
                'target_type' => 'goal',
                'target_id' => $id,
                'details' => json_encode([
                    'title' => $data['title'],
                    'dream_id' => (int) $data['dream_id'],
                    'goal_type' => $data['goal_type'],
                ]),
            ]);
            return ['success' => true, 'id' => $id, 'message' => 'Goal created'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to create goal'];
        }
    }

    /**
     * Update goal
     */
    public function update(int $id, array $data): array
    {
        $this->auth->requireAuth();

        $goal = $this->repository->getById($id, $this->auth->id());

        if (!$goal) {
            return ['success' => false, 'message' => 'Goal not found'];
        }

        if ($this->repository->update($id, $this->auth->id(), $data)) {
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'goal_update',
                'target_type' => 'goal',
                'target_id' => $id,
                'details' => json_encode([
                    'previous_title' => $goal['title'] ?? null,
                    'title' => $data['title'] ?? ($goal['title'] ?? null),
                    'status' => $data['status'] ?? ($goal['status'] ?? null),
                ]),
            ]);
            return ['success' => true, 'message' => 'Goal updated'];
        }

        return ['success' => false, 'message' => 'Failed to update goal'];
    }

    /**
     * Delete goal
     */
    public function delete(int $id): array
    {
        $this->auth->requireAuth();

        $goal = $this->repository->getById($id, $this->auth->id());

        if (!$goal) {
            return ['success' => false, 'message' => 'Goal not found'];
        }

        if ($this->repository->delete($id, $this->auth->id())) {
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'goal_delete',
                'target_type' => 'goal',
                'target_id' => $id,
                'details' => json_encode(['title' => $goal['title'] ?? null]),
            ]);
            return ['success' => true, 'message' => 'Goal deleted'];
        }

        return ['success' => false, 'message' => 'Failed to delete goal'];
    }
}
