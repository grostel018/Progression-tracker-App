<?php

namespace src\api\auth;

use PDO;
use src\api\logs\ActivityLogRepository;
use src\lib\Database;
use src\lib\Auth;
use src\lib\RateLimiter;

/**
 * Login API Handler
 * Handles user login requests
 */
class LoginHandler
{
    private PDO $db;
    private Auth $auth;
    private AuthInputValidator $validator;
    private RateLimiter $rateLimiter;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auth = new Auth($this->db, config('app'));
        $this->validator = new AuthInputValidator(config('app'));
        $this->rateLimiter = new RateLimiter();
    }

    public function handle(array $input): array
    {
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        $validation = $this->validator->validateLogin($input);
        if ($validation !== []) {
            return ['success' => false] + $validation;
        }

        $ipKey = 'auth:login:ip:' . request_ip();
        $emailKey = 'auth:login:email:' . hash('sha256', strtolower($email));

        foreach ([$ipKey, $emailKey] as $key) {
            $limit = $this->rateLimiter->check($key, 10, 900);
            if (!$limit['allowed']) {
                return [
                    'success' => false,
                    'message' => 'Too many login attempts. Please wait before trying again.',
                    'status' => 429,
                ];
            }
        }

        $result = $this->auth->attempt($email, $password);

        if ($result === true) {
            $userId = $this->auth->id();

            $this->rateLimiter->clear($ipKey);
            $this->rateLimiter->clear($emailKey);

            if ($userId !== null) {
                (new ActivityLogRepository())->trackLogin($userId);
            }

            return ['success' => true, 'message' => 'Login successful'];
        }

        $this->rateLimiter->hit($ipKey, 900);
        $this->rateLimiter->hit($emailKey, 900);

        return ['success' => false, 'message' => $result];
    }
}
