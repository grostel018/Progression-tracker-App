import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const reminderDispatchSecret = process.env.REMINDER_DISPATCH_SECRET ?? "playwright-reminder-secret";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: {
    command: "npm run dev -- --hostname localhost --port 3000",
    url: baseURL,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
    env: {
      ...process.env,
      APP_URL: baseURL,
      NEXTAUTH_URL: baseURL,
      REMINDER_DISPATCH_SECRET: reminderDispatchSecret
    }
  }
});
