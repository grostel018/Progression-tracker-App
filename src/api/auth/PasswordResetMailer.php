<?php

declare(strict_types=1);

namespace src\api\auth;

final class PasswordResetMailer
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function sendResetLink(string $email, string $resetUrl): bool
    {
        $transport = $this->config['transport'] ?? 'log';

        if ($transport === 'mail') {
            return $this->sendViaMail($email, $resetUrl);
        }

        return $this->sendViaLog($email, $resetUrl);
    }

    private function sendViaMail(string $email, string $resetUrl): bool
    {
        $fromAddress = (string) ($this->config['from_address'] ?? 'no-reply@progression-tracker.local');
        $fromName = (string) ($this->config['from_name'] ?? 'Progression Tracker');
        $subject = 'Reset your Progression Tracker password';
        $message = "Use this link to reset your password:\n\n{$resetUrl}\n\nThis link expires in 30 minutes.";
        $headers = [
            'From: ' . sprintf('%s <%s>', $fromName, $fromAddress),
            'Content-Type: text/plain; charset=UTF-8',
        ];

        return mail($email, $subject, $message, implode("\r\n", $headers));
    }

    private function sendViaLog(string $email, string $resetUrl): bool
    {
        $logPath = (string) ($this->config['log_path'] ?? (BASE_PATH . '/var/logs/password-reset.log'));
        $directory = dirname($logPath);

        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $entry = sprintf(
            "[%s] password reset for %s%s%s%s",
            gmdate('c'),
            $email,
            PHP_EOL,
            $resetUrl,
            PHP_EOL . PHP_EOL
        );

        return file_put_contents($logPath, $entry, FILE_APPEND | LOCK_EX) !== false;
    }
}
