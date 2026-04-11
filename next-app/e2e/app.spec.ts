import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const outboxPath = path.join(process.cwd(), ".tmp", "outbox");
const reminderDispatchSecret = process.env.REMINDER_DISPATCH_SECRET ?? "playwright-reminder-secret";

async function resetTestState(): Promise<void> {
  await prisma.taskCompletion.deleteMany();
  await prisma.habitCompletion.deleteMany();
  await prisma.weeklyReview.deleteMany();
  await prisma.task.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.dream.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.reminderDelivery.deleteMany();
  await prisma.reminderPreference.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.onboardingPreference.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await fs.rm(outboxPath, { recursive: true, force: true });
}

async function seedCredentialUser(input: {
  email: string;
  password: string;
  username: string;
  onboardingComplete?: boolean;
  withPlannerData?: boolean;
  role?: "USER" | "TESTER" | "ADMIN";
}): Promise<void> {
  const passwordHash = await hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      name: input.username,
      passwordHash,
      role: input.role ?? "USER",
      emailVerified: new Date("2026-04-04T10:00:00.000Z"),
      profile: {
        create: {
          displayName: input.username
        }
      },
      onboardingPreference: {
        create: input.onboardingComplete
          ? {
              focusArea: "health",
              motivationStyle: "intrinsic",
              dailyCommitmentMinutes: 15,
              primaryObstacle: "consistency",
              ninetyDayVision: "Build a calmer weekly rhythm and keep momentum visible.",
              completedStepIds: ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle", "ninety-day-vision"],
              onboardingCompletedAt: new Date("2026-04-04T10:00:00.000Z")
            }
          : {}
      }
    }
  });

  if (!input.withPlannerData) {
    return;
  }

  const category = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Health",
      description: "Fitness"
    }
  });

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      categoryId: category.id,
      title: "Train twice this week",
      progressType: "TARGET_COUNT",
      targetValue: 2,
      currentValue: 1
    }
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      goalId: goal.id,
      title: "Book the first training block",
      status: "TODO",
      scheduledFor: new Date("2026-04-05T09:00:00.000Z")
    }
  });
}

async function readLatestActionUrl(email: string): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const entries = await fs.readdir(outboxPath);
      const sorted = entries.sort().reverse();

      for (const entry of sorted) {
        const filePath = path.join(outboxPath, entry);
        const payload = JSON.parse(await fs.readFile(filePath, "utf8")) as { to?: string; actionUrls?: string[] };

        if (payload.to === email && payload.actionUrls?.[0]) {
          return payload.actionUrls[0];
        }
      }
    } catch {
      // Wait for the preview email to land.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Could not find a preview email link for ${email}.`);
}

async function readLatestPreviewMessage(email: string): Promise<{ to?: string; subject?: string; text?: string; actionUrls?: string[] }> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const entries = await fs.readdir(outboxPath);
      const sorted = entries.sort().reverse();

      for (const entry of sorted) {
        const filePath = path.join(outboxPath, entry);
        const payload = JSON.parse(await fs.readFile(filePath, "utf8")) as { to?: string; subject?: string; text?: string; actionUrls?: string[] };

        if (payload.to === email) {
          return payload;
        }
      }
    } catch {
      // Wait for the preview email to land.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Could not find a preview email payload for ${email}.`);
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.locator("#signin-password").fill(password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|onboarding|first-steps)/, { timeout: 15_000 }),
    page.getByRole("button", { name: "Sign in" }).click()
  ]);
}

async function seedLocalBrowserData(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(async () => {
    const records = [
      {
        key: "pt:system:workspace-state",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          version: 1,
          initializedAt: "2026-04-04T10:00:00.000Z",
          lastAccessedAt: "2026-04-04T10:00:00.000Z",
          surfaces: {
            onboarding: "2026-04-04T10:00:00.000Z",
            dashboard: "2026-04-04T10:05:00.000Z",
            "weekly-review": "2026-04-04T10:10:00.000Z"
          },
          entityNamespaces: ["system", "onboarding", "profile", "categories", "dreams", "goals", "habits", "tasks", "habit-completions", "task-completions", "weekly-reviews", "activity"]
        }
      },
      {
        key: "pt:onboarding:answers",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          id: "default",
          version: 1,
          focusArea: "health",
          motivationStyle: "intrinsic",
          dailyCommitmentMinutes: 15,
          primaryObstacle: "consistency",
          ninetyDayVision: "Build a calmer weekly rhythm and keep momentum visible.",
          completedStepIds: ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle", "ninety-day-vision"],
          completedAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      },
      {
        key: "pt:categories:category-local-1",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          id: "category-local-1",
          name: "Health",
          description: "Fitness and recovery",
          status: "ACTIVE",
          createdAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      },
      {
        key: "pt:dreams:dream-local-1",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          id: "dream-local-1",
          categoryId: "category-local-1",
          title: "Feel stronger",
          description: "Build a durable body",
          vision: null,
          status: "ACTIVE",
          targetDate: null,
          createdAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      },
      {
        key: "pt:goals:goal-local-1",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          id: "goal-local-1",
          categoryId: "category-local-1",
          dreamId: "dream-local-1",
          title: "Train 3 times a week",
          description: null,
          status: "ACTIVE",
          progressType: "TARGET_COUNT",
          targetDate: null,
          targetValue: 12,
          currentValue: 4,
          createdAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      },
      {
        key: "pt:habits:habit-local-1",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          id: "habit-local-1",
          goalId: "goal-local-1",
          title: "Workout",
          description: null,
          status: "ACTIVE",
          frequency: "DAILY",
          customDays: null,
          createdAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      },
      {
        key: "pt:tasks:task-local-1",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          id: "task-local-1",
          goalId: "goal-local-1",
          title: "Meal prep",
          description: null,
          status: "DONE",
          scheduledFor: "2026-04-04T00:00:00.000Z",
          completedAt: "2026-04-04T18:00:00.000Z",
          createdAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T18:00:00.000Z"
        }
      },
      {
        key: "pt:habit-completions:habit-completion-local-1",
        updatedAt: "2026-04-04T18:00:00.000Z",
        value: {
          id: "habit-completion-local-1",
          habitId: "habit-local-1",
          completedFor: "2026-04-04",
          completedAt: "2026-04-04T18:00:00.000Z",
          createdAt: "2026-04-04T18:00:00.000Z"
        }
      },
      {
        key: "pt:task-completions:task-completion-local-1",
        updatedAt: "2026-04-04T18:00:00.000Z",
        value: {
          id: "task-completion-local-1",
          taskId: "task-local-1",
          completedAt: "2026-04-04T18:00:00.000Z",
          createdAt: "2026-04-04T18:00:00.000Z"
        }
      },
      {
        key: "pt:weekly-reviews:weekly-review-local-1",
        updatedAt: "2026-04-04T20:00:00.000Z",
        value: {
          id: "weekly-review-local-1",
          weekStart: "2026-03-30",
          weekEnd: "2026-04-05",
          reflection: "Strong week.",
          summarySnapshot: {
            referenceDate: "2026-04-04",
            weekStart: "2026-03-30",
            weekEnd: "2026-04-05",
            totalCompletions: 2,
            habitCompletions: 1,
            taskCompletions: 1,
            activeDays: 1,
            scheduledHabitCount: 1,
            missedHabitCount: 0,
            completedTaskCount: 1,
            openTaskCount: 0,
            openScheduledTaskCount: 0,
            currentStreakDays: 1,
            topGoalTitle: "Train 3 times a week",
            wins: ["You showed up."],
            missedAreas: []
          },
          completedAt: "2026-04-04T20:00:00.000Z",
          createdAt: "2026-04-04T20:00:00.000Z",
          updatedAt: "2026-04-04T20:00:00.000Z"
        }
      }
    ];

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("progression-tracker-local", 1);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains("records")) {
          const store = database.createObjectStore("records", { keyPath: "key" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };

      request.onerror = () => reject(request.error ?? new Error("Could not open IndexedDB."));
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("records", "readwrite");
        const store = transaction.objectStore("records");

        for (const record of records) {
          store.put(record);
        }

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error ?? new Error("Could not seed IndexedDB."));
        transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
      };
    });
  });
}

async function seedLocalOnboardingOnly(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(async () => {
    const records = [
      {
        key: "pt:system:workspace-state",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          version: 1,
          initializedAt: "2026-04-04T10:00:00.000Z",
          lastAccessedAt: "2026-04-04T10:00:00.000Z",
          surfaces: { onboarding: "2026-04-04T10:00:00.000Z" },
          entityNamespaces: ["system", "onboarding"]
        }
      },
      {
        key: "pt:onboarding:answers",
        updatedAt: "2026-04-04T10:00:00.000Z",
        value: {
          id: "default",
          version: 1,
          focusArea: "health",
          motivationStyle: "intrinsic",
          dailyCommitmentMinutes: 15,
          primaryObstacle: "consistency",
          ninetyDayVision: "Build a calmer weekly rhythm and keep momentum visible.",
          completedStepIds: ["motivation-style", "focus-area", "daily-commitment", "primary-obstacle", "ninety-day-vision"],
          completedAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T10:00:00.000Z"
        }
      }
    ];

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("progression-tracker-local", 1);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains("records")) {
          const store = database.createObjectStore("records", { keyPath: "key" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };

      request.onerror = () => reject(request.error ?? new Error("Could not open IndexedDB."));
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("records", "readwrite");
        const store = transaction.objectStore("records");

        for (const record of records) {
          store.put(record);
        }

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error ?? new Error("Could not seed IndexedDB."));
        transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
      };
    });
  });
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
  await resetTestState();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("anonymous visitors are redirected away from weekly review", async ({ page }) => {
  await page.goto("/weekly-review");

  await expect(page).toHaveURL(/\/sign-in\?returnTo=%2Fweekly-review/);
});

test("local mode can reach weekly review and settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue locally" }).click();

  await expect(page).toHaveURL(/\/onboarding\?mode=local/);
  await seedLocalBrowserData(page);

  await page.goto("/weekly-review");
  await expect(page.getByRole("heading", { name: "Weekly review is now a real product surface." })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Local workspace settings live here now." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exit local mode" }).first()).toBeVisible();
});

test("sign-up, verification, sign-in, and sign-out work through the real browser flow", async ({ page }) => {
  const email = `signup-${Date.now()}@example.com`;
  const password = "Progression123!";

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Username/).fill("browser-user");
  await page.getByLabel("Create password").fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();


  const verifyUrl = await readLatestActionUrl(email);
  await page.goto(verifyUrl);

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto("/settings");
  await expect(page.getByText(email, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/$/);
});

test("authenticated cloud users can access weekly review and settings", async ({ page }) => {
  const email = "review-user@example.com";
  const password = "Progression123!";

  await seedCredentialUser({
    email,
    password,
    username: "review-user",
    onboardingComplete: true,
    withPlannerData: true
  });

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/weekly-review");
  await expect(page).toHaveURL(/\/weekly-review/);
  await expect(page.getByRole("button", { name: "Save weekly review" })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Account, profile, appearance, reminders, and workspace controls live here now." })).toBeVisible();
});

test("settings imports local browser data into an empty cloud workspace", async ({ page }) => {
  const email = "migration-user@example.com";
  const password = "Progression123!";

  await seedCredentialUser({
    email,
    password,
    username: "migration-user",
    onboardingComplete: false
  });

  await signIn(page, email, password);
  await seedLocalBrowserData(page);

  await page.goto("/settings");
  const importButton = page.getByRole("button", { name: "Import local browser data" });
  await expect(importButton).toBeEnabled();
  await importButton.click();
  await expect(page.getByText("Local browser data was imported into your cloud workspace.")).toBeVisible();

  await page.goto("/planner");
  await expect(page.getByText("Health", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Feel stronger", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Train 3 times a week", { exact: true }).first()).toBeVisible();

  await page.goto("/weekly-review");
  await expect(page.getByText("Strong week.", { exact: true }).last()).toBeVisible();
});

test("settings blocks local import when the cloud workspace already has data", async ({ page }) => {
  const email = "migration-blocked@example.com";
  const password = "Progression123!";

  await seedCredentialUser({
    email,
    password,
    username: "blocked-user",
    onboardingComplete: true,
    withPlannerData: true
  });

  await signIn(page, email, password);
  await seedLocalBrowserData(page);

  await page.goto("/settings");
  await expect(page.getByText("This cloud workspace already has saved data, so local import is blocked to avoid merging or overwriting records.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import local browser data" })).toBeDisabled();
});



















test("cloud users with completed onboarding are redirected into first steps until they create a goal and a first action", async ({ page }) => {
  const email = "first-steps-cloud@example.com";
  const password = "Progression123!";

  await seedCredentialUser({
    email,
    password,
    username: "first-steps-cloud",
    onboardingComplete: true
  });

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/first-steps/);
  await page.getByLabel("First goal").fill("Protect my workout rhythm");
  await page.getByLabel("First habit").fill("Morning stretch");
  await page.getByRole("button", { name: "Finish first steps" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/planner");
  await expect(page.getByText("Protect my workout rhythm", { exact: true }).first()).toBeVisible();
});

test("local mode redirects into first steps once onboarding is complete but planner setup is still empty", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue locally" }).click();
  await expect(page).toHaveURL(/\/onboarding\?mode=local/);
  await seedLocalOnboardingOnly(page);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/first-steps/);
  await page.getByLabel("First goal").fill("Build a local focus ritual");
  await page.getByLabel("First habit").fill("Review tomorrow every evening");
  await page.getByRole("button", { name: "Finish first steps" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("theme preference persists across reloads", async ({ page }) => {
  const email = "theme-user@example.com";
  const password = "Progression123!";

  await seedCredentialUser({
    email,
    password,
    username: "theme-user",
    onboardingComplete: true,
    withPlannerData: true
  });

  await signIn(page, email, password);
  await page.goto("/settings");
  await page.getByLabel("Theme").selectOption("light");
  await page.getByRole("button", { name: "Save theme" }).click();
  await expect(page.getByText("Theme preference saved.")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "light");
});
test("dark theme preference persists across reloads", async ({ page }) => {
  const email = "dark-theme-user@example.com";
  const password = "Progression123!";

  await seedCredentialUser({
    email,
    password,
    username: "dark-theme-user",
    onboardingComplete: true,
    withPlannerData: true
  });

  await signIn(page, email, password);
  await page.goto("/settings");
  await page.getByLabel("Theme").selectOption("dark");
  await page.getByRole("button", { name: "Save theme" }).click();
  await expect(page.getByText("Theme preference saved.")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
});

test("reminder preferences can be saved and dispatched into the preview outbox", async ({ page, request }) => {
  const email = "reminder-user@example.com";
  const password = "Progression123!";
  const currentUtcTime = new Date().toISOString().slice(11, 16);

  await seedCredentialUser({
    email,
    password,
    username: "reminder-user",
    onboardingComplete: true,
    withPlannerData: true
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.task.create({
    data: {
      userId: user.id,
      title: "Review tomorrow's priorities",
      status: "TODO",
      scheduledFor: new Date()
    }
  });

  await signIn(page, email, password);
  await page.goto("/settings");
  await page.locator('input[name="enabled"]').check();
  await page.locator("#settings-reminder-time").fill(currentUtcTime);
  await page.locator("#settings-reminder-timezone").fill("UTC");
  await page.getByRole("button", { name: "Save reminder preferences" }).click();
  await expect(page.getByText("Reminder preferences saved.")).toBeVisible();

  const response = await request.post("/api/internal/reminders/dispatch", {
    headers: {
      "x-reminder-dispatch-secret": reminderDispatchSecret
    }
  });

  expect(response.ok()).toBe(true);

  const preview = await readLatestPreviewMessage(email);
  expect(preview.subject).toContain("daily reminder");
  expect(preview.text).toContain("Open your planner");
});

test("non-admin users are kept out of admin while admins can inspect accounts and run safe support actions", async ({ page }) => {
  const memberEmail = "member-user@example.com";
  const adminEmail = "admin-user@example.com";
  const password = "Progression123!";

  await seedCredentialUser({
    email: memberEmail,
    password,
    username: "member-user",
    onboardingComplete: true,
    withPlannerData: true
  });
  await seedCredentialUser({
    email: adminEmail,
    password,
    username: "admin-user",
    onboardingComplete: true,
    withPlannerData: true,
    role: "ADMIN"
  });

  await signIn(page, memberEmail, password);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/$/);

  await signIn(page, adminEmail, password);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "See real user, setup, planner, and reminder state in one place." })).toBeVisible();
  const memberRow = page.locator("tr").filter({ hasText: memberEmail }).first();
  await memberRow.getByRole("link", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: memberEmail })).toBeVisible();
  await page.getByRole("button", { name: "Suspend user" }).click();
  await expect(page.getByText("User suspended.")).toBeVisible();
});










test("planner quick-access links jump into the right planning lane", async ({ page }) => {
  const email = "planner-nav@example.com";
  const password = "PlannerNav123!";

  await seedCredentialUser({
    email,
    password,
    username: "planner-nav",
    onboardingComplete: true,
    withPlannerData: true
  });

  await signIn(page, email, password);
  await page.goto("/planner");

  await page.getByRole("navigation", { name: "Planner quick access" }).getByRole("link", { name: /goals/i }).click();
  await expect(page).toHaveURL(/\/planner#goals$/);
  await expect(page.locator("#goals")).toBeInViewport();

  await page.goto("/dashboard");
  await page.getByRole("link", { name: /open goals/i }).click();
  await expect(page).toHaveURL(/\/planner#goals$/);
  await expect(page.locator("#goals")).toBeInViewport();
});
