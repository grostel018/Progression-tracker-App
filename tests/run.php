<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/TestCase.php';

$testFiles = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator(__DIR__, FilesystemIterator::SKIP_DOTS)
);

foreach ($testFiles as $file) {
    if (!$file->isFile()) {
        continue;
    }

    if (!preg_match('/Test\.php$/', $file->getFilename())) {
        continue;
    }

    require_once $file->getPathname();
}

$declaredClasses = get_declared_classes();
$testClasses = array_values(array_filter($declaredClasses, static function (string $class): bool {
    return is_subclass_of($class, \tests\TestCase::class);
}));

sort($testClasses);

$passes = 0;
$failures = [];

foreach ($testClasses as $class) {
    $reflection = new ReflectionClass($class);
    $methods = array_filter(
        $reflection->getMethods(ReflectionMethod::IS_PUBLIC),
        static fn (ReflectionMethod $method): bool => str_starts_with($method->getName(), 'test')
    );

    usort($methods, static fn (ReflectionMethod $left, ReflectionMethod $right): int => strcmp($left->getName(), $right->getName()));

    foreach ($methods as $method) {
        /** @var \tests\TestCase $instance */
        $instance = $reflection->newInstance();

        try {
            $instance->runTestMethod($method->getName());
            $passes++;
            echo '.';
        } catch (Throwable $throwable) {
            $failures[] = [
                'test' => $class . '::' . $method->getName(),
                'message' => $throwable->getMessage(),
            ];
            echo 'F';
        }
    }
}

echo PHP_EOL;

if ($failures !== []) {
    foreach ($failures as $failure) {
        echo $failure['test'] . PHP_EOL;
        echo '  ' . $failure['message'] . PHP_EOL;
    }

    echo PHP_EOL . sprintf('Failed: %d, Passed: %d', count($failures), $passes) . PHP_EOL;
    exit(1);
}

echo sprintf('Passed: %d', $passes) . PHP_EOL;
