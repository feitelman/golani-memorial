import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { BATTLES_TAG, getAdminClient } from "@/lib/supabase";
import { fetchBattlesResult } from "@/lib/data";
import { battleSchema, describeIssues } from "@/lib/battle-schema";
import { saveBattle } from "@/lib/save-battle";
import { isAdminRequest } from "@/lib/auth";

const unauthorized = () =>
  NextResponse.json({ ok: false, error: "נדרשת התחברות" }, { status: 401 });

// Lightweight admin API. With a Supabase service-role key it persists to the
// relational tables; without one it runs in demo mode (returns seed, accepts
// writes but does not persist) so the dashboard is fully demoable offline.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return unauthorized();
  const { battles, source, error } = await fetchBattlesResult({ fresh: true });
  return NextResponse.json({
    battles,
    source, // "db" | "seed" | "error" — the UI must not treat these alike
    error,
    persisted: Boolean(getAdminClient()),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return unauthorized();
  const admin = getAdminClient();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "בקשה לא תקינה (JSON שבור)." }, { status: 400 });
  }

  // Validate before touching the database; reject with a readable Hebrew list.
  const parsed = battleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "הנתונים לא תקינים:\n" + describeIssues(parsed.error, body) },
      { status: 422 },
    );
  }

  if (!admin) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      note: "Demo mode — set SUPABASE_SERVICE_ROLE_KEY to persist.",
    });
  }

  const result = await saveBattle(admin, parsed.data);
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  revalidateTag(BATTLES_TAG); // map + memorial pick up the change on the next request
  return NextResponse.json({ ok: true, persisted: true, slug: result.slug });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) return unauthorized();
  const admin = getAdminClient();
  const { id } = await req.json();
  if (!admin) return NextResponse.json({ ok: true, persisted: false });
  const { error } = await admin.from("battles").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  revalidateTag(BATTLES_TAG);
  return NextResponse.json({ ok: true, persisted: true });
}
