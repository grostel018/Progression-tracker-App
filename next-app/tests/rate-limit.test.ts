import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

type RateLimitModule = typeof import("@/lib/security/rate-limit");

async function loadRateLimitModule(): Promise<RateLimitModule> {
  return import("@/lib/security/rate-limit");
}

function jsonResponse(result: unknown): Response {
  return new Response(JSON.stringify({ result }), {
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("auth rate limiting", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env = { ...originalEnv, RATE_LIMIT_DRIVER: "memory" };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("blocks sign-up after the configured threshold", async () => {
    const { consumeRateLimit, resetRateLimitStore } = await loadRateLimitModule();
    resetRateLimitStore();

    for (let index = 0; index < 5; index += 1) {
      expect((await consumeRateLimit("sign-up", "127.0.0.1")).success).toBe(true);
    }

    const blocked = await consumeRateLimit("sign-up", "127.0.0.1");

    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("blocks resend verification after the configured threshold", async () => {
    const { consumeRateLimit, resetRateLimitStore } = await loadRateLimitModule();
    resetRateLimitStore();

    for (let index = 0; index < 5; index += 1) {
      expect((await consumeRateLimit("resend-verification", "127.0.0.1")).success).toBe(true);
    }

    expect((await consumeRateLimit("resend-verification", "127.0.0.1")).success).toBe(false);
  });

  it("blocks email verification after the configured threshold", async () => {
    const { consumeRateLimit, resetRateLimitStore } = await loadRateLimitModule();
    resetRateLimitStore();

    for (let index = 0; index < 8; index += 1) {
      expect((await consumeRateLimit("verify-email", "127.0.0.1:test@example.com")).success).toBe(true);
    }

    const blocked = await consumeRateLimit("verify-email", "127.0.0.1:test@example.com");

    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses the Upstash driver when configured", async () => {
    process.env.RATE_LIMIT_DRIVER = "upstash";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const remoteStore = new Map<string, { count: number; ttl: number }>();
    const fetchMock = vi.fn(async (input: string | URL | RequestInfo) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const { pathname } = new URL(url);
      const segments = pathname.split("/").filter(Boolean);
      const command = segments[0];
      const key = decodeURIComponent(segments[1] ?? "");
      const entry = remoteStore.get(key) ?? { count: 0, ttl: -1 };

      if (command === "incr") {
        entry.count += 1;
        remoteStore.set(key, entry);
        return jsonResponse(entry.count);
      }

      if (command === "pexpire") {
        entry.ttl = Number(segments[2] ?? "0");
        remoteStore.set(key, entry);
        return jsonResponse(1);
      }

      if (command === "pttl") {
        return jsonResponse(entry.ttl);
      }

      return new Response(JSON.stringify({ error: `Unknown command: ${command}` }), {
        status: 400,
        headers: {
          "content-type": "application/json"
        }
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { consumeRateLimit, resetRateLimitStore } = await loadRateLimitModule();
    resetRateLimitStore();

    for (let index = 0; index < 5; index += 1) {
      expect((await consumeRateLimit("sign-up", "127.0.0.1")).success).toBe(true);
    }

    const blocked = await consumeRateLimit("sign-up", "127.0.0.1");

    expect(blocked.success).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("falls back to the memory driver when Upstash is misconfigured", async () => {
    process.env.RATE_LIMIT_DRIVER = "upstash";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { consumeRateLimit, resetRateLimitStore } = await loadRateLimitModule();
    resetRateLimitStore();

    for (let index = 0; index < 5; index += 1) {
      expect((await consumeRateLimit("sign-up", "127.0.0.1")).success).toBe(true);
    }

    const blocked = await consumeRateLimit("sign-up", "127.0.0.1");

    expect(blocked.success).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
