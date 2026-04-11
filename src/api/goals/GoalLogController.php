<?php

namespace src\api\goals;

use src\api\history\HistoryRepository;
use src\api\history\HistoryService;
use src\lib\Auth;
use src\lib\Database;

class GoalLogController
{
    private Auth $auth;
    private GoalRepository $goalRepository;
    private HistoryRepository $historyRepository;
    private HistoryService $historyService;

    public function __construct(
        ?Auth $auth = null,
        ?GoalRepository $goalRepository = null,
        ?HistoryRepository $historyRepository = null,
        ?HistoryService $historyService = null
    )
    {
        $this->auth = $auth ?? new Auth(Database::getConnection(), config('app'));
        $this->goalRepository = $goalRepository ?? new GoalRepository();
        $this->historyRepository = $historyRepository ?? new HistoryRepository();
        $this->historyService = $historyService ?? new HistoryService();
    }

    public function index(int $goalId): array
    {
        $this->auth->requireAuth();

        if (!$this->goalRepository->getById($goalId, $this->auth->id())) {
            return [];
        }

        return $this->historyRepository->getRecentEntries($this->auth->id(), 50, 'goal', $goalId);
    }

    public function store(int $goalId, array $data): array
    {
        $this->auth->requireAuth();

        if (!$this->goalRepository->getById($goalId, $this->auth->id())) {
            return ['success' => false, 'message' => 'Goal not found'];
        }

        return $this->historyService->createManualEntry($this->auth->id(), [
            'entity_type' => 'goal',
            'entity_id' => $goalId,
            'entry_date' => $data['log_date'] ?? date('Y-m-d'),
            'note' => $data['note'] ?? '',
            'progress_percent' => $data['progress_percent'] ?? null,
        ]);
    }

    public function update(int $logId, int $goalId, array $data): array
    {
        return [
            'success' => false,
            'message' => 'Direct goal log updates are no longer supported. Create a new history entry instead.',
        ];
    }

    public function delete(int $logId, int $goalId): array
    {
        return [
            'success' => false,
            'message' => 'Direct goal log deletes are no longer supported.',
        ];
    }
}
