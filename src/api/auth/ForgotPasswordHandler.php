<?php

namespace src\api\auth;

use DateTimeImmutable;
use PDO;
use PDOException;
use src\lib\Database;
use src\lib\RateLimiter;

class ForgotPasswordHandler
{
    private PDO $db;
    private AuthInputValidator $validator;
    private RateLimiter $rateLimiter;
    private PasswordResetTokenRepository $passwordResetTokens;
    private PasswordResetMailer $mailer;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->validator = new AuthInputValidator(config('app'));
        $this->rateLimiter = new RateLimiter();
        $this->passwordResetTokens = new PasswordResetTokenRepository();
        $this->mailer = new PasswordResetMailer(config('app.mail', []));
    }

    public function handle(array $input): array
    {
        $validation = $this->validator->validateRecovery($input);
        if ($validation !== []) {
            return ['success' => false] + $validation;
        }

        $email = trim((string) ($input['email'] ?? ''));
        $normalizedEmail = strtolower($email);
        $ipKey = 'auth:forgot:ip:' . request_ip();
        $emailKey = 'auth:forgot:email:' . hash('sha256', $normalizedEmail);

        foreach ([$ipKey, $emailKey] as $key) {
            $limit = $this->rateLimiter->check($key, 5, 900);
            if (!$limit['allowed']) {
                return $this->genericResponse();
            }
        }

        $this->rateLimiter->hit($ipKey, 900);
        $this->rateLimiter->hit($emailKey, 900);

        try {
            $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
            $userId = $stmt->fetchColumn();

            $this->passwordResetTokens->purgeExpired();

            if ($userId !== false) {
                $rawToken = bin2hex(random_bytes(32));
                $tokenHash = hash('sha256', $rawToken);
                $expiresAt = (new DateTimeImmutable('+30 minutes'))->format('Y-m-d H:i:s');

                $this->passwordResetTokens->invalidateUserTokens((int) $userId);
                $this->passwordResetTokens->create(
                    (int) $userId,
                    $tokenHash,
                    $expiresAt,
                    request_ip(),
                    substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 1000) ?: null
                );

                $resetUrl = rtrim((string) config('app.app_url', ''), '/') . '/reset-password.php?token=' . urlencode($rawToken);
                $this->mailer->sendResetLink($email, $resetUrl);
            }
        } catch (PDOException) {
            return $this->genericResponse();
        }

        return $this->genericResponse();
    }

    private function genericResponse(): array
    {
        return [
            'success' => true,
            'message' => 'If the address is registered, a password reset link will be sent shortly.',
        ];
    }
}
