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
    private const EMAIL_MAX_ATTEMPTS = 10;
    private const EMAIL_WINDOW_SECONDS = 900;
    private const IP_MAX_ATTEMPTS = 50;
    private const IP_WINDOW_SECONDS = 900;

    private PDO $db;
    private Auth $auth;
    private AuthInputValidator $validator;
    private RateLimiter $rateLimiter;
    private ActivityLogRepository $activityLogRepository;

    public function __construct(
        ?PDO $db = null,
        ?Auth $auth = null,
        ?AuthInputValidator $validator = null,
        ?RateLimiter $rateLimiter = null,
        ?ActivityLogRepository $activityLogRepository = null
    )
    {
        $this->db = $db ?? Database::getConnection();
        $this->auth = $auth ?? new Auth($this->db, config('app'));
        $this->validator = $validator ?? new AuthInputValidator(config('app'));
        $this->rateLimiter = $rateLimiter ?? new RateLimiter();
        $this->activityLogRepository = $activityLogRepository ?? new ActivityLogRepository($this->db);
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

        $limits = [
            $ipKey => [self::IP_MAX_ATTEMPTS, self::IP_WINDOW_SECONDS],
            $emailKey => [self::EMAIL_MAX_ATTEMPTS, self::EMAIL_WINDOW_SECONDS],
        ];

        foreach ($limits as $key => [$maxAttempts, $windowSeconds]) {
            $limit = $this->rateLimiter->consume($key, $maxAttempts, $windowSeconds);
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

            $this->rateLimiter->clear($emailKey);

            if ($userId !== null) {
                $this->activityLogRepository->trackLogin($userId);
            }

            return ['success' => true, 'message' => 'Login successful'];
        }

        return ['success' => false, 'message' => $result];
    }
}
