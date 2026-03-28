<?php

declare(strict_types=1);

namespace src\api\auth;

use PDO;
use src\lib\Database;
use src\lib\RateLimiter;

/**
 * Reset Password Handler
 * Handles updating user passwords after verification
 */
class ResetPasswordHandler
{
    private PDO $db;
    private PasswordResetTokenRepository $passwordResetTokens;
    private RateLimiter $rateLimiter;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->passwordResetTokens = new PasswordResetTokenRepository();
        $this->rateLimiter = new RateLimiter();
    }

    /**
     * Reset user password
     */
    public function reset(array $input): array
    {
        $token = $input['token'] ?? '';
        $password = $input['password'] ?? '';
        $passwordConfirm = $input['password_confirm'] ?? '';
        $tokenHash = hash('sha256', (string) $token);
        $ipKey = 'auth:reset:ip:' . request_ip();
        $tokenKey = 'auth:reset:token:' . hash('sha256', request_ip() . ':' . $tokenHash);

        foreach ([$ipKey, $tokenKey] as $key) {
            $limit = $this->rateLimiter->check($key, 5, 900);
            if (!$limit['allowed']) {
                return [
                    'success' => false,
                    'message' => 'Too many reset attempts. Please wait before trying again.',
                    'status' => 429,
                ];
            }
        }

        if (!is_string($token) || trim($token) === '' || !preg_match('/^[a-f0-9]{64}$/', $token)) {
            return ['success' => false, 'message' => 'Reset link is invalid or expired.'];
        }

        $this->rateLimiter->hit($ipKey, 900);
        $this->rateLimiter->hit($tokenKey, 900);

        $minLength = (int) config('app.password.min_length', 10);

        if (strlen($password) < $minLength) {
            return ['success' => false, 'message' => sprintf('Password must be at least %d characters', $minLength)];
        }

        if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            return ['success' => false, 'message' => 'Password must include at least one letter and one number'];
        }

        if ($password !== $passwordConfirm) {
            return ['success' => false, 'message' => 'Passwords do not match'];
        }

        $tokenRecord = $this->passwordResetTokens->findActiveByHash($tokenHash);
        if (!$tokenRecord) {
            return ['success' => false, 'message' => 'Reset link is invalid or expired.'];
        }

        $algorithm = config('app.password.algorithm', PASSWORD_ARGON2ID);
        $hash = password_hash($password, $algorithm);

        $this->db->beginTransaction();

        try {
            $stmt = $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $stmt->execute([$hash, (int) $tokenRecord['user_id']]);

            $this->passwordResetTokens->markUsed((int) $tokenRecord['id']);
            $this->passwordResetTokens->invalidateUserTokens((int) $tokenRecord['user_id']);
            $this->db->commit();
        } catch (\Throwable) {
            $this->db->rollBack();
            return ['success' => false, 'message' => 'Password reset failed'];
        }

        $this->rateLimiter->clear($ipKey);
        $this->rateLimiter->clear($tokenKey);

        return [
            'success' => true,
            'message' => 'Password reset successful'
        ];
    }
}
