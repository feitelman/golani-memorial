"use client";

import { useEffect } from "react";
import ErrorScreen from "@/components/ErrorScreen";

// Shown when a page fails to render (e.g. the database is unreachable).
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      eyebrow="תקלה זמנית"
      title="לא הצלחנו לטעון את הדף"
      message="ייתכן שמדובר בתקלה רגעית בחיבור. נסו שוב בעוד רגע, ואם התקלה נמשכת — חזרו מאוחר יותר."
      onRetry={reset}
    />
  );
}
