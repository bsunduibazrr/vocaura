"use client";

import { useEffect, useState } from "react";
import type { Achievement } from "../lib/types";
import { ApiError, fetchAchievements } from "../lib/api";

export default function AchievementPanel() {
  const [items, setItems] = useState<Achievement[]>([]);

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
      <h3 className="font-display text-lg">Achievements</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted">No badges yet.</p>
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
