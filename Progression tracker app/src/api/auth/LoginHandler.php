<?php

namespace src\api\auth;

use PDO;
use src\lib\Database;
use src\lib\Auth;

/**
 * Login API Handler
 * Handles user login requests
 */
class LoginHandler
{
    private PDO $db;
    private Auth $auth;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auth = new Auth($this->db, config('app'));
    }

    public function handle(array $input): array
    {
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        // Validate input
        if (empty($email) || empty($password)) {
            return ['success' => false, 'message' => 'Email and password are required'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Invalid email format'];
        }

        // Attempt login
        $result = $this->auth->attempt($email, $password);

        if ($result === true) {
            return ['success' => true, 'message' => 'Login successful'];
        }

        return ['success' => false, 'message' => $result];
    }
}
