import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

// Uploads a file (image / video / audio) from the admin UI into our own
// `battle-media` Storage bucket using the service-role key, and returns its
// public URL. Keeps the service key server-side; the browser only sends the
// file and gets back a URL to store on the battle/soldier record.

export const dynamic = "force-dynamic";

const BUCKET = "battle-media";

export async function POST(req: NextRequest) {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "העלאה דורשת חיבור ל-Supabase (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 400 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "לא צורף קובץ." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const folder = form.get("folder")?.toString() || "uploads";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, kind: file.type });
}
