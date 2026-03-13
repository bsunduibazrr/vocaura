"use client";

import { motion } from "framer-motion";

interface StreakBadgeProps {
  streak: number;
  dateLabel: string;
}

export default function StreakBadge({ streak, dateLabel }: StreakBadgeProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-6 py-4">
      <div>
        <p className="text-sm text-muted">Today</p>
        <p className="text-lg font-display text-text">{dateLabel}</p>
      </div>
      <motion.div
        className="flex items-center gap-2 rounded-full border border-accent3 bg-accent3/10 px-4 py-2 text-sm text-accent3"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        <span className="text-lg">🔥</span>
        <span className="font-mono">{streak} days</span>
      </motion.div>
    </div>
  );
}
