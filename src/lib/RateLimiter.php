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
        return $this->withLock($key, $windowSeconds, static function (array &$attempts, int $now) use ($maxAttempts, $windowSeconds) {
            if (count($attempts) < $maxAttempts) {
                return ['allowed' => true, 'retry_after' => 0];
            }

            $oldestAttempt = min($attempts);

            return [
                'allowed' => false,
                'retry_after' => max(1, ($oldestAttempt + $windowSeconds) - $now),
            ];
        });
    }

    public function hit(string $key, int $windowSeconds): void
    {
        $this->withLock($key, $windowSeconds, static function (array &$attempts, int $now) {
            $attempts[] = $now;
            return null;
        });
    }

    /**
     * Atomically check the current window and record the attempt if allowed.
     *
     * @return array{allowed:bool,retry_after:int}
     */
    public function consume(string $key, int $maxAttempts, int $windowSeconds): array
    {
        return $this->withLock($key, $windowSeconds, static function (array &$attempts, int $now) use ($maxAttempts, $windowSeconds) {
            if (count($attempts) >= $maxAttempts) {
                $oldestAttempt = min($attempts);

                return [
                    'allowed' => false,
                    'retry_after' => max(1, ($oldestAttempt + $windowSeconds) - $now),
                ];
            }

            $attempts[] = $now;

            return ['allowed' => true, 'retry_after' => 0];
        });
    }

    public function clear(string $key): void
    {
        $this->withLock($key, null, static function (array &$attempts, int $now) {
            $attempts = [];
            return null;
        });
    }

    private function pathFor(string $key): string
    {
        return $this->storagePath . '/' . hash('sha256', $key) . '.json';
    }

    /**
     * @template T
     * @param callable(array<int, int>&, int):T $callback
     * @return T
     */
    private function withLock(string $key, ?int $windowSeconds, callable $callback)
    {
        $path = $this->pathFor($key);
        $handle = fopen($path, 'c+');

        if ($handle === false) {
            throw new \RuntimeException('Unable to open rate limit storage for key.');
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                throw new \RuntimeException('Unable to lock rate limit storage for key.');
            }

            $attempts = $this->loadAttempts($handle);
            $now = time();

            if ($windowSeconds !== null) {
                $attempts = $this->pruneAttempts($attempts, $now, $windowSeconds);
            }

            $result = $callback($attempts, $now);
            $this->writeAttempts($handle, $attempts);

            flock($handle, LOCK_UN);

            return $result;
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param array<int, int> $attempts
     */
    private function writeAttempts($handle, array $attempts): void
    {
        rewind($handle);
        ftruncate($handle, 0);
        fwrite($handle, json_encode(['attempts' => array_values($attempts)], JSON_THROW_ON_ERROR));
        fflush($handle);
    }

    /**
     * @return array<int, int>
     */
    private function loadAttempts($handle): array
    {
        rewind($handle);
        $contents = stream_get_contents($handle);

        if (!is_string($contents) || trim($contents) === '') {
            return [];
        }

        $decoded = json_decode($contents, true);
        if (!is_array($decoded)) {
            return [];
        }

        $attempts = $decoded['attempts'] ?? [];

        return array_values(array_filter(
            is_array($attempts) ? $attempts : [],
            static fn ($timestamp): bool => is_int($timestamp)
        ));
    }

    /**
     * @param array<int, int> $attempts
     * @return array<int, int>
     */
    private function pruneAttempts(array $attempts, int $now, int $windowSeconds): array
    {
        return array_values(array_filter(
            $attempts,
            static fn (int $timestamp): bool => $timestamp > ($now - $windowSeconds)
        ));
    }
}
