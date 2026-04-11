<?php

namespace src\api\auth;

use PDO;
use src\lib\Database;
use src\lib\Auth;

/**
 * Session Manager
 * Handles session validation and user data retrieval
 */
class SessionManager
{
    private PDO $db;
    private Auth $auth;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auth = new Auth($this->db, config('app'));
    }

    /**
     * Check if session is valid and return user data
     */
    public function checkSession(): array
    {
        if (!$this->auth->check()) {
            return ['authenticated' => false];
        }

        $user = $this->auth->user();

        if (!$user) {
            $this->auth->logout();
            return ['authenticated' => false];
        }

        return [
            'authenticated' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'created_at' => $user['created_at'],
            ]
        ];
    }

    /**
     * Require authentication, redirect if not authenticated
     */
    public function requireAuth(): void
    {
        $this->auth->requireAuth();
    }
}
