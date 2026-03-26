<?php

namespace src\api\history;

use DateTimeImmutable;
use PDO;
use src\lib\Database;

class HistoryRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function beginTransaction(): void
    {
        if (!$this->db->inTransaction()) {
            $this->db->beginTransaction();
        }
    }

    public function commit(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->commit();
        }
    }

    public function rollBack(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }
    }

    public function createHistoryEntry(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO history_entries (user_id, entity_type, entity_id, entry_type, title, content, entry_date, related_type, related_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['user_id'],
            $data['entity_type'],
            $data['entity_id'],
            $data['entry_type'],
            $data['title'] ?? null,
            $data['content'] ?? null,
            $data['entry_date'],
            $data['related_type'] ?? null,
            $data['related_id'] ?? null,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function createProgressSnapshot(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO progress_snapshots (user_id, entity_type, entity_id, history_entry_id, progress_percent, snapshot_date)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['user_id'],
            $data['entity_type'],
            $data['entity_id'],
            $data['history_entry_id'] ?? null,
            $data['progress_percent'],
            $data['snapshot_date'],
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getHeatmapCounts(int $userId, string $startDate, string $endDate, ?string $entityType = null, ?int $entityId = null): array
    {
        [$where, $params] = $this->buildHistoryWhere($userId, $startDate, $endDate, $entityType, $entityId);

        $stmt = $this->db->prepare(
            "SELECT entry_date, COUNT(*) AS entry_count
             FROM history_entries
             WHERE {$where}
             GROUP BY entry_date
             ORDER BY entry_date ASC"
        );
        $stmt->execute($params);

        $rows = [];
        foreach ($stmt->fetchAll() as $row) {
            $rows[$row['entry_date']] = (int) $row['entry_count'];
        }

        return $rows;
    }

    public function getProgressSeries(int $userId, string $startDate, string $endDate, ?string $entityType = null, ?int $entityId = null): array
    {
        $params = [$userId, $startDate, $endDate];
        $where = 'user_id = ? AND snapshot_date BETWEEN ? AND ?';

        if ($entityType !== null) {
            $where .= ' AND entity_type = ?';
            $params[] = $entityType;
        }

        if ($entityId !== null) {
            $where .= ' AND entity_id = ?';
            $params[] = $entityId;
        }

        if ($entityType === null && $entityId === null) {
            $stmt = $this->db->prepare(
                "SELECT snapshot_date AS chart_date, ROUND(AVG(progress_percent)) AS progress_percent
                 FROM progress_snapshots
                 WHERE {$where}
                 GROUP BY snapshot_date
                 ORDER BY snapshot_date ASC"
            );
            $stmt->execute($params);
            return $stmt->fetchAll();
        }

        $stmt = $this->db->prepare(
            "SELECT snapshot_date AS chart_date, progress_percent
             FROM progress_snapshots
             WHERE {$where}
             ORDER BY snapshot_date ASC, id ASC"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getSummary(int $userId, string $startDate, string $endDate, ?string $entityType = null, ?int $entityId = null): array
    {
        [$where, $params] = $this->buildHistoryWhere($userId, $startDate, $endDate, $entityType, $entityId);

        $stmt = $this->db->prepare(
            "SELECT COUNT(*) AS total_entries,
                    COUNT(DISTINCT entry_date) AS active_days,
                    MAX(entry_date) AS last_entry_date
             FROM history_entries
             WHERE {$where}"
        );
        $stmt->execute($params);

        $summary = $stmt->fetch() ?: [];

        return [
            'total_entries' => (int) ($summary['total_entries'] ?? 0),
            'active_days' => (int) ($summary['active_days'] ?? 0),
            'last_entry_date' => $summary['last_entry_date'] ?? null,
        ];
    }

    public function getRecentEntries(int $userId, int $limit = 10, ?string $entityType = null, ?int $entityId = null): array
    {
        $params = [$userId];
        $where = 'he.user_id = ?';

        if ($entityType !== null) {
            $where .= ' AND he.entity_type = ?';
            $params[] = $entityType;
        }

        if ($entityId !== null) {
            $where .= ' AND he.entity_id = ?';
            $params[] = $entityId;
        }

        $limit = max(1, min(50, $limit));

        $stmt = $this->db->prepare(
            "SELECT he.id,
                    he.entity_type,
                    he.entity_id,
                    he.entry_type,
                    he.title,
                    he.content,
                    he.entry_date,
                    he.created_at,
                    CASE WHEN he.entity_type = 'goal' THEN g.title ELSE d.title END AS entity_title
             FROM history_entries he
             LEFT JOIN goals g ON he.entity_type = 'goal' AND g.id = he.entity_id
             LEFT JOIN dreams d ON he.entity_type = 'dream' AND d.id = he.entity_id
             WHERE {$where}
             ORDER BY he.entry_date DESC, he.created_at DESC
             LIMIT {$limit}"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getEntryTypeCounts(int $userId, string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare(
            'SELECT entry_type, COUNT(*) AS entry_count
             FROM history_entries
             WHERE user_id = ? AND entry_date BETWEEN ? AND ?
             GROUP BY entry_type'
        );
        $stmt->execute([$userId, $startDate, $endDate]);

        $counts = [];
        foreach ($stmt->fetchAll() as $row) {
            $counts[(string) $row['entry_type']] = (int) $row['entry_count'];
        }

        return $counts;
    }

    public function getEntityActivitySummary(int $userId, string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                he.entity_type,
                he.entity_id,
                COUNT(*) AS entry_count,
                MAX(he.entry_date) AS last_entry_date,
                CASE WHEN he.entity_type = 'goal' THEN g.title ELSE d.title END AS entity_title,
                CASE WHEN he.entity_type = 'goal' THEN g.status ELSE d.status END AS entity_status,
                CASE WHEN he.entity_type = 'goal' THEN g.current_progress_percent ELSE d.current_progress_percent END AS current_progress_percent
             FROM history_entries he
             LEFT JOIN goals g
                ON he.entity_type = 'goal'
                AND g.id = he.entity_id
                AND g.user_id = he.user_id
             LEFT JOIN dreams d
                ON he.entity_type = 'dream'
                AND d.id = he.entity_id
                AND d.user_id = he.user_id
             WHERE he.user_id = ?
                AND he.entry_date BETWEEN ? AND ?
             GROUP BY
                he.entity_type,
                he.entity_id,
                g.title,
                d.title,
                g.status,
                d.status,
                g.current_progress_percent,
                d.current_progress_percent
             ORDER BY entry_count DESC, last_entry_date DESC, he.entity_type ASC, he.entity_id ASC"
        );
        $stmt->execute([$userId, $startDate, $endDate]);

        return $stmt->fetchAll();
    }

    public function getDayEntries(int $userId, string $entryDate, ?string $entityType = null, ?int $entityId = null): array
    {
        $params = [$userId, $entryDate];
        $where = 'he.user_id = ? AND he.entry_date = ?';

        if ($entityType !== null) {
            $where .= ' AND he.entity_type = ?';
            $params[] = $entityType;
        }

        if ($entityId !== null) {
            $where .= ' AND he.entity_id = ?';
            $params[] = $entityId;
        }

        $stmt = $this->db->prepare(
            "SELECT he.id,
                    he.entity_type,
                    he.entity_id,
                    he.entry_type,
                    he.title,
                    he.content,
                    he.entry_date,
                    he.related_type,
                    he.related_id,
                    he.created_at,
                    CASE WHEN he.entity_type = 'goal' THEN g.title ELSE d.title END AS entity_title,
                    gt.title AS task_title,
                    gh.title AS habit_title,
                    ps.progress_percent
             FROM history_entries he
             LEFT JOIN goals g ON he.entity_type = 'goal' AND g.id = he.entity_id
             LEFT JOIN dreams d ON he.entity_type = 'dream' AND d.id = he.entity_id
             LEFT JOIN goal_tasks gt ON he.related_type = 'goal_task' AND gt.id = he.related_id
             LEFT JOIN goal_habits gh ON he.related_type = 'goal_habit' AND gh.id = he.related_id
             LEFT JOIN progress_snapshots ps ON ps.history_entry_id = he.id
             WHERE {$where}
             ORDER BY he.created_at DESC, he.id DESC"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getCurrentProgress(int $userId, string $entityType, int $entityId): int
    {
        $table = $entityType === 'goal' ? 'goals' : 'dreams';

        $stmt = $this->db->prepare(
            "SELECT current_progress_percent
             FROM {$table}
             WHERE id = ? AND user_id = ?"
        );
        $stmt->execute([$entityId, $userId]);

        return (int) ($stmt->fetchColumn() ?: 0);
    }

    public function hasAnyEntries(int $userId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM history_entries WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        return (bool) $stmt->fetchColumn();
    }

    public function normalizeDate(string $date): string
    {
        return (new DateTimeImmutable($date))->format('Y-m-d');
    }

    private function buildHistoryWhere(int $userId, string $startDate, string $endDate, ?string $entityType, ?int $entityId): array
    {
        $where = 'user_id = ? AND entry_date BETWEEN ? AND ?';
        $params = [$userId, $startDate, $endDate];

        if ($entityType !== null) {
            $where .= ' AND entity_type = ?';
            $params[] = $entityType;
        }

        if ($entityId !== null) {
            $where .= ' AND entity_id = ?';
            $params[] = $entityId;
        }

        return [$where, $params];
    }
}

