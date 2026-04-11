<?php

namespace src\api\goals;

use DateTimeImmutable;
use InvalidArgumentException;
use Throwable;
use src\api\history\HistoryRepository;

class GoalTrackingService
{
    private GoalRepository $goalRepository;
    private GoalTaskRepository $taskRepository;
    private GoalHabitRepository $habitRepository;
    private HistoryRepository $historyRepository;

    public function __construct(
        ?GoalRepository $goalRepository = null,
        ?GoalTaskRepository $taskRepository = null,
        ?GoalHabitRepository $habitRepository = null,
        ?HistoryRepository $historyRepository = null
    )
    {
        $this->goalRepository = $goalRepository ?? new GoalRepository();
        $this->taskRepository = $taskRepository ?? new GoalTaskRepository();
        $this->habitRepository = $habitRepository ?? new GoalHabitRepository();
        $this->historyRepository = $historyRepository ?? new HistoryRepository();
    }

    public function listTasks(int $userId, int $goalId): array
    {
        $this->requireGoal($userId, $goalId);

        return array_map(static function (array $task): array {
            $task['id'] = (int) $task['id'];
            $task['goal_id'] = (int) $task['goal_id'];
            $task['sort_order'] = (int) $task['sort_order'];
            $task['is_completed'] = (bool) $task['is_completed'];
            return $task;
        }, $this->taskRepository->listByGoal($userId, $goalId));
    }

    public function createTask(int $userId, int $goalId, array $data): array
    {
        $this->requireGoal($userId, $goalId);
        $title = trim((string) ($data['title'] ?? ''));

        if ($title === '') {
            return ['success' => false, 'message' => 'Task title is required.'];
        }

        $taskId = $this->taskRepository->create($userId, $goalId, [
            'title' => $title,
            'description' => trim((string) ($data['description'] ?? '')) ?: null,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return [
            'success' => true,
            'message' => 'Task added.',
            'task' => $this->taskRepository->getOwnedTask($userId, $taskId),
        ];
    }

    public function updateTask(int $userId, int $taskId, array $data): array
    {
        $task = $this->taskRepository->getOwnedTask($userId, $taskId);
        if (!$task) {
            return ['success' => false, 'message' => 'Task not found.'];
        }

        $title = trim((string) ($data['title'] ?? $task['title']));
        if ($title === '') {
            return ['success' => false, 'message' => 'Task title is required.'];
        }

        $this->taskRepository->update($userId, $taskId, [
            'title' => $title,
            'description' => array_key_exists('description', $data) ? trim((string) $data['description']) : $task['description'],
            'sort_order' => (int) ($data['sort_order'] ?? $task['sort_order']),
        ]);

        return [
            'success' => true,
            'message' => 'Task updated.',
            'task' => $this->taskRepository->getOwnedTask($userId, $taskId),
        ];
    }

    public function toggleTaskCompletion(int $userId, int $taskId, bool $completed, ?string $completedOn = null): array
    {
        $task = $this->taskRepository->getOwnedTask($userId, $taskId);
        if (!$task) {
            return ['success' => false, 'message' => 'Task not found.'];
        }

        try {
            $this->historyRepository->beginTransaction();
            $this->taskRepository->setCompletionState($userId, $taskId, $completed);

            if ($completed) {
                $entryDate = $this->normalizeDate($completedOn ?? 'now');
                $this->historyRepository->createHistoryEntry([
                    'user_id' => $userId,
                    'entity_type' => 'goal',
                    'entity_id' => (int) $task['goal_id'],
                    'entry_type' => 'task_completion',
                    'title' => $task['title'],
                    'content' => $task['description'] ?? null,
                    'entry_date' => $entryDate,
                    'related_type' => 'goal_task',
                    'related_id' => $taskId,
                ]);
            }

            $this->historyRepository->commit();
        } catch (Throwable) {
            $this->historyRepository->rollBack();
            return ['success' => false, 'message' => 'Failed to update task status.'];
        }

        return [
            'success' => true,
            'message' => $completed ? 'Task completed.' : 'Task reopened.',
            'task' => $this->taskRepository->getOwnedTask($userId, $taskId),
        ];
    }

    public function deleteTask(int $userId, int $taskId): array
    {
        $task = $this->taskRepository->getOwnedTask($userId, $taskId);
        if (!$task) {
            return ['success' => false, 'message' => 'Task not found.'];
        }

        $this->taskRepository->delete($userId, $taskId);
        return ['success' => true, 'message' => 'Task deleted.'];
    }

    public function listHabits(int $userId, int $goalId): array
    {
        $this->requireGoal($userId, $goalId);
        $todayDate = $this->normalizeDate('now');

        return array_map(static function (array $habit): array {
            $habit['id'] = (int) $habit['id'];
            $habit['goal_id'] = (int) $habit['goal_id'];
            $habit['sort_order'] = (int) $habit['sort_order'];
            $habit['today_actions'] = (int) $habit['today_actions'];
            $habit['total_actions'] = (int) $habit['total_actions'];
            return $habit;
        }, $this->habitRepository->listByGoal($userId, $goalId, $todayDate));
    }

    public function createHabit(int $userId, int $goalId, array $data): array
    {
        $this->requireGoal($userId, $goalId);
        $title = trim((string) ($data['title'] ?? ''));

        if ($title === '') {
            return ['success' => false, 'message' => 'Habit title is required.'];
        }

        $habitId = $this->habitRepository->create($userId, $goalId, [
            'title' => $title,
            'description' => trim((string) ($data['description'] ?? '')) ?: null,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return [
            'success' => true,
            'message' => 'Habit added.',
            'habit' => $this->habitRepository->getOwnedHabit($userId, $habitId),
        ];
    }

    public function updateHabit(int $userId, int $habitId, array $data): array
    {
        $habit = $this->habitRepository->getOwnedHabit($userId, $habitId);
        if (!$habit) {
            return ['success' => false, 'message' => 'Habit not found.'];
        }

        $title = trim((string) ($data['title'] ?? $habit['title']));
        if ($title === '') {
            return ['success' => false, 'message' => 'Habit title is required.'];
        }

        $this->habitRepository->update($userId, $habitId, [
            'title' => $title,
            'description' => array_key_exists('description', $data) ? trim((string) $data['description']) : $habit['description'],
            'sort_order' => (int) ($data['sort_order'] ?? $habit['sort_order']),
        ]);

        return [
            'success' => true,
            'message' => 'Habit updated.',
            'habit' => $this->habitRepository->getOwnedHabit($userId, $habitId),
        ];
    }

    public function recordHabitAction(int $userId, int $habitId, array $data): array
    {
        $habit = $this->habitRepository->getOwnedHabit($userId, $habitId);
        if (!$habit) {
            return ['success' => false, 'message' => 'Habit not found.'];
        }

        $loggedOn = $this->normalizeDate($data['logged_on'] ?? 'now');
        $note = trim((string) ($data['note'] ?? '')) ?: null;

        try {
            $this->historyRepository->beginTransaction();

            $historyEntryId = $this->historyRepository->createHistoryEntry([
                'user_id' => $userId,
                'entity_type' => 'goal',
                'entity_id' => (int) $habit['goal_id'],
                'entry_type' => 'habit_action',
                'title' => $habit['title'],
                'content' => $note,
                'entry_date' => $loggedOn,
                'related_type' => 'goal_habit',
                'related_id' => $habitId,
            ]);

            $this->habitRepository->createHabitLog($userId, $habitId, $historyEntryId, $loggedOn, $note);
            $this->historyRepository->commit();
        } catch (Throwable) {
            $this->historyRepository->rollBack();
            return ['success' => false, 'message' => 'Failed to record habit action.'];
        }

        return [
            'success' => true,
            'message' => 'Habit action recorded.',
        ];
    }

    public function deleteHabit(int $userId, int $habitId): array
    {
        $habit = $this->habitRepository->getOwnedHabit($userId, $habitId);
        if (!$habit) {
            return ['success' => false, 'message' => 'Habit not found.'];
        }

        $this->habitRepository->delete($userId, $habitId);
        return ['success' => true, 'message' => 'Habit deleted.'];
    }

    private function requireGoal(int $userId, int $goalId): array
    {
        $goal = $this->goalRepository->getById($goalId, $userId);
        if (!$goal) {
            throw new InvalidArgumentException('Goal not found.');
        }

        return $goal;
    }

    private function normalizeDate(string $date): string
    {
        return (new DateTimeImmutable($date))->format('Y-m-d');
    }
}
