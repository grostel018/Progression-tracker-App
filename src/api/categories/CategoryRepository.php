<?php
/**
 * Category Repository
 * Handles database operations for categories
 */
namespace src\api\categories;

use src\lib\Auth;
use src\lib\Database;

class CategoryRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT c.*, COUNT(d.id) as dream_count
             FROM categories c
             LEFT JOIN dreams d ON c.id = d.category_id
             WHERE c.user_id = ?
             GROUP BY c.id
             ORDER BY c.created_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function getById(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        return $stmt->fetch();
    }

    public function isOwnedByUser(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM categories WHERE id = ? AND user_id = ? LIMIT 1');
        $stmt->execute([$id, $userId]);
        return (bool) $stmt->fetchColumn();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO categories (user_id, name) VALUES (?, ?)'
        );
        $stmt->execute([$data['user_id'], $data['name']]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, int $userId, array $data): bool
    {
        $stmt = $this->db->prepare('UPDATE categories SET name = ? WHERE id = ? AND user_id = ?');
        return $stmt->execute([$data['name'], $id, $userId]);
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM categories WHERE id = ? AND user_id = ?');
        return $stmt->execute([$id, $userId]);
    }
}
