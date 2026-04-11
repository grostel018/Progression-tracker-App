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
    private AuthInputValidator $validator;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auth = new Auth($this->db, config('app'));
        $this->validator = new AuthInputValidator(config('app'));
    }

    public function handle(array $input): array
    {
        $username = trim($input['username'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $passwordConfirm = $input['password2'] ?? '';

        $validation = $this->validator->validateRegister($input);
        if ($validation !== []) {
            return ['success' => false] + $validation;
        }

        $result = $this->auth->register($username, $email, $password);

        if ($result === true) {
            return ['success' => true, 'message' => 'Registration successful'];
        }

        if (is_array($result)) {
            return ['success' => false] + $result;
        }

        return ['success' => false, 'message' => $result];
    }
}
