import "server-only";

import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim() === "" ? undefined : value;
}, z.string().min(1).optional());

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim() === "" ? undefined : value;
}, z.string().email().optional());

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: optionalString.pipe(z.string().url().optional()),
  NEXTAUTH_URL: optionalString.pipe(z.string().url().optional()),
  DATABASE_URL: optionalString,
  AUTH_SECRET: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  EMAIL_FROM: optionalEmail,
  EMAIL_SERVER_HOST: optionalString,
  EMAIL_SERVER_PORT: optionalString,
  EMAIL_SERVER_USER: optionalString,
  EMAIL_SERVER_PASSWORD: optionalString,
  STORAGE_DRIVER: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["local", "cloud"]).default("local")),
  S3_BUCKET: optionalString,
  S3_REGION: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  ANALYTICS_ENABLED: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["true", "false"]).default("false")),
  SENTRY_DSN: optionalString,
  NEXT_PUBLIC_SENTRY_DSN: optionalString,
  UPSTASH_REDIS_REST_URL: optionalString,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  RATE_LIMIT_DRIVER: z.preprocess((value) => (value === "" ? undefined : value), z.enum(["memory", "upstash"]).default("memory")),
  REMINDER_DISPATCH_SECRET: optionalString,
  CRON_SECRET: optionalString
});

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1)
});

const authEnvSchema = z.object({
  APP_URL: z.string().url(),
  NEXTAUTH_URL: optionalString.pipe(z.string().url().optional()),
  AUTH_SECRET: z.string().min(1)
});

const reminderDispatchEnvSchema = z.object({
  REMINDER_DISPATCH_SECRET: z.string().min(1)
});

export type ServerEnv = z.infer<typeof baseEnvSchema>;

let cachedEnv: ServerEnv | null = null;

function readRawEnv(): Record<string, string | undefined> {
  return {
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    STORAGE_DRIVER: process.env.STORAGE_DRIVER,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    ANALYTICS_ENABLED: process.env.ANALYTICS_ENABLED,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    RATE_LIMIT_DRIVER: process.env.RATE_LIMIT_DRIVER,
    REMINDER_DISPATCH_SECRET: process.env.REMINDER_DISPATCH_SECRET,
    CRON_SECRET: process.env.CRON_SECRET
  };
}

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = baseEnvSchema.parse(readRawEnv());
  return cachedEnv;
}

export function getDatabaseEnv(): z.infer<typeof databaseEnvSchema> {
  return databaseEnvSchema.parse(readRawEnv());
}

export function getAuthEnv(): z.infer<typeof authEnvSchema> {
  return authEnvSchema.parse(readRawEnv());
}

export function getReminderDispatchEnv(): z.infer<typeof reminderDispatchEnvSchema> {
  return reminderDispatchEnvSchema.parse(readRawEnv());
}
