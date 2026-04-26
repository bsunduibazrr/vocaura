"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiPlusCircle, FiZap, FiBarChart2 } from "react-icons/fi";
import { motion } from "framer-motion";
import ParallaxWrap from "../components/ParallaxWrap";
import WordCard from "../components/WordCard";
import StreakBadge from "../components/StreakBadge";
import type { Word, TodayStats } from "../lib/types";
import {
  fetchTodayStats,
  deleteWord,
  fetchWordsByMonth,
} from "../lib/api";
import { toast } from "../lib/toast";
import ReviewPanel from "../components/ReviewPanel";
import ProgressPanel from "../components/ProgressPanel";
import AchievementPanel from "../components/AchievementPanel";
import { useUser } from "@clerk/nextjs";
import AuthGate from "../components/AuthGate";
import { useLanguage } from "../components/LanguageProvider";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { language } = useLanguage();
  const authLoading = !isLoaded;
  const [words, setWords] = useState<Word[]>([]);
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>(() =>
    new Date().toISOString().slice(0, 7),
  );
  const copy =
    language === "mn"
      ? {
          authTitle: "Үгийн сангаа харахын тулд нэвтэрнэ үү",
          authMessage: "Таны үгс, streak, статистик бүгд хувийн мэдээлэл тул нэвтэрч байж харагдана.",
          deleteSuccess: "Үг амжилттай устлаа",
          deleteError: "Үгийг устгаж чадсангүй",
          title: "Энэ сарын үгс",
          subtitle: "Нэмсэн бүх үгээ өдөр өдрөөр нь харна",
          words: "үг",
          noWords: "Энэ сард одоогоор үг нэмэгдээгүй байна.",
          addedThisMonth: "Энэ сард нэмсэн",
          totalSaved: "Нийт хадгалсан",
          todayScore: "Өнөөдрийн оноо",
          scoreFallback: "Өгөөгүй",
          quickActions: [
            { href: "/add", label: "Шинэ үг нэмэх", icon: <FiPlusCircle /> },
            { href: "/quiz", label: "Шалгалт өгөх", icon: <FiZap /> },
            { href: "/stats", label: "Хувийн статистик", icon: <FiBarChart2 /> },
          ],
          monthOverview: "Сарын тойм",
          supportTitle: "Өнөөдрийн самбар",
          supportText: "Давтлага, XP, амжилтаа нэг дороос хянаарай.",
          floatingAdd: "Үг нэмэх",
        }
      : {
          authTitle: "Sign in to see your vocabulary lab",
          authMessage: "Your word deck, streak, and stats are personal. Log in to view them.",
          deleteSuccess: "Word deleted",
          deleteError: "Failed to delete word",
          title: "Words this month",
          subtitle: "Browse everything you added, grouped by day",
          words: "words",
          noWords: "No words in this month yet.",
          addedThisMonth: "Added this month",
          totalSaved: "Total saved",
          todayScore: "Today's quiz score",
          scoreFallback: "Not taken",
          quickActions: [
            { href: "/add", label: "Add new words", icon: <FiPlusCircle /> },
            { href: "/quiz", label: "Take a quiz", icon: <FiZap /> },
            { href: "/stats", label: "Personal stats", icon: <FiBarChart2 /> },
          ],
          monthOverview: "Month overview",
          supportTitle: "Today's board",
          supportText: "Keep review, XP, and progress in one calm place.",
          floatingAdd: "Add words",
        };

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) {
          setWords([]);
          setStats(null);
          return;
        }
        const [year, month] = monthFilter.split("-").map(Number);
        const [wordsData, statsData] = await Promise.all([
          fetchWordsByMonth(year, month),
          fetchTodayStats(),
        ]);
        setWords(wordsData);
        setStats(statsData);
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
        title={copy.authTitle}
        message={copy.authMessage}
      />
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteWord(id);
      setWords((prev) => prev.filter((word) => word.id !== id));
      toast(copy.deleteSuccess, "success");
    } catch (error) {
      toast(copy.deleteError, "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 pb-16 sm:px-6 lg:space-y-10">
      <StreakBadge streak={stats?.streak ?? 0} dateLabel={stats?.date ?? ""} />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-border bg-surface/80 p-6 md:col-span-2">
          <p className="text-sm text-muted">{copy.monthOverview}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-text sm:text-4xl">{copy.title}</h1>
              <p className="mt-2 max-w-xl text-sm text-muted">{copy.subtitle}</p>
            </div>
            <div className="grid min-w-[220px] gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface2 px-4 py-3">
                <p className="text-xs text-muted">{copy.addedThisMonth}</p>
                <p className="mt-1 font-display text-2xl text-accent">{words.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface2 px-4 py-3">
                <p className="text-xs text-muted">{copy.totalSaved}</p>
                <p className="mt-1 font-display text-2xl text-text">{stats?.totalWords ?? words.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface2 px-4 py-3">
                <p className="text-xs text-muted">{copy.todayScore}</p>
                <p className="mt-1 font-display text-2xl text-accent3">
                  {stats?.quizScore ?? copy.scoreFallback}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-surface/80 p-6">
          <p className="text-sm text-muted">{copy.supportTitle}</p>
          <p className="mt-3 text-lg text-text">{copy.supportText}</p>
          <div className="mt-5 grid gap-3">
            {copy.quickActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center justify-between rounded-2xl border border-border bg-surface2 px-4 py-3 text-sm text-text transition hover:border-accent hover:text-accent"
              >
                <span className="inline-flex items-center gap-2">
                  {item.icon} {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">{copy.title}</h2>
              <span className="font-mono text-sm text-muted">
                {words.length} {copy.words}
              </span>
            </div>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text"
            />
          </div>

          {loading && (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-56 rounded-[24px] border border-border bg-surface animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && words.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-border bg-surface/70 p-10 text-center text-muted">
              {copy.noWords}
            </div>
          )}

          <div className="space-y-8">
            {grouped.map(([date, list]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">{date}</h3>
                  <span className="text-xs text-muted">
                    {list.length} {copy.words}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
          <AchievementPanel />
        </div>
      </section>

      <motion.div
        className="grid gap-3 md:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {copy.quickActions.map((item) => (
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
        aria-label={copy.floatingAdd}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-accent bg-accent/20 text-3xl text-accent shadow-glow"
      >
        <FiPlusCircle />
      </Link>
    </div>
  );
}
