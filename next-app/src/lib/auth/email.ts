import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

import { getServerEnv } from "@/lib/env";

export type DeliveryResult = {
  mode: "smtp" | "preview";
  previewPath?: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function getOutboxPath(): string {
  return path.join(process.cwd(), ".tmp", "outbox");
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s"<>]+/g);
  return matches ?? [];
}

async function writePreview(message: MailMessage): Promise<DeliveryResult> {
  const outboxPath = getOutboxPath();
  await mkdir(outboxPath, { recursive: true });

  const slug = message.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const previewPath = path.join(outboxPath, `${Date.now()}-${slug || "message"}.json`);

  await writeFile(
    previewPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        actionUrls: extractUrls(message.text),
        ...message
      },
      null,
      2
    ),
    "utf8"
  );

  return {
    mode: "preview",
    previewPath
  };
}

export async function sendMail(message: MailMessage): Promise<DeliveryResult> {
  const env = getServerEnv();

  if (env.EMAIL_FROM && env.EMAIL_SERVER_HOST && env.EMAIL_SERVER_PORT && env.EMAIL_SERVER_USER && env.EMAIL_SERVER_PASSWORD) {
    const transport = nodemailer.createTransport({
      host: env.EMAIL_SERVER_HOST,
      port: Number(env.EMAIL_SERVER_PORT),
      secure: Number(env.EMAIL_SERVER_PORT) === 465,
      auth: {
        user: env.EMAIL_SERVER_USER,
        pass: env.EMAIL_SERVER_PASSWORD
      }
    });

    await transport.sendMail({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });

    return {
      mode: "smtp"
    };
  }

  return writePreview(message);
}

export function buildVerificationMessage(email: string, token: string, appUrl: string): MailMessage {
  const verifyUrl = `${appUrl}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  return {
    to: email,
    subject: "Verify your Progression Tracker account",
    text: `Verify your email by opening this link: ${verifyUrl}\n\nIf you prefer to enter a code manually, use: ${token}`,
    html: `<p>Verify your Progression Tracker account.</p><p><a href="${verifyUrl}">Open the verification link</a></p><p>Or enter this code manually: <strong>${token}</strong></p>`
  };
}

export function buildResetMessage(email: string, token: string, appUrl: string, mode: "reset-password" | "create-password" = "reset-password"): MailMessage {
  const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  if (mode === "create-password") {
    return {
      to: email,
      subject: "Create a password for your Progression Tracker account",
      text: `You usually sign in with Google. If you want to unlock email-and-password sign-in too, open this link: ${resetUrl}`,
      html: `<p>You usually sign in with Google.</p><p>If you want to unlock email-and-password sign-in too, <a href="${resetUrl}">open this secure link to create a password</a>.</p>`
    };
  }

  return {
    to: email,
    subject: "Reset your Progression Tracker password",
    text: `Reset your password by opening this link: ${resetUrl}`,
    html: `<p>Reset your Progression Tracker password.</p><p><a href="${resetUrl}">Open the reset link</a></p>`
  };
}

export function buildReminderMessage(input: {
  appUrl: string;
  cadence: "DAILY" | "WEEKLY";
  dueTasks: Array<{ title: string; scheduledFor: string | null }>;
  overdueTaskCount: number;
  activeHabitCount: number;
  shouldPromptWeeklyReview: boolean;
  plannerUrl: string;
  weeklyReviewUrl: string;
}): Pick<MailMessage, "subject" | "text" | "html"> {
  const plannerUrl = `${input.appUrl}${input.plannerUrl}`;
  const weeklyReviewUrl = `${input.appUrl}${input.weeklyReviewUrl}`;
  const subject = input.cadence === "DAILY" ? "Your Progression Tracker daily reminder" : "Your Progression Tracker weekly reminder";
  const lines: string[] = ["Here is your Progression Tracker reminder:"];
  const htmlSections: string[] = ["<p>Here is your Progression Tracker reminder:</p>", "<ul>"];

  if (input.dueTasks.length > 0) {
    lines.push(`Due tasks: ${input.dueTasks.map((task) => task.title).join(", ")}`);
    htmlSections.push(`<li><strong>Due tasks:</strong> ${input.dueTasks.map((task) => task.title).join(", ")}</li>`);
  }

  if (input.overdueTaskCount > 0) {
    lines.push(`Overdue tasks: ${input.overdueTaskCount}`);
    htmlSections.push(`<li><strong>Overdue tasks:</strong> ${input.overdueTaskCount}</li>`);
  }

  if (input.activeHabitCount > 0) {
    lines.push(`Active habits ready for a nudge: ${input.activeHabitCount}`);
    htmlSections.push(`<li><strong>Habit nudge:</strong> ${input.activeHabitCount} active habit${input.activeHabitCount === 1 ? "" : "s"} waiting for attention</li>`);
  }

  if (input.shouldPromptWeeklyReview) {
    lines.push("Weekly review prompt: you have not completed a recent review yet.");
    htmlSections.push("<li><strong>Weekly review prompt:</strong> you have not completed a recent review yet.</li>");
  }

  lines.push(`Open your planner: ${plannerUrl}`);
  htmlSections.push(`</ul><p><a href="${plannerUrl}">Open your planner</a></p>`);

  if (input.shouldPromptWeeklyReview) {
    lines.push(`Open weekly review: ${weeklyReviewUrl}`);
    htmlSections.push(`<p><a href="${weeklyReviewUrl}">Open weekly review</a></p>`);
  }

  return {
    subject,
    text: lines.join("\n"),
    html: htmlSections.join("")
  };
}
