<?php

namespace src\api\goals;

use InvalidArgumentException;
use src\lib\Auth;
use src\lib\Database;

class GoalHabitLogController
{
    private Auth $auth;
    private GoalTrackingService $service;

    public function __construct(?Auth $auth = null, ?GoalTrackingService $service = null)
    {
        $this->auth = $auth ?? new Auth(Database::getConnection(), config('app'));
        $this->service = $service ?? new GoalTrackingService();
    }

    public function store(int $habitId, array $input): array
    {
        $this->auth->requireAuth();

        try {
            return $this->service->recordHabitAction($this->auth->id(), $habitId, $input);
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }
}
