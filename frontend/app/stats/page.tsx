"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiHome, FiPlusCircle, FiZap } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import ParallaxWrap from "../../components/ParallaxWrap";
import StatsChart from "../../components/StatsChart";
import NotificationSetup from "../../components/NotificationSetup";
import PackTools from "../../components/PackTools";
import type { DayStats, HeatmapDay, TodayStats, Word } from "../../lib/types";
import { ApiError, fetchHeatmap, fetchMastery, fetchMonthStats, fetchTodayStats, fetchWeekStats, fetchWordsByDate } from "../../lib/api";
import { useAuth } from "../../components/AuthProvider";
import AuthGate from "../../components/AuthGate";

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"today" | "week" | "month">("today");
  const [today, setToday] = useState<TodayStats | null>(null);
  const [week, setWeek] = useState<DayStats[]>([]);
  const [month, setMonth] = useState<DayStats[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [weakMastery, setWeakMastery] = useState<Word[]>([]);
  const [heatmapDate, setHeatmapDate] = useState<string | null>(null);
  const [heatmapWords, setHeatmapWords] = useState<Word[]>([]);
  const [showWeak, setShowWeak] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) {
          setToday(null);
          setWeek([]);
          setMonth([]);
          setHeatmap([]);
          setWeakMastery([]);
          return;
        }
        const [todayData, weekData, monthData, heatmapData, masteryData] = await Promise.all([
          fetchTodayStats(),
          fetchWeekStats(),
          fetchMonthStats(),
          fetchHeatmap(90),
          fetchMastery(10, "asc")
        ]);
        setToday(todayData);
        setWeek(weekData);
        setMonth(monthData);
        setHeatmap(heatmapData);
        setWeakMastery(masteryData);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setToday(null);
          setWeek([]);
          setMonth([]);
          setHeatmap([]);
          setWeakMastery([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const monthSummary = useMemo(() => {
    const totalWords = month.reduce((sum, day) => sum + day.wordsAdded, 0);
    const quizScores = month.map((day) => day.quizScore).filter((score): score is number => typeof score === "number");
    const avgQuiz = quizScores.length ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
    return { totalWords, avgQuiz };
  }, [month]);

  if (!authLoading && !user) {
    return (
      <AuthGate
        title="Sign in to view stats"
        message="Your progress chart and achievements live under your account."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
      <div className="flex gap-3">
        {[
          { id: "today", label: "Today" },
          { id: "week", label: "7 days" },
          { id: "month", label: "Month" }
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as "today" | "week" | "month")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              tab === item.id ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 rounded-2xl border border-border bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && tab === "today" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Words added today</p>
            <p className="font-display text-3xl text-accent">{today?.wordsAdded ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Quiz score</p>
            <p className="font-display text-3xl text-accent3">{today?.quizScore ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Time studied</p>
            <p className="font-display text-3xl text-text">~{Math.max(1, Math.round((today?.wordsAdded ?? 0) / 3))} min</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Streak</p>
            <p className="font-display text-3xl text-accent2">{today?.streak ?? 0} days</p>
          </div>
        </div>
      )}

      {!loading && tab === "week" && <StatsChart data={week} period="week" />}

      {!loading && tab === "month" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="text-sm text-muted">Total words this month</p>
              <p className="font-display text-3xl text-accent">{monthSummary.totalWords}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="text-sm text-muted">Average score</p>
              <p className="font-display text-3xl text-accent3">{monthSummary.avgQuiz}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Study heatmap (90 days)</p>
            <div className="mt-4 grid grid-cols-10 sm:grid-cols-15 gap-2">
              {heatmap.map((day) => {
                const intensity = Math.min(day.count / 20, 1);
                const bg =
                  intensity === 0
                    ? "rgb(var(--surface2))"
                    : `color-mix(in oklab, rgb(var(--accent)) ${20 + intensity * 60}%, rgb(var(--surface2)))`;
                return (
                  <button
                    key={day.date}
                    onClick={async () => {
                      try {
                        setHeatmapDate(day.date);
                        const words = await fetchWordsByDate(day.date);
                        setHeatmapWords(words);
                        router.push(`/words?date=${day.date}`);
                      } catch (error) {
                        if (error instanceof ApiError && error.status === 401) {
                          return;
                        }
                      }
                    }}
                    className="h-5 w-5 rounded-md border border-border"
                    style={{ background: bg }}
                    title={`${day.date} - ${day.count} words`}
                  />
                );
              })}
            </div>
          </div>
          {heatmapDate && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="text-sm text-muted">Words on {heatmapDate}</p>
              <div className="mt-4 space-y-3">
                {heatmapWords.length === 0 && (
                  <p className="text-sm text-muted">No words.</p>
                )}
                {heatmapWords.map((word) => (
                  <div key={word.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-text">{word.english}</p>
                      <p className="text-xs text-muted">{word.mongolian}</p>
                    </div>
                    <span className="text-xs text-muted">{word.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <button
              type="button"
              onClick={() => setShowWeak((prev) => !prev)}
              className="flex w-full items-center justify-between text-sm text-muted"
            >
              <span>Mastery score — weak words</span>
              <span className="text-xs inline-flex items-center gap-2">
                {showWeak ? "Hide" : "Show"}
                <motion.span
                  animate={{ rotate: showWeak ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex"
                >
                  <FiChevronDown />
                </motion.span>
              </span>
            </button>
            <AnimatePresence>
              {showWeak && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                {weakMastery.length === 0 && (
                  <p className="text-sm text-muted">No data yet.</p>
                )}
                {weakMastery.map((word) => (
                  <div key={word.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-text">{word.english}</p>
                      <p className="text-xs text-muted">{word.mongolian}</p>
                    </div>
                    <span className="text-xs text-accent2 font-mono">{word.mastery ?? 0}%</span>
                  </div>
                ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
          {selectedDay && (
            <div className="rounded-2xl border border-border bg-surface2 p-6">
              <p className="text-sm text-muted">{selectedDay.date}</p>
              <p className="text-lg text-text">Words added: {selectedDay.wordsAdded}</p>
              <p className="text-lg text-text">Quiz score: {selectedDay.quizScore ?? 0}</p>
            </div>
          )}
        </div>
      )}

      <motion.div
        className="grid gap-3 md:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {[{
          href: "/",
          label: "Home",
          icon: <FiHome />
        }, {
          href: "/add",
          label: "Add words",
          icon: <FiPlusCircle />
        }, {
          href: "/quiz",
          label: "Quiz",
          icon: <FiZap />
        }].map((item) => (
          <motion.div key={item.href} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <ParallaxWrap className="parallax-soft">
              <Link className="block rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-text transition duration-100 hover:border-accent hover:text-accent" href={item.href}>
                <span className="inline-flex items-center gap-2">{item.icon} {item.label}</span>
              </Link>
            </ParallaxWrap>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <PackTools />
        <NotificationSetup />
      </div>
    </div>
  );
}
