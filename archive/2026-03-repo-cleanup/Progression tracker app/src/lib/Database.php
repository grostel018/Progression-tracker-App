<?php

namespace src\lib;

use PDO;
use PDOException;

/**
 * Database Connection Class
 * Singleton pattern for PDO connection
 */
class Database
{
    private static ?PDO $instance = null;
    private array $config;

    private function __construct(array $config)
    {
        $this->config = $config;
    }

    public static function init(array $config): void
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                $config['host'],
                $config['dbname'],
                $config['charset'] ?? 'utf8mb4'
            );

            self::$instance = new PDO($dsn, $config['user'], $config['pass'], $config['options'] ?? []);
            self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        }
    }

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            throw new PDOException('Database not initialized. Call Database::init() first.');
        }
        return self::$instance;
    }

    public static function reset(): void
    {
        self::$instance = null;
    }

    // Prevent cloning
    private function __clone() {}

    // Prevent unserialization
    public function __wakeup()
    {
        throw new PDOException('Cannot unserialize singleton');
    }
}
