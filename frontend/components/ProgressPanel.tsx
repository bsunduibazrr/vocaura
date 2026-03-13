"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Progress } from "../lib/types";
import { ApiError, fetchProgress } from "../lib/api";

export default function ProgressPanel() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProgress();
        setProgress(data);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setProgress(null);
        }
      }
    };
    load();
  }, []);

  const xpToNext = useMemo(() => {
    if (!progress) return 200;
    const levelStart = (progress.level - 1) * 200;
    return Math.max(0, levelStart + 200 - progress.xp);
  }, [progress]);

  const xpProgress = useMemo(() => {
    if (!progress) return 0;
    const levelStart = (progress.level - 1) * 200;
    return Math.min(1, (progress.xp - levelStart) / 200);
  }, [progress]);

  if (!progress) {
    return <div className="rounded-2xl border border-border bg-surface p-6 animate-pulse h-36" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted">XP</p>
          <p className="font-display text-2xl text-accent">{progress.xp}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Level {progress.level}</p>
          <p className="text-sm text-text">{progress.levelLabel}</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-surface2 overflow-hidden">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${xpProgress * 100}%` }}
        />
      </div>
      <p className="text-xs text-muted">{xpToNext} XP to next level</p>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>Streak: {progress.streak} days</span>
        <span>Best: {progress.longestStreak}</span>
      </div>
    </div>
  );
}
