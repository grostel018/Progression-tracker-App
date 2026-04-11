<?php

declare(strict_types=1);

$basePath = dirname(__DIR__);
$sourceRoot = $basePath . '/src/assets';
$targetRoot = $basePath . '/public/assets';
$arguments = $argv ?? [];
$checkOnly = in_array('--check', $arguments, true);

if (!is_dir($sourceRoot)) {
    fwrite(STDERR, "Source asset directory not found: {$sourceRoot}\n");
    exit(1);
}

if (!is_dir($targetRoot) && !mkdir($targetRoot, 0777, true) && !is_dir($targetRoot)) {
    fwrite(STDERR, "Failed to create target asset directory: {$targetRoot}\n");
    exit(1);
}

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($sourceRoot, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);

$copied = 0;
$skipped = 0;
$deleted = 0;
$outOfSync = [];
$sourceFiles = [];

foreach ($iterator as $item) {
    $relativePath = substr($item->getPathname(), strlen($sourceRoot) + 1);
    $targetPath = $targetRoot . DIRECTORY_SEPARATOR . $relativePath;

    if ($item->isDir()) {
        if (!is_dir($targetPath)) {
            mkdir($targetPath, 0777, true);
        }
        continue;
    }

    $targetDir = dirname($targetPath);
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    $normalizedRelativePath = str_replace('\\', '/', $relativePath);
    $sourceFiles[$normalizedRelativePath] = true;

    $shouldCopy = !is_file($targetPath) ||
        filesize($item->getPathname()) !== filesize($targetPath) ||
        md5_file($item->getPathname()) !== md5_file($targetPath);

    if ($shouldCopy) {
        if ($checkOnly) {
            $outOfSync[] = $normalizedRelativePath;
            continue;
        }

        copy($item->getPathname(), $targetPath);
        $copied++;
        echo "Copied: {$relativePath}\n";
        continue;
    }

    $skipped++;
}

$targetIterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($targetRoot, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::CHILD_FIRST
);

foreach ($targetIterator as $item) {
    $relativePath = substr($item->getPathname(), strlen($targetRoot) + 1);
    $normalizedRelativePath = str_replace('\\', '/', $relativePath);
    $sourcePath = $sourceRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalizedRelativePath);

    if ($item->isFile() && !isset($sourceFiles[$normalizedRelativePath])) {
        if ($checkOnly) {
            $outOfSync[] = $normalizedRelativePath;
            continue;
        }

        unlink($item->getPathname());
        $deleted++;
        echo "Deleted stale asset: {$relativePath}\n";
        continue;
    }

    if ($item->isDir() && !is_dir($sourcePath)) {
        if ($checkOnly) {
            continue;
        }

        @rmdir($item->getPathname());
    }
}

if ($checkOnly) {
    $outOfSync = array_values(array_unique($outOfSync));
    sort($outOfSync);

    if ($outOfSync !== []) {
        foreach ($outOfSync as $path) {
            fwrite(STDERR, "Out of sync: {$path}\n");
        }

        fwrite(STDERR, sprintf("Asset check failed. %d file(s) need syncing.\n", count($outOfSync)));
        exit(1);
    }

    echo "Asset check passed. public/assets is in sync with src/assets.\n";
    exit(0);
}

echo "Asset sync complete. Copied {$copied} file(s), deleted {$deleted} stale file(s), skipped {$skipped} unchanged file(s).\n";
