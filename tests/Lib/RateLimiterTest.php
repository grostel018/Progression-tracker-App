<?php

declare(strict_types=1);

namespace tests\Lib;

use src\lib\RateLimiter;
use tests\TestCase;

final class RateLimiterTest extends TestCase
{
    public function testRateLimiterConsumeBlocksAfterMaxAttemptsAndClears(): void
    {
        $rateLimiter = new RateLimiter($this->tempPath('rate-limits'));
        $key = 'auth:login:test';

        $firstAttempt = $rateLimiter->consume($key, 2, 60);
        $this->assertTrue($firstAttempt['allowed']);

        $secondAttempt = $rateLimiter->consume($key, 2, 60);
        $this->assertTrue($secondAttempt['allowed']);

        $blockedCheck = $rateLimiter->consume($key, 2, 60);
        $this->assertFalse($blockedCheck['allowed']);
        $this->assertTrue($blockedCheck['retry_after'] > 0);

        $rateLimiter->clear($key);

        $clearedCheck = $rateLimiter->check($key, 2, 60);
        $this->assertTrue($clearedCheck['allowed']);
        $this->assertSame(0, $clearedCheck['retry_after']);
    }
}
