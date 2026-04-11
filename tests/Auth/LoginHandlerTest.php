<?php

declare(strict_types=1);

namespace tests\Auth;

use src\api\auth\AuthInputValidator;
use src\api\auth\LoginHandler;
use src\api\logs\ActivityLogRepository;
use src\lib\Auth;
use src\lib\RateLimiter;
use tests\TestCase;

final class LoginHandlerTest extends TestCase
{
    public function testHandleLogsInValidUserAndWritesActivity(): void
    {
        $pdo = $this->makeSqliteConnection();
        $this->createSchema($pdo);

        $password = 'Password123';
        $hash = password_hash($password, PASSWORD_BCRYPT);

        $statement = $pdo->prepare('INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)');
        $statement->execute(['rostel', 'rostel@example.com', $hash, '2026-03-29 00:00:00']);

        $handler = new LoginHandler(
            $pdo,
            new Auth($pdo, config('app')),
            new AuthInputValidator(config('app')),
            new RateLimiter($this->tempPath('rate-limits')),
            new ActivityLogRepository($pdo)
        );

        $result = $handler->handle([
            'email' => 'rostel@example.com',
            'password' => $password,
        ]);

        $this->assertTrue($result['success']);
        $this->assertSame('Login successful', $result['message']);
        $this->assertSame(1, $_SESSION['user_id'] ?? null);
        $this->assertSame(1, (int) $pdo->query('SELECT COUNT(*) FROM activity_logs WHERE action = "login"')->fetchColumn());
    }

    public function testHandleReturnsValidationErrorsBeforeQueryingDatabase(): void
    {
        $pdo = $this->makeSqliteConnection();
        $this->createSchema($pdo);

        $handler = new LoginHandler(
            $pdo,
            new Auth($pdo, config('app')),
            new AuthInputValidator(config('app')),
            new RateLimiter($this->tempPath('rate-limits')),
            new ActivityLogRepository($pdo)
        );

        $result = $handler->handle([
            'email' => 'not-an-email',
            'password' => '',
        ]);

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('errors', $result);
        $this->assertArrayHasKey('email', $result['errors']);
        $this->assertArrayHasKey('password', $result['errors']);
        $this->assertNull($_SESSION['user_id'] ?? null);
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
