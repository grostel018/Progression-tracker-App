<?php

namespace src\api\auth;

use PDO;
use src\lib\Database;
use src\lib\Auth;

/**
 * Logout API Handler
 * Handles user logout requests
 */
class LogoutHandler
{
    private PDO $db;
    private Auth $auth;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auth = new Auth($this->db, config('app'));
    }

    public function handle(): array
    {
        $this->auth->logout();
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
}
