<?php

declare(strict_types=1);

namespace src\api\auth;

use PDO;
use src\lib\Database;

final class PasswordResetTokenRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function purgeExpired(): void
    {
        $stmt = $this->db->prepare('DELETE FROM password_reset_tokens WHERE expires_at < UTC_TIMESTAMP() OR used_at IS NOT NULL');
        $stmt->execute();
    }

    public function create(int $userId, string $tokenHash, string $expiresAtUtc, ?string $ipAddress, ?string $userAgent): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, requested_ip, user_agent)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $tokenHash, $expiresAtUtc, $ipAddress, $userAgent]);
    }

    public function findActiveByHash(string $tokenHash): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, user_id, expires_at
             FROM password_reset_tokens
             WHERE token_hash = ?
               AND used_at IS NULL
               AND expires_at >= UTC_TIMESTAMP()
             LIMIT 1'
        );
        $stmt->execute([$tokenHash]);
        return $stmt->fetch() ?: null;
    }

    public function markUsed(int $tokenId): void
    {
        $stmt = $this->db->prepare('UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?');
        $stmt->execute([$tokenId]);
    }

    public function invalidateUserTokens(int $userId): void
    {
        $stmt = $this->db->prepare('UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND used_at IS NULL');
        $stmt->execute([$userId]);
    }
}
