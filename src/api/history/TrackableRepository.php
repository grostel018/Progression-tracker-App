<?php

namespace src\api\history;

use InvalidArgumentException;
use PDO;
use src\lib\Database;

class TrackableRepository
{
    private const ENTITY_TABLES = [
        'goal' => 'goals',
        'dream' => 'dreams',
    ];

    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getOwnedEntity(int $userId, string $entityType, int $entityId): ?array
    {
        $table = $this->tableFor($entityType);

        $stmt = $this->db->prepare(
            "SELECT id, title, current_progress_percent, status, created_at
             FROM {$table}
             WHERE id = ? AND user_id = ?"
        );
        $stmt->execute([$entityId, $userId]);
        $entity = $stmt->fetch();

        if (!$entity) {
            return null;
        }

        $entity['entity_type'] = $entityType;
        return $entity;
    }

    public function listOwnedEntities(int $userId, string $entityType): array
    {
        $table = $this->tableFor($entityType);

        $stmt = $this->db->prepare(
            "SELECT id, title, current_progress_percent, status
             FROM {$table}
             WHERE user_id = ?
             ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function updateCurrentProgress(int $userId, string $entityType, int $entityId, int $progressPercent): bool
    {
        $table = $this->tableFor($entityType);

        $stmt = $this->db->prepare(
            "UPDATE {$table}
             SET current_progress_percent = ?
             WHERE id = ? AND user_id = ?"
        );

        return $stmt->execute([$progressPercent, $entityId, $userId]);
    }

    private function tableFor(string $entityType): string
    {
        if (!isset(self::ENTITY_TABLES[$entityType])) {
            throw new InvalidArgumentException('Unsupported entity type.');
        }

        return self::ENTITY_TABLES[$entityType];
    }
}
