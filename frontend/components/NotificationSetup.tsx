"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ielts_reminders_enabled";

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
    if (part.type !== "literal") values[part.type] = part.value;
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

function nextAtHour(hour: number, timeZone = "Asia/Ulaanbaatar") {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const [year, month, day] = formatter.format(now).split("-").map(Number);
  const utcTarget = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  const offset = getTimeZoneOffsetMs(utcTarget, timeZone);
  let target = new Date(utcTarget.getTime() - offset);
  if (target.getTime() <= now.getTime()) {
    target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
  }
  return target;
}

export default function NotificationSetup() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) === "true";
    setEnabled(saved);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: number | undefined;

    const schedule = async () => {
      if (!("serviceWorker" in navigator)) return;
      await navigator.serviceWorker.register("/sw.js");

      const show = async (title: string, body: string) => {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, { body });
      };

      const next17 = nextAtHour(17);
      const next22 = nextAtHour(22);
      const next = next17 < next22 ? next17 : next22;

      const now = Date.now();
      const delay = Math.max(1000, next.getTime() - now);

      timeoutId = window.setTimeout(() => {
        if (next.getHours() === 17) {
          show("Vocaura", "17:00 — time for auto word drop");
        } else {
          show("Vocaura", "22:00 — quiz time has started");
        }
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [enabled]);

  const handleEnable = async () => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      window.localStorage.setItem(STORAGE_KEY, "true");
      setEnabled(true);
    }
  };

  const handleDisable = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, "false");
    setEnabled(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="font-display text-lg">Push reminder</h3>
      <p className="mt-2 text-sm text-muted">Reminders at 17:00 and 22:00.</p>
      <div className="mt-4 flex gap-3">
        {!enabled ? (
          <button
            type="button"
            onClick={handleEnable}
            className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm text-accent"
          >
            Enable reminders
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDisable}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted"
          >
            Disable
          </button>
        )}
      </div>
    </div>
  );
}
