"use client";

import { useEffect, useMemo, useState } from "react";

export function TestTimer({ minutes }: { minutes: number }) {
  const initialSeconds = useMemo(() => Math.max(0, Math.round(Number(minutes || 0) * 60)), [minutes]);
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    setRemaining(initialSeconds);
    if (!initialSeconds) return;

    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [initialSeconds]);

  if (!initialSeconds) {
    return <span className="test-timer">Study mode</span>;
  }

  const minutesLeft = Math.floor(remaining / 60);
  const secondsLeft = remaining % 60;
  const label = `${minutesLeft}:${String(secondsLeft).padStart(2, "0")}`;

  return (
    <span className={`test-timer ${remaining <= 300 ? "is-warning" : ""}`} aria-live="polite" data-testid="test-timer">
      Time left <strong>{label}</strong>
    </span>
  );
}
