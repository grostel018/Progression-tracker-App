<?php

namespace src\api\history;

use InvalidArgumentException;
use src\lib\Auth;
use src\lib\Database;

class HistoryController
{
    private Auth $auth;
    private HistoryService $service;

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->service = new HistoryService();
    }

    public function overview(array $query): array
    {
        $this->auth->requireAuth();

        $scope = strtolower((string) ($query['scope'] ?? 'dashboard'));
        $range = (string) ($query['range'] ?? ($scope === 'dashboard' ? 'year' : '30d'));
        $entityId = isset($query['id']) ? (int) $query['id'] : 0;

        try {
            return match ($scope) {
                'dashboard' => $this->service->getDashboardOverview($this->auth->id(), $range),
                'goal', 'dream' => $this->service->getEntityOverview($this->auth->id(), $scope, $entityId, $range),
                default => ['success' => false, 'message' => 'Unsupported history scope.'],
            };
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }

    public function day(array $query): array
    {
        $this->auth->requireAuth();

        $scope = strtolower((string) ($query['scope'] ?? 'dashboard'));
        $entityType = in_array($scope, ['goal', 'dream'], true) ? $scope : null;
        $entityId = $entityType !== null ? (int) ($query['id'] ?? 0) : null;
        $date = (string) ($query['date'] ?? 'now');

        try {
            return $this->service->getDayDetails($this->auth->id(), $date, $entityType, $entityId);
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }

    public function create(array $input): array
    {
        $this->auth->requireAuth();

        try {
            return $this->service->createManualEntry($this->auth->id(), $input);
        } catch (InvalidArgumentException $exception) {
            return ['success' => false, 'message' => $exception->getMessage()];
        }
    }
}
