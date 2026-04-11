import { ROUTES } from "@/constants/app";

async function clearLocalModeCookie(): Promise<void> {
  const response = await fetch(ROUTES.authAccessMode, {
    method: "DELETE",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("FAILED_TO_CLEAR_LOCAL_MODE");
  }
}

export async function prepareForCloudSignIn(): Promise<void> {
  await clearLocalModeCookie();
}

export async function prepareForCloudSignOut(): Promise<void> {
  await clearLocalModeCookie();
}
