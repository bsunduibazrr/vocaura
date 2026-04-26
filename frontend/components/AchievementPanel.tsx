"use client";

import { useEffect, useState } from "react";
import type { Achievement } from "../lib/types";
import { ApiError, fetchAchievements } from "../lib/api";
import { useLanguage } from "./LanguageProvider";

export default function AchievementPanel() {
  const { language } = useLanguage();
  const [items, setItems] = useState<Achievement[]>([]);
  const copy =
    language === "mn"
      ? { title: "Амжилтууд", empty: "Одоогоор badge алга байна." }
      : { title: "Achievements", empty: "No badges yet." };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAchievements();
        setItems(data);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setItems([]);
        }
      }
    };
    load();
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="font-display text-lg">{copy.title}</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted">{copy.empty}</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-surface2 px-4 py-3">
            <p className="text-sm text-text">{item.title}</p>
            <p className="text-xs text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
