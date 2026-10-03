import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";

// Uploads a file (image / video / audio) from the admin UI into our own
// `battle-media` Storage bucket using the service-role key, and returns its
// public URL. Keeps the service key server-side.
//
// Hardened: admin session required; the file type is detected from its magic
// bytes (the browser-supplied name/MIME are ignored); only image/video/audio
// formats are accepted, each with a size cap; the stored extension and
// Content-Type are chosen here — so nothing like HTML/SVG can ever be served
// from the public bucket.

export const dynamic = "force-dynamic";

const BUCKET = "battle-media";
const MB = 1024 * 1024;
const LIMIT = { image: 10 * MB, audio: 30 * MB, video: 50 * MB } as const;
const FOLDERS = new Set(["fallen", "media", "uploads"]);

type Detected = { mime: string; ext: string; cat: keyof typeof LIMIT };

const ascii = (b: Uint8Array, start: number, len: number) =>
  String.fromCharCode(...b.subarray(start, start + len));

/** Identify the format from the file's leading bytes. */
function sniff(b: Uint8Array): Detected | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg", cat: "image" };
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG") return { mime: "image/png", ext: "png", cat: "image" };
  if (ascii(b, 0, 4) === "GIF8") return { mime: "image/gif", ext: "gif", cat: "image" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return { mime: "image/webp", ext: "webp", cat: "image" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WAVE") return { mime: "audio/wav", ext: "wav", cat: "audio" };
  if (ascii(b, 0, 4) === "OggS") return { mime: "audio/ogg", ext: "ogg", cat: "audio" };
  if (ascii(b, 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0))
    return { mime: "audio/mpeg", ext: "mp3", cat: "audio" };
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)
    return { mime: "video/webm", ext: "webm", cat: "video" };
  if (ascii(b, 4, 4) === "ftyp") {
    const brand = ascii(b, 8, 4);
    if (brand === "M4A " || brand === "M4B ") return { mime: "audio/mp4", ext: "m4a", cat: "audio" };
    if (brand === "qt  ") return { mime: "video/quicktime", ext: "mov", cat: "video" };
    return { mime: "video/mp4", ext: "mp4", cat: "video" };
  }
  return null;
}

const fail = (error: string, status = 400) =>
  NextResponse.json({ ok: false, error }, { status });

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return fail("נדרשת התחברות", 401);

  const admin = getAdminClient();
  if (!admin) return fail("העלאה דורשת חיבור ל-Supabase (SUPABASE_SERVICE_ROLE_KEY).");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("בקשה לא תקינה.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return fail("לא צורף קובץ.");
  if (file.size === 0) return fail("הקובץ ריק.");
  if (file.size > LIMIT.video) return fail("הקובץ גדול מדי (מקסימום 50MB).", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return fail("סוג קובץ לא נתמך. מותר: JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, MP3, M4A, WAV, OGG.", 415);
  if (bytes.length > LIMIT[type.cat]) {
    return fail(`הקובץ גדול מדי (מקסימום ${LIMIT[type.cat] / MB}MB ל${type.cat === "image" ? "תמונה" : type.cat === "audio" ? "אודיו" : "וידאו"}).`, 413);
  }

  const requested = form.get("folder")?.toString() ?? "uploads";
  const folder = FOLDERS.has(requested) ? requested : "uploads";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${type.ext}`;

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: type.mime,
    upsert: false,
  });
  if (error) return fail(error.message, 500);

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, kind: type.mime });
}
