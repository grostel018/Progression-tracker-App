<?php

namespace src\api\auth;

use PDO;
use src\api\logs\ActivityLogRepository;
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
        $securityQuestions = $input['security_questions'] ?? '';

        $validation = $this->validator->validateRegister($input);
        if ($validation !== []) {
            return ['success' => false] + $validation;
        }

        $result = $this->auth->register($username, $email, $password);

        if ($result === true) {
            $userId = $this->findUserIdByEmail($email);

            // Handle optional security questions
            if ($userId !== null && !empty($securityQuestions)) {
                $questionsData = json_decode($securityQuestions, true);
                if (is_array($questionsData) && count($questionsData) >= 1) {
                    $this->auth->setSecurityQuestions($userId, $questionsData);
                }
            }

            if ($userId !== null) {
                (new ActivityLogRepository())->create([
                    'user_id' => $userId,
                    'action' => 'register',
                    'target_type' => 'user',
                    'target_id' => $userId,
                    'details' => json_encode(['username' => $username, 'email' => $email]),
                ]);
            }

            return ['success' => true, 'message' => 'Registration successful'];
        }

        if (is_array($result)) {
            return ['success' => false] + $result;
        }

        return ['success' => false, 'message' => $result];
    }

    private function findUserIdByEmail(string $email): ?int
    {
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);

        $userId = $stmt->fetchColumn();

        return $userId === false ? null : (int) $userId;
    }
}
