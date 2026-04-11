<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';

use src\lib\DatabaseMigrationManager;

boot_database();

$manager = new DatabaseMigrationManager(
    \src\lib\Database::getConnection(),
    BASE_PATH . '/DB/migrations'
);

$command = strtolower((string) ($argv[1] ?? 'status'));

switch ($command) {
    case 'status':
        $applied = $manager->appliedMigrations();
        $pending = $manager->pendingMigrations();

        echo 'Applied migrations: ' . count($applied) . PHP_EOL;
        foreach ($applied as $filename) {
            echo '  [x] ' . $filename . PHP_EOL;
        }

        echo 'Pending migrations: ' . count($pending) . PHP_EOL;
        foreach ($pending as $filename) {
            echo '  [ ] ' . $filename . PHP_EOL;
        }

        exit($pending === [] ? 0 : 1);

    case 'up':
        $result = $manager->applyPending();

        if ($result['applied'] === []) {
            echo 'No pending migrations.' . PHP_EOL;
            exit(0);
        }

        foreach ($result['applied'] as $filename) {
            echo 'Applied: ' . $filename . PHP_EOL;
        }

        echo 'Migration run complete.' . PHP_EOL;
        exit(0);

    case 'baseline-current':
        $count = $manager->baselineCurrent();
        echo sprintf('Baseline complete. Marked %d migration(s) as already applied.', $count) . PHP_EOL;
        exit(0);

    default:
        fwrite(STDERR, "Usage: php scripts/migrate.php [status|up|baseline-current]\n");
        exit(1);
}
