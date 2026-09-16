import { fetchBattles } from "@/lib/data";
import Nav from "@/components/Nav";
import MemorialWall from "@/components/MemorialWall";

export const dynamic = "force-dynamic";

export default async function MemorialPage() {
  const battles = await fetchBattles();
  const soldiers = battles.flatMap((b) =>
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
            בקרבות מוצב נחל עוז ומחנה פגה ב-7 באוקטובר. כל שם הוא עולם ומלואו.
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
