<?php

namespace src\api\goals;

use InvalidArgumentException;
use src\lib\Auth;
use src\lib\Database;

class GoalHabitController
{
    private Auth $auth;
    private GoalTrackingService $service;

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->service = new GoalTrackingService();
    }

    public function index(int $goalId): array
    {
        $this->auth->requireAuth();

        try {
            return $this->service->listHabits($this->auth->id(), $goalId);
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }

    public function store(int $goalId, array $input): array
    {
        $this->auth->requireAuth();

        try {
            return $this->service->createHabit($this->auth->id(), $goalId, $input);
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }

    public function update(int $habitId, array $input): array
    {
        $this->auth->requireAuth();
        return $this->service->updateHabit($this->auth->id(), $habitId, $input);
    }

    public function delete(int $habitId): array
    {
        $this->auth->requireAuth();
        return $this->service->deleteHabit($this->auth->id(), $habitId);
    }
}
