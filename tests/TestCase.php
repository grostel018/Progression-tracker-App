<?php

declare(strict_types=1);

namespace tests;

use PDO;
use RuntimeException;
use Throwable;

abstract class TestCase
{
    private string $tempPath;

    protected function setUp(): void
    {
        $this->tempPath = BASE_PATH . '/var/tests-runtime/' . str_replace('\\', '-', static::class) . '-' . bin2hex(random_bytes(4));

        if (!is_dir($this->tempPath) && !mkdir($concurrentDirectory = $this->tempPath, 0775, true) && !is_dir($concurrentDirectory)) {
            throw new RuntimeException('Unable to create test temp path: ' . $this->tempPath);
        }

        $this->resetSessionState();
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['HTTP_ACCEPT'] = 'application/json';
        $_SERVER['REQUEST_URI'] = '/tests';
    }

    protected function tearDown(): void
    {
        $this->resetSessionState();
        $this->deleteDirectory($this->tempPath);
    }

    public function runTestMethod(string $method): void
    {
        $this->setUp();

        try {
            $this->{$method}();
        } finally {
            $this->tearDown();
        }
    }

    protected function tempPath(string $suffix = ''): string
    {
        if ($suffix === '') {
            return $this->tempPath;
        }

        return $this->tempPath . '/' . ltrim(str_replace('\\', '/', $suffix), '/');
    }

    protected function makeSqliteConnection(): PDO
    {
        $pdo = new PDO('sqlite::memory:');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    }

    protected function assertTrue(bool $condition, string $message = 'Expected condition to be true.'): void
    {
        if (!$condition) {
            throw new RuntimeException($message);
        }
    }

    protected function assertFalse(bool $condition, string $message = 'Expected condition to be false.'): void
    {
        $this->assertTrue(!$condition, $message);
    }

    protected function assertSame($expected, $actual, string $message = ''): void
    {
        if ($expected !== $actual) {
            throw new RuntimeException($message !== '' ? $message : sprintf('Expected %s, got %s.', var_export($expected, true), var_export($actual, true)));
        }
    }

    protected function assertNull($actual, string $message = 'Expected value to be null.'): void
    {
        if ($actual !== null) {
            throw new RuntimeException($message);
        }
    }

    protected function assertNotNull($actual, string $message = 'Expected value to not be null.'): void
    {
        if ($actual === null) {
            throw new RuntimeException($message);
        }
    }

    protected function assertArrayHasKey(string $key, array $array, string $message = ''): void
    {
        if (!array_key_exists($key, $array)) {
            throw new RuntimeException($message !== '' ? $message : sprintf('Expected array to contain key "%s".', $key));
        }
    }

    protected function fail(string $message): void
    {
        throw new RuntimeException($message);
    }

    private function resetSessionState(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
            session_unset();
            session_destroy();
            session_write_close();
        }

        $_SESSION = [];
    }

    private function deleteDirectory(string $path): void
    {
        if ($path === '' || !is_dir($path)) {
            return;
        }

        $items = scandir($path);

        if ($items === false) {
            return;
        }

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $itemPath = $path . '/' . $item;

            if (is_dir($itemPath)) {
                $this->deleteDirectory($itemPath);
                continue;
            }

            unlink($itemPath);
        }

        rmdir($path);
    }
}
