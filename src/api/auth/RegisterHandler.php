<?php

namespace src\api\auth;

use PDO;
use src\api\logs\ActivityLogRepository;
use src\lib\Database;
use src\lib\Auth;
use src\lib\RateLimiter;

/**
 * Register API Handler
 * Handles user registration requests
 */
class RegisterHandler
{
    private const IP_MAX_ATTEMPTS = 5;
    private const IDENTITY_MAX_ATTEMPTS = 3;
    private const WINDOW_SECONDS = 3600;

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
        $username = trim($input['username'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        $validation = $this->validator->validateRegister($input);
        if ($validation !== []) {
            return ['success' => false] + $validation;
        }

        $ipKey = 'auth:register:ip:' . request_ip();
        $emailKey = 'auth:register:email:' . hash('sha256', strtolower($email));
        $usernameKey = 'auth:register:username:' . hash('sha256', strtolower($username));
        $limits = [
            $ipKey => [self::IP_MAX_ATTEMPTS, self::WINDOW_SECONDS],
            $emailKey => [self::IDENTITY_MAX_ATTEMPTS, self::WINDOW_SECONDS],
            $usernameKey => [self::IDENTITY_MAX_ATTEMPTS, self::WINDOW_SECONDS],
        ];

        foreach ($limits as $key => [$maxAttempts, $windowSeconds]) {
            $limit = $this->rateLimiter->consume($key, $maxAttempts, $windowSeconds);
            if (!$limit['allowed']) {
                return [
                    'success' => false,
                    'message' => 'Too many registration attempts. Please wait before trying again.',
                    'status' => 429,
                ];
            }
        }

        $result = $this->auth->register($username, $email, $password);

        if ($result === true) {
            $userId = $this->findUserIdByEmail($email);
            $this->rateLimiter->clear($emailKey);
            $this->rateLimiter->clear($usernameKey);

            if ($userId !== null) {
                $this->activityLogRepository->create([
                    'user_id' => $userId,
                    'action' => 'register',
                    'target_type' => 'user',
                    'target_id' => $userId,
                    'details' => json_encode(['username' => $username, 'email' => $email]),
                ]);
            }

            return ['success' => true, 'message' => 'Registration successful'];
        }

        return [
            'success' => false,
            'message' => 'Registration could not be completed.',
        ];
    }

    private function findUserIdByEmail(string $email): ?int
    {
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);

        $userId = $stmt->fetchColumn();

        return $userId === false ? null : (int) $userId;
    }
}
