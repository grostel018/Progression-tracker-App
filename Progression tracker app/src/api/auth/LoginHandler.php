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
    private AuthInputValidator $validator;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auth = new Auth($this->db, config('app'));
        $this->validator = new AuthInputValidator(config('app'));
    }

    public function handle(array $input): array
    {
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        $validation = $this->validator->validateLogin($input);
        if ($validation !== []) {
            return ['success' => false] + $validation;
        }

        $result = $this->auth->attempt($email, $password);

        if ($result === true) {
            return ['success' => true, 'message' => 'Login successful'];
        }

        return ['success' => false, 'message' => $result];
    }
}
