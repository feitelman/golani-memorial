import { fetchBattles } from "@/lib/data";
import Nav from "@/components/Nav";
import MemorialWall from "@/components/MemorialWall";

export const dynamic = "force-dynamic";

export default async function MemorialPage() {
  const battles = await fetchBattles();
  // Cluster the wall by battle: locations with the most fallen first, battles
  // within a location by time; each battle's fallen are already rank-ordered.
  const perLocation = new Map<string, number>();
  for (const b of battles) {
    perLocation.set(b.locationName, (perLocation.get(b.locationName) ?? 0) + b.fallen.length);
  }
  const ordered = [...battles].sort(
    (a, b) =>
      perLocation.get(b.locationName)! - perLocation.get(a.locationName)! ||
      a.locationName.localeCompare(b.locationName, "he") ||
      a.startMinute - b.startMinute ||
      a.title.localeCompare(b.title, "he"),
  );
  const soldiers = ordered.flatMap((b) =>
    b.fallen.map((s) => ({ ...s, battle: b.title, battleSlug: b.slug })),
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-16">
        <header className="text-center">
          <p className="font-mono text-[11px] tracking-wide text-blood-bright">לזכרם</p>
          <h1 className="mt-4 text-5xl font-black text-bone sm:text-6xl">
            קיר ההנצחה
          </h1>
          <p className="mx-auto mt-5 max-w-md text-pretty leading-relaxed text-muted">
            לזכרם של לוחמי גדוד 13, חטיבת גולני ולוחמי צוות הקרב הגדודי שנפלו
            בקרבות 7 באוקטובר — בנחל עוז, בפגה, במעבר ארז ובמוצבי הגזרה. כל שם הוא עולם ומלואו.
          </p>
          <div className="mx-auto mt-8 h-12 w-px bg-gradient-to-b from-blood-bright to-transparent" />
        </header>

        <section className="mt-4">
          <MemorialWall soldiers={soldiers} />
        </section>

        <p className="mt-16 text-center font-mono text-[10px] tracking-wide text-faint">
          יהי זכרם ברוך · נר נשמה
        </p>
      </main>
    </>
  );
}
