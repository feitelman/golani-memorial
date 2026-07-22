import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata = { title: "אודות הפרויקט · גדוד 13, חטיבת גולני" };

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-16">
        <p className="font-mono text-[11px] tracking-wide text-blood-bright">אודות</p>
        <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-bone sm:text-5xl">
          תיעוד, מפה והנצחה
        </h1>

        <div className="mt-10 space-y-10">
          <Block index="01" title="מטרת הפרויקט">
            פרויקט זה מבקש לתעד באופן מכבד ומדויק את קרבות גדוד 13 של חטיבת גולני
            בעוטף עזה בבוקר ה־7 באוקטובר 2023, ולשמר את זכרם של הלוחמים שנפלו. המפה
            הטקטית מאפשרת להתחקות אחר רצף האירועים — ההיתקלויות, המארבים, ההגנה על
            היישובים והבסיסים, ומבצעי החילוץ — לאורך ציר הזמן של אותו בוקר.
          </Block>

          <Block index="02" title="הקשר היסטורי">
            בשעה 06:29 נפתח מתקפת פתע רחבת היקף על יישובי וגזרות העוטף. כוחות הגדוד,
            חלקם בכוננות וחלקם שהוקפצו מאזורים אחרים, נכנסו ללחימה מול חדירה רב־זירתית.
            הלוחמים פעלו להגנה על התושבים, לבלימת החדירה ולחילוץ אזרחים תחת אש, לעיתים
            במשך שעות ארוכות ובמספרים נחותים.
          </Block>

          <Block index="03" title="מקורות ודיוק">
            התוכן המוצג מתעד את קרבות מוצב נחל עוז — קרב חמ"ל התצפיות וניסיון כיבוש
            המוצב — ואת לוחמי גדוד 13, חטיבת גולני ולוחמי צוות הקרב הגדודי שנפלו בהם.
            המידע מבוסס על תיעוד שנאסף, ועשוי להתעדכן ולהתווסף. ניהול התוכן נעשה דרך
            לוח הבקרה למנהלים, מתוך מחויבות לדיוק ולכבוד לזכר הנופלים ולמשפחותיהם.
          </Block>

          <Block index="04" title="קרדיטים">
            עיצוב חוויה, מפה טקטית, ומערכת הנצחה. בנוי ב־Next.js, Mapbox GL ו־Supabase.
            התודה הגדולה — ללוחמים, למשפחות ולקהילת העוטף.
          </Block>
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            href="/map"
            className="border border-line-strong bg-bone px-6 py-3 text-sm font-bold text-void transition-colors hover:bg-white"
          >
            כניסה למפה ←
          </Link>
          <Link
            href="/admin"
            className="border border-line px-6 py-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-bone"
          >
            לוח בקרה למנהלים
          </Link>
        </div>

        <p className="mt-16 font-mono text-[10px] tracking-wide text-faint">
          יהי זכרם ברוך
        </p>
      </main>
    </>
  );
}

function Block({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-xs text-blood-bright tnum">{index}</span>
        <h2 className="text-lg font-extrabold text-bone">{title}</h2>
      </div>
      <p className="text-[15px] leading-[1.9] text-muted">{children}</p>
    </section>
  );
}
