import Link from "next/link";

/**
 * Shared screen for errors and missing pages, carrying the logo of the
 * בדרכי תומר association. The logo is black on transparent; on the dark site
 * it is inverted (hue-rotate keeps the brown dedication line warm).
 */
export default function ErrorScreen({
  eyebrow,
  title,
  message,
  onRetry,
}: {
  eyebrow: string;
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-badrachei-tomer.png"
        alt="בדרכי תומר — לזכרו של סא״ל תומר גרינברג ז״ל"
        width={710}
        height={510}
        className="w-64 max-w-full opacity-90 [filter:invert(1)_hue-rotate(180deg)] sm:w-72"
      />

      <div className="mt-10 h-10 w-px bg-gradient-to-b from-blood-bright to-transparent" />

      <p className="mt-6 font-mono text-[11px] tracking-wide text-blood-bright">{eyebrow}</p>
      <h1 className="mt-3 text-balance text-3xl font-black leading-tight text-bone sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-sm text-pretty leading-relaxed text-muted">{message}</p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="border border-line-strong bg-bone px-6 py-3 text-sm font-bold text-void transition-colors hover:bg-white"
          >
            נסו שוב
          </button>
        )}
        <Link
          href="/"
          className="border border-line px-6 py-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-bone"
        >
          לעמוד הבית
        </Link>
        <Link
          href="/memorial"
          className="border border-line px-6 py-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-bone"
        >
          לקיר ההנצחה
        </Link>
      </div>

      <p className="mt-16 font-mono text-[10px] tracking-wide text-faint">יהי זכרם ברוך</p>
    </main>
  );
}
