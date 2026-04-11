<?php

declare(strict_types=1);

namespace src\lib;

use InvalidArgumentException;

final class ConfigLoader
{
    /**
     * @param string[] $configNames
     * @return array<string, array<mixed>>
     */
    public static function loadDirectory(string $configDir, array $configNames): array
    {
        $loaded = [];

        foreach ($configNames as $configName) {
            $loaded[$configName] = self::loadConfigGroup($configDir, $configName);
        }

        return $loaded;
    }

    /**
     * @return array<mixed>
     */
    public static function loadConfigGroup(string $configDir, string $configName): array
    {
        $normalizedDir = rtrim($configDir, '/\\') . DIRECTORY_SEPARATOR;
        $basePath = $normalizedDir . $configName . '.php';
        $localPath = $normalizedDir . $configName . '.local.php';

        $config = [];

        if (is_file($basePath)) {
            $config = self::readConfigFile($basePath);
        }

        if (is_file($localPath)) {
            $config = array_replace_recursive($config, self::readConfigFile($localPath));
        }

        return $config;
    }

    /**
     * @return array<mixed>
     */
    private static function readConfigFile(string $path): array
    {
        $config = require $path;

        if (!is_array($config)) {
            throw new InvalidArgumentException(sprintf('Config file must return an array: %s', $path));
        }

        return $config;
    }
}
