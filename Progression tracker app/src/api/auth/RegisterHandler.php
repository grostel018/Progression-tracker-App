<?php

namespace src\api\auth;

use PDO;
use src\lib\Database;
use src\lib\Auth;

/**
 * Register API Handler
 * Handles user registration requests
 */
class RegisterHandler
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
        $username = trim($input['username'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $passwordConfirm = $input['password2'] ?? '';

        // Validate input
        if (empty($username) || empty($email) || empty($password)) {
            return ['success' => false, 'message' => 'All fields are required'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Invalid email format'];
        }

        if ($password !== $passwordConfirm) {
            return ['success' => false, 'message' => 'Passwords do not match'];
        }

        // Attempt registration
        $result = $this->auth->register($username, $email, $password);

        if ($result === true) {
            return ['success' => true, 'message' => 'Registration successful'];
        }

        return ['success' => false, 'message' => $result];
    }
}
