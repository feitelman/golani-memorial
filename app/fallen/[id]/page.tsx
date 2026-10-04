import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchBattlesResult } from "@/lib/data";
import { orderedFallen } from "@/lib/fallen";
import { BATTLES_REVALIDATE } from "@/lib/supabase";
import { AFFILIATION_LABEL, KIND_LABEL } from "@/lib/types";
import Nav from "@/components/Nav";

// Cached on the server (refreshed every 5 minutes, and instantly after an admin save).
export const revalidate = BATTLES_REVALIDATE;

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

async function load(id: string) {
  const { battles, source, error } = await fetchBattlesResult();
  // Throw rather than cache a 404: Next keeps serving the last good page.
  if (source === "error") throw new Error(`Battle data unavailable: ${error}`);
  const all = orderedFallen(battles);
  const index = all.findIndex((s) => s.id === id);
  return { all, index, entry: index === -1 ? null : all[index] };
}

export async function generateStaticParams() {
  const { battles } = await fetchBattlesResult();
  return battles.flatMap((b) => b.fallen.map((s) => ({ id: s.id })));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { entry } = await load(params.id);
  if (!entry) return { title: "הדף לא נמצא · גדוד 13, חטיבת גולני" };
  const title = `${entry.rank} ${entry.fullName} ז"ל · גדוד 13, חטיבת גולני`;
  return {
    title,
    description: `${entry.memorial} · ${entry.battle.title}, 7 באוקטובר 2023`,
    openGraph: { title, images: entry.photo ? [entry.photo] : undefined },
  };
}

/** Small dark static map of the battle point (Mapbox Static Images API). */
function staticMap([lng, lat]: [number, number]) {
  if (!TOKEN) return null;
  const pin = `pin-s+b91c1c(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pin}/${lng},${lat},14.2,0,0/640x320@2x?access_token=${TOKEN}&attribution=false&logo=false`;
}

export default async function FallenPage({ params }: { params: { id: string } }) {
  const { all, index, entry: s } = await load(params.id);
  if (!s) notFound();

  const b = s.battle;
  const prev = all[index - 1];
  const next = all[index + 1];
  const comrades = b.fallen.filter((x) => x.id !== s.id);
  const map = staticMap(b.coordinates);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-12">
        <Link
          href="/memorial"
          className="font-mono text-[11px] tracking-wide text-faint transition-colors hover:text-blood-bright"
        >
          → קיר ההנצחה
        </Link>

        {/* portrait + name */}
        <header className="mt-8 flex flex-col items-center text-center">
          <div className="relative h-72 w-56 overflow-hidden border border-line bg-elevated sm:h-80 sm:w-64">
            {s.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photo} alt={s.fullName} className="h-full w-full object-cover grayscale" />
            ) : (
              <div className="grid h-full w-full place-items-center text-4xl font-bold text-faint">
                {s.fullName.split(" ").slice(0, 2).map((p) => p[0]).join("")}
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blood-bright/80" />
          </div>

          <p className="mt-8 font-mono text-xs tracking-wide text-blood-bright">{s.rank}</p>
          <h1 className="mt-2 text-balance text-4xl font-black leading-tight text-bone sm:text-5xl">
            {s.fullName} <span className="text-2xl font-bold text-muted sm:text-3xl">ז&quot;ל</span>
          </h1>
          <p className="mt-4 max-w-md text-pretty text-lg leading-relaxed text-bone/85">{s.memorial}</p>

          <dl className="mt-8 grid w-full max-w-md grid-cols-3 border-y border-line py-4 text-sm">
            <Fact label="גיל" value={s.age ? String(s.age) : "—"} />
            <Fact label="מקום מגורים" value={s.hometown || "—"} />
            <Fact label="תאריך" value="7.10.2023" />
          </dl>
          <p className="mt-3 font-mono text-[10px] text-faint">
            {AFFILIATION_LABEL[s.affiliation ?? "battalion_13"]} · כ&quot;ב בתשרי תשפ&quot;ד
          </p>
        </header>

        {/* the battle */}
        <section className="mt-14">
          <SectionTitle>הקרב</SectionTitle>
          <div className="border border-line bg-surface/60">
            {map && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={map}
                alt={`מפת ${b.locationName}`}
                className="h-44 w-full border-b border-line object-cover opacity-80 sm:h-52"
              />
            )}
            <div className="p-5">
              <p className="eyebrow text-blood-bright">{KIND_LABEL[b.kind]}</p>
              <h2 className="mt-2 text-2xl font-extrabold text-bone">{b.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {b.locationName} · <span className="font-mono tnum">{b.time}</span>
              </p>
              <Link
                href={`/map?battle=${encodeURIComponent(b.slug)}`}
                className="mt-5 inline-block border border-line-strong bg-bone px-5 py-2.5 text-sm font-bold text-void transition-colors hover:bg-white"
              >
                לקרב על המפה ←
              </Link>
            </div>
          </div>
        </section>

        {/* fell alongside */}
        {comrades.length > 0 && (
          <section className="mt-14">
            <SectionTitle>נפלו באותו קרב</SectionTitle>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {comrades.map((c) => (
                <Link key={c.id} href={`/fallen/${c.id}`} className="group text-center">
                  <div className="aspect-[4/5] overflow-hidden border border-line bg-elevated">
                    {c.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.photo}
                        alt={c.fullName}
                        loading="lazy"
                        className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-xs font-bold text-bone">{c.fullName}</p>
                  <p className="font-mono text-[10px] text-faint">{c.rank}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* previous / next, in memorial-wall order */}
        <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
          {prev ? (
            <Link href={`/fallen/${prev.id}`} className="group text-start">
              <span className="font-mono text-[10px] text-faint">→ הקודם</span>
              <span className="mt-1 block text-muted transition-colors group-hover:text-bone">
                {prev.rank} {prev.fullName}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/fallen/${next.id}`} className="group text-end">
              <span className="font-mono text-[10px] text-faint">הבא ←</span>
              <span className="mt-1 block text-muted transition-colors group-hover:text-bone">
                {next.rank} {next.fullName}
              </span>
            </Link>
          )}
        </nav>

        <p className="mt-16 text-center font-mono text-[10px] tracking-wide text-faint">
          יהי זכרם ברוך
        </p>
      </main>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-faint">{label}</dt>
      <dd className="mt-1 font-semibold text-bone">{value}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="h-1.5 w-1.5 rotate-45 bg-blood-bright" />
      <h2 className="text-sm font-bold tracking-wide text-muted">{children}</h2>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
