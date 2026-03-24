<?php

declare(strict_types=1);

namespace src\api\auth;

use PDO;
use PDOException;
use src\lib\Database;
use src\lib\Auth;

/**
 * Security Question Handler
 * Handles getting security questions and verifying answers
 */
class SecurityQuestionHandler
{
    private const DEFAULT_QUESTIONS = [
        'What was the name of your first pet?',
        'What is your mother\'s maiden name?',
        'What city were you born in?',
        'What was the name of your first school?',
        'What is your favorite book?',
        'What is your favorite movie?',
        'What was your first job?',
        'What is your favorite color?',
        'What city did you grow up in?',
        'What is your favorite sport?',
    ];

    private PDO $db;
    private Auth $auth;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auth = new Auth($this->db, config('app'));
    }

    /**
     * Get all available security questions
     */
    public function getQuestions(): array
    {
        try {
            $this->ensureDefaultQuestions();
            $questions = $this->auth->getSecurityQuestions();
            return ['success' => true, 'questions' => $questions];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Failed to load security questions'];
        }
    }

    /**
     * Verify security answers for password reset
     */
    public function verifyAnswers(array $input): array
    {
        $email = trim($input['email'] ?? '');
        $answers = $input['answers'] ?? [];

        // Validate email
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Invalid email address'];
        }

        // Validate we have 2 answers
        if (!is_array($answers) || count($answers) < 2) {
            return ['success' => false, 'message' => 'Please provide answers to 2 security questions'];
        }

        // Get user by email
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            return ['success' => false, 'message' => 'Email not found'];
        }

        $userId = (int)$user['id'];

        // Verify each answer
        $verified = 0;
        foreach ($answers as $questionId => $answer) {
            $questionId = (int)$questionId;
            $answer = trim($answer);

            if (empty($answer)) {
                return ['success' => false, 'message' => 'All answers must be non-empty'];
            }

            if ($this->auth->verifySecurityAnswer($userId, $questionId, $answer)) {
                $verified++;
            } else {
                return ['success' => false, 'message' => 'Incorrect answer to security question'];
            }
        }

        if ($verified < 2) {
            return ['success' => false, 'message' => 'Incorrect answer to security question'];
        }

        // Generate a simple reset token (stored in session for now)
        // In production, store in DB with expiration
        $token = bin2hex(random_bytes(32));
        $_SESSION['password_reset_token'] = $token;
        $_SESSION['password_reset_user_id'] = $userId;
        $_SESSION['password_reset_expires'] = time() + 3600; // 1 hour

        return [
            'success' => true,
            'message' => 'Answers verified',
            'token' => $token
        ];
    }

    private function ensureDefaultQuestions(): void
    {
        $count = (int) $this->db->query('SELECT COUNT(*) FROM security_questions')->fetchColumn();

        if ($count > 0) {
            return;
        }

        $stmt = $this->db->prepare('INSERT INTO security_questions (question) VALUES (?)');

        foreach (self::DEFAULT_QUESTIONS as $question) {
            $stmt->execute([$question]);
        }
    }
}
