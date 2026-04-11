import { describe, expect, it } from "vitest";

import { DELETE } from "@/app/api/auth/access-mode/route";
import { ACCESS_MODE_COOKIE } from "@/lib/auth/cookies";

describe("access mode route", () => {
  it("clears the local mode cookie", async () => {
    const response = await DELETE();
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(204);
    expect(setCookie).toContain(`${ACCESS_MODE_COOKIE}=`);
    expect(setCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  });
});
