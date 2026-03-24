<?php

declare(strict_types=1);

$basePath = dirname(__DIR__);
$sourceRoot = $basePath . '/src/assets';
$targetRoot = $basePath . '/public/assets';

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

    $shouldCopy = !is_file($targetPath) ||
        filesize($item->getPathname()) !== filesize($targetPath) ||
        md5_file($item->getPathname()) !== md5_file($targetPath);

    if ($shouldCopy) {
        copy($item->getPathname(), $targetPath);
        $copied++;
        echo "Copied: {$relativePath}\n";
        continue;
    }

    $skipped++;
}

echo "Asset sync complete. Copied {$copied} file(s), skipped {$skipped} unchanged file(s).\n";
