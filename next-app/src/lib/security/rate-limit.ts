import { headers } from "next/headers";

type RateLimitScope = "sign-in" | "sign-up" | "forgot-password" | "resend-verification" | "verify-email";
type HeadersLike = Pick<Headers, "get"> | Record<string, string | string[] | undefined>;

type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

type UpstashConfig = {
  restToken: string;
  restUrl: string;
};

type UpstashResponse<T> = {
  error?: string;
  result?: T;
};

declare global {
  var __progressionRateLimitStore: Map<string, RateLimitEntry> | undefined;
  var __progressionRateLimitWarningShown: boolean | undefined;
}

const AUTH_RATE_LIMIT_POLICIES: Record<RateLimitScope, RateLimitPolicy> = {
  "sign-in": { limit: 10, windowMs: 15 * 60 * 1000 },
  "sign-up": { limit: 5, windowMs: 60 * 60 * 1000 },
  "forgot-password": { limit: 5, windowMs: 60 * 60 * 1000 },
  "resend-verification": { limit: 5, windowMs: 30 * 60 * 1000 },
  "verify-email": { limit: 8, windowMs: 15 * 60 * 1000 }
};

function getStore(): Map<string, RateLimitEntry> {
  if (!globalThis.__progressionRateLimitStore) {
    globalThis.__progressionRateLimitStore = new Map<string, RateLimitEntry>();
  }

  return globalThis.__progressionRateLimitStore;
}

function cleanIdentifier(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isHeaderAccessor(value: HeadersLike): value is Pick<Headers, "get"> {
  return typeof (value as Pick<Headers, "get">).get === "function";
}

function warnRateLimitFallback(message: string): void {
  if (globalThis.__progressionRateLimitWarningShown) {
    return;
  }

  globalThis.__progressionRateLimitWarningShown = true;
  console.warn(message);
}

function readRateLimitDriver(): string {
  const value = cleanIdentifier(process.env.RATE_LIMIT_DRIVER);
  return value ?? "memory";
}

function getUpstashConfig(): UpstashConfig | null {
  if (readRateLimitDriver() !== "upstash") {
    return null;
  }

  const restUrl = cleanIdentifier(process.env.UPSTASH_REDIS_REST_URL);
  const restToken = cleanIdentifier(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!restUrl || !restToken) {
    warnRateLimitFallback("RATE_LIMIT_DRIVER is set to upstash, but the Upstash Redis credentials are missing. Falling back to the in-memory rate limiter.");
    return null;
  }

  return {
    restToken,
    restUrl: restUrl.replace(/\/+$/, "")
  };
}

export function extractHeaderValue(headersLike: HeadersLike, name: string): string | null {
  if (isHeaderAccessor(headersLike)) {
    return cleanIdentifier(headersLike.get(name));
  }

  const candidate = headersLike[name] ?? headersLike[name.toLowerCase()] ?? headersLike[name.toUpperCase()];

  if (Array.isArray(candidate)) {
    return cleanIdentifier(candidate[0]);
  }

  return cleanIdentifier(candidate ?? null);
}

export function buildCompositeRateLimitIdentifier(input: {
  headersLike?: HeadersLike;
  values?: Array<string | null | undefined>;
  fallback?: string;
} = {}): string {
  const { headersLike = headers(), values = [], fallback = "anonymous" } = input;
  const forwarded = extractHeaderValue(headersLike, "x-forwarded-for");
  const realIp = extractHeaderValue(headersLike, "x-real-ip");
  const identifier = forwarded?.split(",")[0]?.trim() || realIp;
  const parts = [cleanIdentifier(identifier), ...values.map((value) => cleanIdentifier(value))].filter(
    (value): value is string => Boolean(value)
  );

  return parts.join(":") || fallback;
}

export function getRequestRateLimitIdentifier(fallback = "anonymous"): string {
  try {
    return buildCompositeRateLimitIdentifier({
      fallback
    });
  } catch {
    return fallback;
  }
}

function consumeMemoryRateLimit(scope: RateLimitScope, identifier: string): RateLimitResult {
  const policy = AUTH_RATE_LIMIT_POLICIES[scope];
  const store = getStore();
  const key = `${scope}:${identifier}`;
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + policy.windowMs
    });

    return {
      success: true,
      limit: policy.limit,
      remaining: policy.limit - 1,
      retryAfterSeconds: Math.ceil(policy.windowMs / 1000)
    };
  }

  if (existing.count >= policy.limit) {
    return {
      success: false,
      limit: policy.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    success: true,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
  };
}

async function callUpstashCommand<T>(config: UpstashConfig, path: string, method: "GET" | "POST" = "POST"): Promise<T> {
  const response = await fetch(`${config.restUrl}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.restToken}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`UPSTASH_HTTP_${response.status}`);
  }

  const payload = (await response.json()) as UpstashResponse<T>;

  if (payload.error) {
    throw new Error(payload.error);
  }

  if (typeof payload.result === "undefined") {
    throw new Error("UPSTASH_EMPTY_RESULT");
  }

  return payload.result;
}

function getUpstashKey(scope: RateLimitScope, identifier: string): string {
  return encodeURIComponent(`progression-tracker:rate-limit:${scope}:${identifier}`);
}

async function consumeUpstashRateLimit(scope: RateLimitScope, identifier: string, config: UpstashConfig): Promise<RateLimitResult> {
  const policy = AUTH_RATE_LIMIT_POLICIES[scope];
  const key = getUpstashKey(scope, identifier);
  const count = await callUpstashCommand<number>(config, `incr/${key}`);

  if (count === 1) {
    await callUpstashCommand<number>(config, `pexpire/${key}/${policy.windowMs}`);
  }

  let ttl = await callUpstashCommand<number>(config, `pttl/${key}`, "GET");

  if (ttl < 0) {
    await callUpstashCommand<number>(config, `pexpire/${key}/${policy.windowMs}`);
    ttl = policy.windowMs;
  }

  if (count > policy.limit) {
    return {
      success: false,
      limit: policy.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000))
    };
  }

  return {
    success: true,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000))
  };
}

export async function consumeRateLimit(scope: RateLimitScope, identifier: string): Promise<RateLimitResult> {
  const upstashConfig = getUpstashConfig();

  if (!upstashConfig) {
    return consumeMemoryRateLimit(scope, identifier);
  }

  try {
    return await consumeUpstashRateLimit(scope, identifier, upstashConfig);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    warnRateLimitFallback(`Upstash rate limiting failed (${reason}). Falling back to the in-memory rate limiter.`);
    return consumeMemoryRateLimit(scope, identifier);
  }
}

export async function consumeAuthRateLimit(scope: RateLimitScope, identifier?: string): Promise<RateLimitResult> {
  return consumeRateLimit(scope, identifier ?? getRequestRateLimitIdentifier(scope));
}

export function resetRateLimitStore(): void {
  getStore().clear();
  globalThis.__progressionRateLimitWarningShown = false;
}
