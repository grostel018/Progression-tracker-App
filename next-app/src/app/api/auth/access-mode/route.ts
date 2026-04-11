import { NextResponse } from "next/server";

import { ACCESS_MODE_COOKIE } from "@/lib/auth/cookies";

export async function DELETE(): Promise<NextResponse> {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(ACCESS_MODE_COOKIE);
  return response;
}
