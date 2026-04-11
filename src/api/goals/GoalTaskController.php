<?php

namespace src\api\goals;

use InvalidArgumentException;
use src\lib\Auth;
use src\lib\Database;

class GoalTaskController
{
    private Auth $auth;
    private GoalTrackingService $service;

    public function __construct(?Auth $auth = null, ?GoalTrackingService $service = null)
    {
        $this->auth = $auth ?? new Auth(Database::getConnection(), config('app'));
        $this->service = $service ?? new GoalTrackingService();
    }

    public function index(int $goalId): array
    {
        $this->auth->requireAuth();

        try {
            return $this->service->listTasks($this->auth->id(), $goalId);
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }

    public function store(int $goalId, array $input): array
    {
        $this->auth->requireAuth();

        try {
            return $this->service->createTask($this->auth->id(), $goalId, $input);
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }

    public function update(int $taskId, array $input): array
    {
        $this->auth->requireAuth();

        try {
            if (array_key_exists('is_completed', $input)) {
                return $this->service->toggleTaskCompletion(
                    $this->auth->id(),
                    $taskId,
                    (bool) $input['is_completed'],
                    $input['completed_on'] ?? null
                );
            }

            return $this->service->updateTask($this->auth->id(), $taskId, $input);
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }

    public function delete(int $taskId): array
    {
        $this->auth->requireAuth();
        return $this->service->deleteTask($this->auth->id(), $taskId);
    }
}
