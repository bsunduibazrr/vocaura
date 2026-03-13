"use client";

import { useEffect, useMemo, useState } from "react";

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return asUtc - date.getTime();
}

function getNextQuizTime(timeZone: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const [year, month, day] = formatter.format(now).split("-").map(Number);
  const utcTarget = new Date(Date.UTC(year, month - 1, day, 22, 0, 0));
  const offset = getTimeZoneOffsetMs(utcTarget, timeZone);
  let target = new Date(utcTarget.getTime() - offset);
  if (target.getTime() <= now.getTime()) {
    target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
  }
  return target;
}

export default function CountdownTimer() {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const next = getNextQuizTime("Asia/Ulaanbaatar");
      const diff = next.getTime() - Date.now();
      setRemaining(diff);
      setIsReady(diff <= 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { hours, minutes, seconds } = useMemo(() => {
    const total = Math.max(0, remaining);
    const h = Math.floor(total / (1000 * 60 * 60));
    const m = Math.floor((total / (1000 * 60)) % 60);
    const s = Math.floor((total / 1000) % 60);
    return { hours: h, minutes: m, seconds: s };
  }, [remaining]);

  const isDanger = remaining <= 10 * 60 * 1000;

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-border bg-surface2 px-6 py-4 text-center">
        <p className="text-sm text-muted">Time until 22:00 quiz</p>
        <div className="mt-2 font-mono text-3xl text-accent">--:--:--</div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border px-6 py-4 text-center ${isDanger ? "border-accent2" : "border-border"} bg-surface2`}>
      <p className="text-sm text-muted">Time until 22:00 quiz</p>
      <div className={`mt-2 font-mono text-3xl ${isDanger ? "text-accent2" : "text-accent"}`}>
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      {isReady && <p className="mt-2 text-sm text-accent3">Quiz is live!</p>}
    </div>
  );
}
