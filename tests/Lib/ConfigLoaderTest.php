<?php

declare(strict_types=1);

namespace tests\Lib;

use src\lib\ConfigLoader;
use tests\TestCase;

final class ConfigLoaderTest extends TestCase
{
    public function testLoadsBaseConfigWhenNoLocalOverrideExists(): void
    {
        $configDir = $this->makeConfigDir([
            'database.php' => <<<'PHP'
<?php
return ['host' => 'localhost', 'port' => 3306];
PHP,
        ]);

        $loaded = ConfigLoader::loadDirectory($configDir, ['database']);

        $this->assertSame('localhost', $loaded['database']['host']);
        $this->assertSame(3306, $loaded['database']['port']);
    }

    public function testLocalOverrideReplacesNestedValuesRecursively(): void
    {
        $configDir = $this->makeConfigDir([
            'app.php' => <<<'PHP'
<?php
return [
    'app_url' => 'http://localhost',
    'session' => [
        'secure' => 'auto',
        'samesite' => 'Lax',
    ],
];
PHP,
            'app.local.php' => <<<'PHP'
<?php
return [
    'app_url' => 'http://localhost:8080',
    'session' => [
        'secure' => true,
    ],
];
PHP,
        ]);

        $loaded = ConfigLoader::loadDirectory($configDir, ['app']);

        $this->assertSame('http://localhost:8080', $loaded['app']['app_url']);
        $this->assertTrue($loaded['app']['session']['secure']);
        $this->assertSame('Lax', $loaded['app']['session']['samesite']);
    }

    /**
     * @param array<string, string> $files
     */
    private function makeConfigDir(array $files): string
    {
        $configDir = $this->tempPath('config-' . bin2hex(random_bytes(4)));

        if (!is_dir($configDir) && !mkdir($configDir, 0775, true) && !is_dir($configDir)) {
            $this->fail('Unable to create config dir: ' . $configDir);
        }

        foreach ($files as $name => $contents) {
            file_put_contents($configDir . DIRECTORY_SEPARATOR . $name, $contents);
        }

        return $configDir;
    }
}
