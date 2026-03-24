<?php

namespace src\api\auth;

use PDO;
use PDOException;
use src\lib\Database;

class ForgotPasswordHandler
{
    private PDO $db;
    private AuthInputValidator $validator;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->validator = new AuthInputValidator(config('app'));
    }

    public function handle(array $input): array
    {
        $validation = $this->validator->validateRecovery($input);
        if ($validation !== []) {
            return ['success' => false] + $validation;
        }

        $email = trim((string) ($input['email'] ?? ''));

        try {
            $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
            $userId = $stmt->fetchColumn();

            if ($userId === false) {
                return [
                    'success' => false,
                    'message' => 'No account was found for that email address.',
                    'errors' => ['email' => 'No account was found for that email address.'],
                ];
            }

            $questionStmt = $this->db->prepare(
                'SELECT sq.id, sq.question
                 FROM user_security_answers usa
                 JOIN security_questions sq ON sq.id = usa.question_id
                 WHERE usa.user_id = ?
                 ORDER BY sq.question ASC'
            );
            $questionStmt->execute([(int) $userId]);
            $questions = $questionStmt->fetchAll();

            if (count($questions) < 2) {
                return [
                    'success' => false,
                    'message' => 'This account does not have enough security questions configured to reset the password.',
                ];
            }
        } catch (PDOException) {
            return ['success' => false, 'message' => 'Database error'];
        }

        return [
            'success' => true,
            'message' => 'Answer your security questions to continue.',
            'questions' => array_values(array_map(
                static fn (array $question): array => [
                    'id' => (int) $question['id'],
                    'question' => (string) $question['question'],
                ],
                $questions
            )),
        ];
    }
}
