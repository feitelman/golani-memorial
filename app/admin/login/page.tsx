"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) {
        setError(d.error || "ההתחברות נכשלה");
        setBusy(false);
        return;
      }
      // Only follow same-site paths under /admin.
      const next = params.get("next") ?? "/admin";
      window.location.href = next.startsWith("/admin") ? next : "/admin";
    } catch {
      setError("שגיאת רשת — נסו שוב");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm border border-line bg-surface/60 p-6"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center border border-line-strong font-mono text-xs text-bone tnum">
          13
        </span>
        <div>
          <h1 className="text-sm font-extrabold text-bone">כניסה ללוח הבקרה</h1>
          <p className="font-mono text-[10px] tracking-wide text-faint">גישה למורשים בלבד</p>
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-muted">סיסמה</span>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-line bg-void px-3 py-2 text-sm text-bone focus:border-line-strong focus:outline-none"
        />
      </label>
      {error && <p className="mt-3 text-sm text-blood-bright">{error}</p>}
      <button
        type="submit"
        disabled={busy || !password}
        className="mt-5 w-full border border-line-strong bg-bone px-4 py-2 text-sm font-bold text-void transition-colors hover:bg-white disabled:opacity-50"
      >
        {busy ? "מתחבר…" : "כניסה"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-void px-5">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
