<?php

namespace src\api\goals;

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

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->repository = new GoalRepository();
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

        if (!$this->repository->getById($id, $this->auth->id())) {
            return ['success' => false, 'message' => 'Goal not found'];
        }

        if ($this->repository->update($id, $this->auth->id(), $data)) {
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

        if (!$this->repository->getById($id, $this->auth->id())) {
            return ['success' => false, 'message' => 'Goal not found'];
        }

        if ($this->repository->delete($id, $this->auth->id())) {
            return ['success' => true, 'message' => 'Goal deleted'];
        }

        return ['success' => false, 'message' => 'Failed to delete goal'];
    }
}
