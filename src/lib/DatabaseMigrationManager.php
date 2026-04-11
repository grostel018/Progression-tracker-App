<?php

declare(strict_types=1);

namespace src\lib;

use PDO;
use RuntimeException;
use Throwable;

final class DatabaseMigrationManager
{
    private PDO $db;
    private string $migrationPath;

    public function __construct(PDO $db, string $migrationPath)
    {
        $this->db = $db;
        $this->migrationPath = rtrim(str_replace('\\', '/', $migrationPath), '/');
    }

    public function ensureMigrationTable(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )'
        );
    }

    /**
     * @return array<int, string>
     */
    public function discoverMigrations(): array
    {
        if (!is_dir($this->migrationPath)) {
            return [];
        }

        $files = glob($this->migrationPath . '/*.sql');
        if ($files === false) {
            return [];
        }

        $migrations = array_map(static fn (string $path): string => basename($path), $files);
        sort($migrations);

        return $migrations;
    }

    /**
     * @return array<int, string>
     */
    public function appliedMigrations(): array
    {
        $this->ensureMigrationTable();

        $statement = $this->db->query('SELECT filename FROM schema_migrations ORDER BY filename ASC');
        $rows = $statement ? $statement->fetchAll(PDO::FETCH_COLUMN) : [];

        return array_values(array_map(static fn ($value): string => (string) $value, is_array($rows) ? $rows : []));
    }

    /**
     * @return array<int, string>
     */
    public function pendingMigrations(): array
    {
        $applied = array_flip($this->appliedMigrations());

        return array_values(array_filter(
            $this->discoverMigrations(),
            static fn (string $filename): bool => !isset($applied[$filename])
        ));
    }

    /**
     * @return array{applied:array<int, string>, skipped:array<int, string>}
     */
    public function applyPending(): array
    {
        $applied = [];

        foreach ($this->pendingMigrations() as $filename) {
            $this->applyMigration($filename);
            $applied[] = $filename;
        }

        return [
            'applied' => $applied,
            'skipped' => [],
        ];
    }

    public function baselineCurrent(): int
    {
        $count = 0;

        foreach ($this->pendingMigrations() as $filename) {
            $this->markApplied($filename);
            $count++;
        }

        return $count;
    }

    public function applyMigration(string $filename): void
    {
        $this->ensureMigrationTable();

        $path = $this->migrationPath . '/' . $filename;
        if (!is_file($path)) {
            throw new RuntimeException('Migration file not found: ' . $filename);
        }

        $statements = $this->parseStatements((string) file_get_contents($path));

        try {
            $this->db->beginTransaction();

            foreach ($statements as $statement) {
                $trimmed = trim($statement);

                if ($trimmed === '' || preg_match('/^USE\s+/i', $trimmed)) {
                    continue;
                }

                $this->db->exec($trimmed);
            }

            $this->markApplied($filename);

            if ($this->db->inTransaction()) {
                $this->db->commit();
            }
        } catch (Throwable $throwable) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $throwable;
        }
    }

    private function markApplied(string $filename): void
    {
        $statement = $this->db->prepare('SELECT COUNT(*) FROM schema_migrations WHERE filename = ?');
        $statement->execute([$filename]);

        if ((int) $statement->fetchColumn() > 0) {
            return;
        }

        $insert = $this->db->prepare('INSERT INTO schema_migrations (filename) VALUES (?)');
        $insert->execute([$filename]);
    }

    /**
     * @return array<int, string>
     */
    private function parseStatements(string $sql): array
    {
        $lines = preg_split('/\R/', $sql) ?: [];
        $statements = [];
        $buffer = '';

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if ($trimmed === '' || str_starts_with($trimmed, '--')) {
                continue;
            }

            $buffer .= ($buffer === '' ? '' : PHP_EOL) . $line;

            if (str_ends_with(rtrim($line), ';')) {
                $statements[] = $buffer;
                $buffer = '';
            }
        }

        if (trim($buffer) !== '') {
            $statements[] = $buffer;
        }

        return $statements;
    }
}
