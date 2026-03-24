<?php

declare(strict_types=1);

namespace src\api\auth;

use PDO;
use src\lib\Database;
use src\lib\Auth;

/**
 * Reset Password Handler
 * Handles updating user passwords after verification
 */
class ResetPasswordHandler
{
    private PDO $db;
    private Auth $auth;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auth = new Auth($this->db, config('app'));
    }

    /**
     * Reset user password
     */
    public function reset(array $input): array
    {
        $token = $input['token'] ?? '';
        $password = $input['password'] ?? '';
        $passwordConfirm = $input['password_confirm'] ?? '';
        $expiresAt = (int) ($_SESSION['password_reset_expires'] ?? 0);

        // Validate token from session
        if (empty($token) || empty($_SESSION['password_reset_token']) || $token !== $_SESSION['password_reset_token']) {
            return ['success' => false, 'message' => 'Invalid or expired reset token'];
        }

        if ($expiresAt <= 0 || $expiresAt < time()) {
            unset($_SESSION['password_reset_token'], $_SESSION['password_reset_user_id'], $_SESSION['password_reset_expires']);
            return ['success' => false, 'message' => 'Reset session expired. Start the recovery flow again.'];
        }

        // Validate password
        if (strlen($password) < 6) {
            return ['success' => false, 'message' => 'Password must be at least 6 characters'];
        }

        if ($password !== $passwordConfirm) {
            return ['success' => false, 'message' => 'Passwords do not match'];
        }

        // Get user ID from session
        $userId = $_SESSION['password_reset_user_id'] ?? null;
        if (!$userId) {
            return ['success' => false, 'message' => 'Invalid reset session'];
        }

        // Update password
        $hash = password_hash($password, PASSWORD_ARGON2ID);
        $stmt = $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([$hash, $userId]);

        // Invalidate reset token
        unset($_SESSION['password_reset_token']);
        unset($_SESSION['password_reset_user_id']);
        unset($_SESSION['password_reset_expires']);

        return [
            'success' => true,
            'message' => 'Password reset successful'
        ];
    }
}
