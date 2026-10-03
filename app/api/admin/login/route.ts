import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_TTL_MS,
  authConfigured,
  checkPassword,
  createSessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// POST { password } → sets the session cookie.
export async function POST(req: NextRequest) {
  if (!authConfigured()) {
    return NextResponse.json(
      { ok: false, error: "הניהול נעול: לא הוגדרו ADMIN_PASSWORD / ADMIN_SESSION_SECRET." },
      { status: 503 },
    );
  }
  let password = "";
  try {
    ({ password = "" } = await req.json());
  } catch {
    /* empty / malformed body → treated as wrong password */
  }
  if (typeof password !== "string" || !checkPassword(password)) {
    // Small fixed delay blunts brute-force attempts.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ ok: false, error: "סיסמה שגויה" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSessionToken(), {
    ...cookieBase,
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}

// DELETE → logout.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return res;
}
