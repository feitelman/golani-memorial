import { fetchBattlesResult } from "@/lib/data";
import { orderedFallen } from "@/lib/fallen";
import { BATTLES_REVALIDATE } from "@/lib/supabase";
import Nav from "@/components/Nav";
import MemorialWall from "@/components/MemorialWall";

// Cached on the server (refreshed every 5 minutes, and instantly after an admin save).
export const revalidate = BATTLES_REVALIDATE;

export default async function MemorialPage() {
  const { battles, source, error } = await fetchBattlesResult();
  // Throw rather than cache an empty wall: Next keeps serving the last good page.
  if (source === "error") throw new Error(`Battle data unavailable: ${error}`);
  // Clustered by battle (see orderedFallen); each battle's fallen rank-ordered.
  const soldiers = orderedFallen(battles).map(({ battle, ...s }) => ({
    ...s,
    battle: battle.title,
    battleSlug: battle.slug,
  }));

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
