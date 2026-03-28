<?php

declare(strict_types=1);

namespace src\lib;

final class RateLimiter
{
    private string $storagePath;

    public function __construct(?string $storagePath = null)
    {
        $this->storagePath = $storagePath ?? BASE_PATH . '/var/rate-limits';

        if (!is_dir($this->storagePath)) {
            mkdir($this->storagePath, 0775, true);
        }
    }

    /**
     * @return array{allowed:bool,retry_after:int}
     */
    public function check(string $key, int $maxAttempts, int $windowSeconds): array
    {
        $record = $this->load($key);
        $now = time();
        $attempts = array_values(array_filter(
            $record['attempts'] ?? [],
            static fn (int $timestamp): bool => $timestamp > ($now - $windowSeconds)
        ));

        $this->save($key, $attempts);

        if (count($attempts) < $maxAttempts) {
            return ['allowed' => true, 'retry_after' => 0];
        }

        $oldestAttempt = min($attempts);

        return [
            'allowed' => false,
            'retry_after' => max(1, ($oldestAttempt + $windowSeconds) - $now),
        ];
    }

    public function hit(string $key, int $windowSeconds): void
    {
        $record = $this->load($key);
        $now = time();
        $attempts = array_values(array_filter(
            $record['attempts'] ?? [],
            static fn (int $timestamp): bool => $timestamp > ($now - $windowSeconds)
        ));

        $attempts[] = $now;
        $this->save($key, $attempts);
    }

    public function clear(string $key): void
    {
        $path = $this->pathFor($key);

        if (is_file($path)) {
            unlink($path);
        }
    }

    private function pathFor(string $key): string
    {
        return $this->storagePath . '/' . hash('sha256', $key) . '.json';
    }

    /**
     * @return array{attempts:array<int, int>}
     */
    private function load(string $key): array
    {
        $path = $this->pathFor($key);

        if (!is_file($path)) {
            return ['attempts' => []];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        if (!is_array($decoded)) {
            return ['attempts' => []];
        }

        $attempts = $decoded['attempts'] ?? [];

        return [
            'attempts' => array_values(array_filter(
                is_array($attempts) ? $attempts : [],
                static fn ($timestamp): bool => is_int($timestamp)
            )),
        ];
    }

    /**
     * @param array<int, int> $attempts
     */
    private function save(string $key, array $attempts): void
    {
        $path = $this->pathFor($key);
        file_put_contents($path, json_encode(['attempts' => array_values($attempts)], JSON_THROW_ON_ERROR), LOCK_EX);
    }
}
