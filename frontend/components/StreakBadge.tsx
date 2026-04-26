"use client";

import { motion } from "framer-motion";
import { useLanguage } from "./LanguageProvider";

interface StreakBadgeProps {
  streak: number;
  dateLabel: string;
}

export default function StreakBadge({ streak, dateLabel }: StreakBadgeProps) {
  const { language } = useLanguage();
  const copy =
    language === "mn"
      ? { today: "Өнөөдөр", days: "хоног" }
      : { today: "Today", days: "days" };

  return (
    <div className="flex items-center justify-between rounded-[28px] border border-border bg-surface/80 px-6 py-5">
      <div>
        <p className="text-sm text-muted">{copy.today}</p>
        <p className="text-lg font-display text-text">{dateLabel}</p>
      </div>
      <motion.div
        className="flex items-center gap-2 rounded-full border border-accent3 bg-accent3/10 px-4 py-2 text-sm text-accent3"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        <span className="text-lg">🔥</span>
        <span className="font-mono">{streak} {copy.days}</span>
      </motion.div>
    </div>
  );
}
