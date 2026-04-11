<?php

namespace src\api\history;

use DateInterval;
use DatePeriod;
use DateTimeImmutable;
use InvalidArgumentException;
use Throwable;

class HistoryService
{
    private HistoryRepository $historyRepository;
    private TrackableRepository $trackableRepository;

    public function __construct(
        ?HistoryRepository $historyRepository = null,
        ?TrackableRepository $trackableRepository = null
    )
    {
        $this->historyRepository = $historyRepository ?? new HistoryRepository();
        $this->trackableRepository = $trackableRepository ?? new TrackableRepository();
    }

    public function getDashboardOverview(int $userId, string $rangeKey): array
    {
        [$normalizedRangeKey, $range] = $this->resolveRange($rangeKey, true);

        return [
            'scope' => 'dashboard',
            'range_key' => $normalizedRangeKey,
            'range' => $range,
            'heatmap' => $this->buildHeatmap($userId, $range['start'], $range['end']),
            'progress' => $this->buildProgressSeries($userId, $range['start'], $range['end']),
            'breakdown' => [
                'goals' => $this->buildBreakdown($userId, 'goal', $range['start'], $range['end']),
                'dreams' => $this->buildBreakdown($userId, 'dream', $range['start'], $range['end']),
            ],
            'recent_entries' => $this->formatEntries($this->historyRepository->getRecentEntries($userId, 10)),
            'available_entities' => $this->buildAvailableEntities($userId),
        ];
    }

    public function getWeeklyReview(int $userId): array
    {
        [, $range] = $this->resolveRange('week', true);
        $heatmap = $this->buildHeatmap($userId, $range['start'], $range['end']);
        $progress = $this->buildProgressSeries($userId, $range['start'], $range['end']);
        $entryTypeCounts = $this->historyRepository->getEntryTypeCounts($userId, $range['start'], $range['end']);
        $entityActivity = $this->historyRepository->getEntityActivitySummary($userId, $range['start'], $range['end']);
        $availableEntities = $this->buildAvailableEntities($userId);

        $topEntities = array_slice(array_map(static function (array $entity): array {
            return [
                'entity_type' => (string) $entity['entity_type'],
                'entity_id' => (int) $entity['entity_id'],
                'title' => (string) ($entity['entity_title'] ?? 'Tracked item'),
                'status' => (string) ($entity['entity_status'] ?? 'active'),
                'current_progress_percent' => (int) ($entity['current_progress_percent'] ?? 0),
                'entry_count' => (int) ($entity['entry_count'] ?? 0),
                'last_entry_date' => $entity['last_entry_date'] ?? null,
            ];
        }, $entityActivity), 0, 5);

        $activeEntityKeys = [];
        foreach ($entityActivity as $entity) {
            $activeEntityKeys[$entity['entity_type'] . ':' . $entity['entity_id']] = true;
        }

        $staleEntities = [];
        foreach (['goal' => $availableEntities['goals'], 'dream' => $availableEntities['dreams']] as $entityType => $entities) {
            foreach ($entities as $entity) {
                $entityKey = $entityType . ':' . $entity['id'];
                $status = (string) ($entity['status'] ?? 'active');

                if (isset($activeEntityKeys[$entityKey]) || !in_array($status, ['active', 'paused'], true)) {
                    continue;
                }

                $staleEntities[] = [
                    'entity_type' => $entityType,
                    'entity_id' => (int) $entity['id'],
                    'title' => (string) $entity['title'],
                    'status' => $status,
                    'current_progress_percent' => (int) ($entity['current_progress_percent'] ?? 0),
                ];
            }
        }

        usort($staleEntities, static function (array $left, array $right): int {
            return [$right['current_progress_percent'], $left['title']]
                <=> [$left['current_progress_percent'], $right['title']];
        });

        $progressPoints = $progress['points'];
        $progressShift = 0;
        if (count($progressPoints) >= 2) {
            $progressShift = (int) end($progressPoints)['progress_percent'] - (int) $progressPoints[0]['progress_percent'];
            reset($progressPoints);
        }

        $busiestDay = null;
        foreach ($heatmap['cells'] as $cell) {
            if (($cell['count'] ?? 0) <= 0) {
                continue;
            }

            if ($busiestDay === null || $cell['count'] > $busiestDay['count']) {
                $busiestDay = [
                    'date' => $cell['date'],
                    'count' => (int) $cell['count'],
                ];
            }
        }

        return [
            'range' => $range,
            'summary' => [
                'active_days' => (int) $heatmap['active_days'],
                'total_entries' => (int) $heatmap['total_entries'],
                'task_completions' => (int) ($entryTypeCounts['task_completion'] ?? 0),
                'habit_actions' => (int) ($entryTypeCounts['habit_action'] ?? 0),
                'manual_logs' => (int) ($entryTypeCounts['manual_log'] ?? 0),
                'progress_points' => count($progressPoints),
                'progress_shift' => $progressShift,
                'active_item_count' => count($entityActivity),
                'busiest_day' => $busiestDay,
            ],
            'wins' => $topEntities,
            'stale_entities' => array_slice($staleEntities, 0, 5),
        ];
    }

    public function getEntityOverview(int $userId, string $entityType, int $entityId, string $rangeKey): array
    {
        [$normalizedRangeKey, $range] = $this->resolveRange($rangeKey, false);
        $entity = $this->requireEntity($userId, $entityType, $entityId);

        return [
            'scope' => $entityType,
            'entity' => [
                'id' => (int) $entity['id'],
                'entity_type' => $entityType,
                'title' => $entity['title'],
                'status' => $entity['status'],
                'current_progress_percent' => (int) $entity['current_progress_percent'],
            ],
            'range_key' => $normalizedRangeKey,
            'range' => $range,
            'heatmap' => $this->buildHeatmap($userId, $range['start'], $range['end'], $entityType, $entityId),
            'progress' => $this->buildProgressSeries($userId, $range['start'], $range['end'], $entityType, $entityId),
            'summary' => $this->historyRepository->getSummary($userId, $range['start'], $range['end'], $entityType, $entityId),
            'recent_entries' => $this->formatEntries($this->historyRepository->getRecentEntries($userId, 6, $entityType, $entityId)),
        ];
    }

    public function getDayDetails(int $userId, string $date, ?string $entityType = null, ?int $entityId = null): array
    {
        $entryDate = $this->normalizeDate($date);

        if ($entityType !== null) {
            $entity = $this->requireEntity($userId, $entityType, (int) $entityId);
        }

        return [
            'date' => $entryDate,
            'scope' => $entityType ?? 'dashboard',
            'entries' => $this->formatEntries($this->historyRepository->getDayEntries($userId, $entryDate, $entityType, $entityId)),
            'form_defaults' => [
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'available_entities' => $entityType === null ? $this->buildAvailableEntities($userId) : [],
                'entity_title' => $entityType !== null ? $entity['title'] : null,
            ],
        ];
    }

    public function createManualEntry(int $userId, array $data): array
    {
        $entityType = $this->normalizeEntityType($data['entity_type'] ?? '');
        $entityId = (int) ($data['entity_id'] ?? 0);
        $entryDate = $this->normalizeDate($data['entry_date'] ?? 'now');
        $note = trim((string) ($data['note'] ?? ''));
        $progressPercent = $this->normalizeOptionalProgress($data['progress_percent'] ?? null);

        if ($entityId <= 0) {
            return ['success' => false, 'message' => 'Select a valid goal or dream.'];
        }

        if ($note === '' && $progressPercent === null) {
            return ['success' => false, 'message' => 'Add a note or a progress update before saving the entry.'];
        }

        $this->requireEntity($userId, $entityType, $entityId);

        $entryTitle = $progressPercent !== null && $note === ''
            ? sprintf('Progress updated to %d%%', $progressPercent)
            : 'Manual log';

        try {
            $this->historyRepository->beginTransaction();

            $historyEntryId = $this->historyRepository->createHistoryEntry([
                'user_id' => $userId,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'entry_type' => 'manual_log',
                'title' => $entryTitle,
                'content' => $note !== '' ? $note : null,
                'entry_date' => $entryDate,
            ]);

            if ($progressPercent !== null) {
                $this->historyRepository->createProgressSnapshot([
                    'user_id' => $userId,
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'history_entry_id' => $historyEntryId,
                    'progress_percent' => $progressPercent,
                    'snapshot_date' => $entryDate,
                ]);
                $this->trackableRepository->updateCurrentProgress($userId, $entityType, $entityId, $progressPercent);
            }

            $this->historyRepository->commit();
        } catch (Throwable) {
            $this->historyRepository->rollBack();
            return ['success' => false, 'message' => 'Failed to save history entry.'];
        }

        return [
            'success' => true,
            'message' => 'History entry saved.',
        ];
    }

    private function buildHeatmap(int $userId, string $startDate, string $endDate, ?string $entityType = null, ?int $entityId = null): array
    {
        $counts = $this->historyRepository->getHeatmapCounts($userId, $startDate, $endDate, $entityType, $entityId);
        $summary = $this->historyRepository->getSummary($userId, $startDate, $endDate, $entityType, $entityId);
        $maxCount = 0;
        $cells = [];
        $today = (new DateTimeImmutable('now'))->format('Y-m-d');

        $period = new DatePeriod(
            new DateTimeImmutable($startDate),
            new DateInterval('P1D'),
            (new DateTimeImmutable($endDate))->modify('+1 day')
        );

        foreach ($period as $index => $day) {
            $date = $day->format('Y-m-d');
            $count = (int) ($counts[$date] ?? 0);
            $maxCount = max($maxCount, $count);

            $cells[] = [
                'date' => $date,
                'count' => $count,
                'intensity' => $this->intensityForCount($count),
                'weekday' => (int) $day->format('N'),
                'weekday_label' => $day->format('D'),
                'day_of_month' => $day->format('j'),
                'month_label' => $day->format('M'),
                'is_today' => $date === $today,
                'week_index' => intdiv($index, 7),
                'long_label' => $day->format('M j, Y'),
            ];
        }

        return [
            'cells' => $cells,
            'max_count' => $maxCount,
            'total_entries' => $summary['total_entries'],
            'active_days' => $summary['active_days'],
            'last_entry_date' => $summary['last_entry_date'],
        ];
    }

    private function buildProgressSeries(int $userId, string $startDate, string $endDate, ?string $entityType = null, ?int $entityId = null): array
    {
        $points = $this->historyRepository->getProgressSeries($userId, $startDate, $endDate, $entityType, $entityId);

        return [
            'points' => array_map(static function (array $point): array {
                return [
                    'date' => $point['chart_date'],
                    'progress_percent' => (int) $point['progress_percent'],
                ];
            }, $points),
        ];
    }

    private function buildBreakdown(int $userId, string $entityType, string $startDate, string $endDate): array
    {
        $summary = $this->historyRepository->getSummary($userId, $startDate, $endDate, $entityType);
        $trackables = $this->trackableRepository->listOwnedEntities($userId, $entityType);

        return [
            'tracked_items' => count($trackables),
            'total_entries' => $summary['total_entries'],
            'active_days' => $summary['active_days'],
            'last_entry_date' => $summary['last_entry_date'],
        ];
    }

    private function buildAvailableEntities(int $userId): array
    {
        return [
            'goals' => array_map(static function (array $goal): array {
                return [
                    'id' => (int) $goal['id'],
                    'title' => $goal['title'],
                    'status' => $goal['status'],
                    'current_progress_percent' => (int) $goal['current_progress_percent'],
                ];
            }, $this->trackableRepository->listOwnedEntities($userId, 'goal')),
            'dreams' => array_map(static function (array $dream): array {
                return [
                    'id' => (int) $dream['id'],
                    'title' => $dream['title'],
                    'status' => $dream['status'],
                    'current_progress_percent' => (int) $dream['current_progress_percent'],
                ];
            }, $this->trackableRepository->listOwnedEntities($userId, 'dream')),
        ];
    }

    private function formatEntries(array $entries): array
    {
        return array_map(static function (array $entry): array {
            return [
                'id' => (int) $entry['id'],
                'entity_type' => $entry['entity_type'],
                'entity_id' => (int) $entry['entity_id'],
                'entity_title' => $entry['entity_title'] ?? null,
                'entry_type' => $entry['entry_type'],
                'entry_type_label' => self::entryTypeLabel($entry['entry_type']),
                'title' => $entry['title'] ?? null,
                'content' => $entry['content'] ?? null,
                'entry_date' => $entry['entry_date'],
                'related_label' => $entry['task_title'] ?? $entry['habit_title'] ?? null,
                'progress_percent' => isset($entry['progress_percent']) ? (int) $entry['progress_percent'] : null,
                'created_at' => $entry['created_at'],
            ];
        }, $entries);
    }

    private function requireEntity(int $userId, string $entityType, int $entityId): array
    {
        $entity = $this->trackableRepository->getOwnedEntity($userId, $entityType, $entityId);

        if (!$entity) {
            throw new InvalidArgumentException('Requested item was not found.');
        }

        return $entity;
    }

    private function resolveRange(string $rangeKey, bool $dashboard): array
    {
        $normalized = strtolower(trim($rangeKey));
        $allowed = $dashboard ? ['week', 'month', 'year'] : ['30d', 'week', 'month', 'year'];

        if (!in_array($normalized, $allowed, true)) {
            $normalized = $dashboard ? 'year' : '30d';
        }

        $days = match ($normalized) {
            'week' => 7,
            'month', '30d' => 30,
            'year' => 365,
            default => 30,
        };

        $end = new DateTimeImmutable('today');
        $start = $end->sub(new DateInterval('P' . ($days - 1) . 'D'));

        return [$normalized, [
            'start' => $start->format('Y-m-d'),
            'end' => $end->format('Y-m-d'),
            'label' => match ($normalized) {
                'week' => 'Last 7 days',
                'month' => 'Last 30 days',
                '30d' => 'Last 30 days',
                'year' => 'Last 365 days',
                default => 'Last 30 days',
            },
        ]];
    }

    private function normalizeEntityType(string $entityType): string
    {
        $entityType = strtolower(trim($entityType));

        if (!in_array($entityType, ['goal', 'dream'], true)) {
            throw new InvalidArgumentException('Invalid entity type.');
        }

        return $entityType;
    }

    private function normalizeDate(string $date): string
    {
        return (new DateTimeImmutable($date))->format('Y-m-d');
    }

    private function normalizeOptionalProgress($progressPercent): ?int
    {
        if ($progressPercent === null || $progressPercent === '') {
            return null;
        }

        $value = (int) $progressPercent;
        if ($value < 0 || $value > 100) {
            throw new InvalidArgumentException('Progress percent must be between 0 and 100.');
        }

        return $value;
    }

    private function intensityForCount(int $count): int
    {
        if ($count <= 0) {
            return 0;
        }

        if ($count === 1) {
            return 1;
        }

        if ($count === 2) {
            return 2;
        }

        if ($count <= 4) {
            return 3;
        }

        return 4;
    }

    private static function entryTypeLabel(string $entryType): string
    {
        return match ($entryType) {
            'manual_log' => 'Manual Log',
            'task_completion' => 'Task Completed',
            'habit_action' => 'Habit Action',
            'system_event' => 'System Event',
            default => 'Activity',
        };
    }
}

