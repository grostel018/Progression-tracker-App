<?php

declare(strict_types=1);

namespace tests\Auth;

use src\api\auth\AuthInputValidator;
use src\api\auth\RegisterHandler;
use src\api\logs\ActivityLogRepository;
use src\lib\Auth;
use src\lib\RateLimiter;
use tests\TestCase;

final class RegisterHandlerTest extends TestCase
{
    public function testHandleCreatesUserAndActivityLog(): void
    {
        $pdo = $this->makeSqliteConnection();
        $this->createSchema($pdo);

        $handler = new RegisterHandler(
            $pdo,
            new Auth($pdo, config('app')),
            new AuthInputValidator(config('app')),
            new RateLimiter($this->tempPath('rate-limits')),
            new ActivityLogRepository($pdo)
        );

        $result = $handler->handle([
            'username' => 'rostel',
            'email' => 'rostel@example.com',
            'password' => 'Password123',
            'password2' => 'Password123',
        ]);

        $this->assertTrue($result['success']);
        $this->assertSame(1, (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn());
        $this->assertSame(1, (int) $pdo->query('SELECT COUNT(*) FROM activity_logs WHERE action = "register"')->fetchColumn());
    }

    public function testHandleReturnsGenericFailureForDuplicateEmail(): void
    {
        $pdo = $this->makeSqliteConnection();
        $this->createSchema($pdo);

        $pdo->prepare('INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
            ->execute(['existing', 'rostel@example.com', password_hash('Password123', PASSWORD_BCRYPT), '2026-03-29 00:00:00']);

        $handler = new RegisterHandler(
            $pdo,
            new Auth($pdo, config('app')),
            new AuthInputValidator(config('app')),
            new RateLimiter($this->tempPath('rate-limits')),
            new ActivityLogRepository($pdo)
        );

        $result = $handler->handle([
            'username' => 'new-user',
            'email' => 'rostel@example.com',
            'password' => 'Password123',
            'password2' => 'Password123',
        ]);

        $this->assertFalse($result['success']);
        $this->assertSame('Registration could not be completed.', $result['message']);
        $this->assertSame(0, (int) $pdo->query('SELECT COUNT(*) FROM activity_logs')->fetchColumn());
    }

    public function testHandleRateLimitsRepeatedRegistrationAttemptsByIp(): void
    {
        $pdo = $this->makeSqliteConnection();
        $this->createSchema($pdo);

        $handler = new RegisterHandler(
            $pdo,
            new Auth($pdo, config('app')),
            new AuthInputValidator(config('app')),
            new RateLimiter($this->tempPath('rate-limits')),
            new ActivityLogRepository($pdo)
        );

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $result = $handler->handle([
                'username' => 'user' . $attempt,
                'email' => 'user' . $attempt . '@example.com',
                'password' => 'Password123',
                'password2' => 'Password123',
            ]);

            $this->assertTrue($result['success'], 'Expected seeded registration attempt to succeed before the IP limit is reached.');
        }

        $blocked = $handler->handle([
            'username' => 'user6',
            'email' => 'user6@example.com',
            'password' => 'Password123',
            'password2' => 'Password123',
        ]);

        $this->assertFalse($blocked['success']);
        $this->assertSame('Too many registration attempts. Please wait before trying again.', $blocked['message']);
        $this->assertSame(429, $blocked['status']);
        $this->assertSame(5, (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn());
    }

    private function createSchema(\PDO $pdo): void
    {
        $pdo->exec('CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )');

        $pdo->exec('CREATE TABLE activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            target_type TEXT NULL,
            target_id INTEGER NULL,
            details TEXT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )');
    }
}
