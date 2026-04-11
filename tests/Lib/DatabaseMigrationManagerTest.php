<?php

declare(strict_types=1);

namespace tests\Lib;

use src\lib\DatabaseMigrationManager;
use tests\TestCase;

final class DatabaseMigrationManagerTest extends TestCase
{
    public function testBaselineCurrentMarksExistingMigrationFilesWithoutExecutingThem(): void
    {
        $pdo = $this->makeSqliteConnection();
        $migrationDir = $this->tempPath('migrations');
        mkdir($migrationDir, 0775, true);

        file_put_contents($migrationDir . '/20260324_first.sql', "CREATE TABLE first_table (id INTEGER PRIMARY KEY);\n");
        file_put_contents($migrationDir . '/20260325_second.sql', "CREATE TABLE second_table (id INTEGER PRIMARY KEY);\n");

        $manager = new DatabaseMigrationManager($pdo, $migrationDir);
        $count = $manager->baselineCurrent();

        $this->assertSame(2, $count);
        $this->assertSame([], $manager->pendingMigrations());
        $this->assertSame(0, (int) $pdo->query("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'first_table'")->fetchColumn());
    }

    public function testApplyPendingExecutesStatementsAndSkipsUseDirective(): void
    {
        $pdo = $this->makeSqliteConnection();
        $migrationDir = $this->tempPath('migrations');
        mkdir($migrationDir, 0775, true);

        file_put_contents($migrationDir . '/20260329_feature.sql', implode(PHP_EOL, [
            'USE progression_tracker;',
            '-- comment line',
            'CREATE TABLE sample_table (id INTEGER PRIMARY KEY, name TEXT);',
        ]));

        $manager = new DatabaseMigrationManager($pdo, $migrationDir);
        $result = $manager->applyPending();

        $this->assertSame(['20260329_feature.sql'], $result['applied']);
        $this->assertSame(1, (int) $pdo->query("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'sample_table'")->fetchColumn());
        $this->assertSame([], $manager->pendingMigrations());
    }
}
