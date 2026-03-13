"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiPlusCircle, FiZap, FiBarChart2 } from "react-icons/fi";
import { motion } from "framer-motion";
import ParallaxWrap from "../components/ParallaxWrap";
import WordCard from "../components/WordCard";
import CountdownTimer from "../components/CountdownTimer";
import StreakBadge from "../components/StreakBadge";
import type { Word, TodayStats } from "../lib/types";
import {
  fetchTodayStats,
  deleteWord,
  fetchWeakWords,
  fetchWordsByMonth,
} from "../lib/api";
import { toast } from "../lib/toast";
import ReviewPanel from "../components/ReviewPanel";
import ProgressPanel from "../components/ProgressPanel";
import AchievementPanel from "../components/AchievementPanel";
import { useAuth } from "../components/AuthProvider";
import AuthGate from "../components/AuthGate";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [weakWords, setWeakWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>(() =>
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) {
          setWords([]);
          setStats(null);
          setWeakWords([]);
          return;
        }
        const [year, month] = monthFilter.split("-").map(Number);
        const [wordsData, statsData, weakData] = await Promise.all([
          fetchWordsByMonth(year, month),
          fetchTodayStats(),
          fetchWeakWords(6),
        ]);
        setWords(wordsData);
        setStats(statsData);
        setWeakWords(weakData);
      } catch (err) {
        setWords([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [monthFilter, user]);

  const grouped = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const word of words) {
      const key = word.addedAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(word);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [words]);

  if (!authLoading && !user) {
    return (
      <AuthGate
        title="Sign in to see your vocabulary lab"
        message="Your word deck, streak, and stats are personal. Log in to view them."
      />
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteWord(id);
      setWords((prev) => prev.filter((word) => word.id !== id));
      toast("Word deleted", "success");
    } catch (error) {
      toast("Failed to delete word", "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 pb-16">
      <StreakBadge streak={stats?.streak ?? 0} dateLabel={stats?.date ?? ""} />

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">All Words</h2>
              <span className="text-sm text-muted font-mono">
                {words.length} words
              </span>
            </div>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text"
            />
          </div>

          {loading && (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-56 rounded-2xl border border-border bg-surface animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && words.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
              No words in this month yet.
            </div>
          )}

          <div className="space-y-6">
            {grouped.map(([date, list]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">{date}</h3>
                  <span className="text-xs text-muted">
                    {list.length} words
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {list.map((word, index) => (
                    <WordCard
                      key={word.id}
                      word={word}
                      index={index}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <ProgressPanel />
          <ReviewPanel />
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="font-display text-lg">Weak words</h3>
            <div className="mt-4 space-y-3">
              {weakWords.length === 0 && (
                <p className="text-sm text-muted">No weak words yet.</p>
              )}
              {weakWords.map((word) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="text-text">{word.english}</p>
                    <p className="text-xs text-muted">{word.mongolian}</p>
                  </div>
                  <span className="text-xs text-accent2 font-mono">
                    -{word.wrongCount ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <AchievementPanel />
        </div>
      </section>

      <CountdownTimer />

      <motion.div
        className="grid gap-3 md:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {[
          {
            href: "/add",
            label: "Add new words",
            icon: <FiPlusCircle />,
          },
          {
            href: "/quiz",
            label: "Go to 22:00 quiz",
            icon: <FiZap />,
          },
          {
            href: "/stats",
            label: "Personal stats",
            icon: <FiBarChart2 />,
          },
        ].map((item) => (
          <motion.div
            key={item.href}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <ParallaxWrap className="parallax-soft">
              <Link
                href={item.href}
                className="block rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-text transition hover:border-accent hover:text-accent"
              >
                <span className="inline-flex items-center gap-2">
                  {item.icon} {item.label}
                </span>
              </Link>
            </ParallaxWrap>
          </motion.div>
        ))}
      </motion.div>

      <Link
        href="/add"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-accent bg-accent/20 text-3xl text-accent shadow-glow"
      >
        <FiPlusCircle />
      </Link>
    </div>
  );
}
