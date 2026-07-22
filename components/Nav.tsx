"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/map", label: "המפה הטקטית" },
  { href: "/memorial", label: "קיר ההנצחה" },
  { href: "/about", label: "אודות" },
];

export default function Nav({ floating = false }: { floating?: boolean }) {
  const path = usePathname();
  return (
    <header
      className={
        (floating
          ? "absolute top-0 inset-x-0 z-40 "
          : "sticky top-0 z-40 border-b border-line bg-void/80 backdrop-blur-md ") +
        "pointer-events-none"
      }
    >
      <nav className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-line-strong text-bone">
            <span className="font-mono text-sm font-semibold tnum">13</span>
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-extrabold tracking-wide text-bone">
              גדוד 13, חטיבת גולני
            </span>
            <span className="mt-1 font-mono text-[10px] tracking-wide text-muted">
              7 באוקטובר 2023 · הנצחה
            </span>
          </span>
        </Link>

        <ul className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = path === l.href || path.startsWith(l.href + "/");
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={
                    "relative px-3 py-2 text-sm transition-colors " +
                    (active ? "text-bone" : "text-muted hover:text-bone")
                  }
                >
                  {l.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-px bg-blood-bright" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
