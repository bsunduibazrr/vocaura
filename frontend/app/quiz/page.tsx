"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiBarChart2, FiHome, FiPlusCircle, FiRefreshCw } from "react-icons/fi";
import { motion } from "framer-motion";
import ParallaxWrap from "../../components/ParallaxWrap";
import QuizGame from "../../components/QuizGame";
import ShareCard from "../../components/ShareCard";
import type { QuizQuestion, QuizResult } from "../../lib/types";
import { fetchQuizQuestions, submitQuiz } from "../../lib/api";
import { useUser } from "@clerk/nextjs";
import AuthGate from "../../components/AuthGate";

const statusLabel = (percent: number) => {
  if (percent >= 90) return "🏆 Excellent";
  if (percent >= 70) return "👍 Good";
  if (percent >= 50) return "💪 Keep trying";
  return "😅 Were you asleep?";
};

export default function QuizPage() {
  const { user, isLoaded } = useUser();
  const authLoading = !isLoaded;
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"standard" | "spelling" | "fill" | "boss">("standard");
  const [timed, setTimed] = useState(false);
  const [speech, setSpeech] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!user) {
          setQuestions([]);
          return;
        }
        const list = await fetchQuizQuestions(mode);
        setQuestions(list);
      } catch (error) {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mode, user, reloadKey]);

  useEffect(() => {
    setResult(null);
  }, [mode, timed, speech]);

  const percent = useMemo(() => {
    if (!result) return 0;
    return Math.round((result.score / result.total) * 100);
  }, [result]);

  const handleComplete = async (payload: { score: number; total: number; answers: { question: string; selected: string; correctAnswer: string }[] }) => {
    const response = await submitQuiz({ answers: payload.answers });
    setResult(response);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 3000);
  };

  if (!authLoading && !user) {
    return (
      <AuthGate
        title="Sign in to take the quiz"
        message="Quizzes are personalized to your word list and progress."
      />
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-16 text-center text-muted">Loading quiz...</div>;
  }

  if (!loading && questions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-6">
        <div className="rounded-3xl border border-border bg-surface p-8 text-center sm:p-10">
          <h2 className="font-display text-2xl text-text">Эхлээд үгээ нэмнэ үү</h2>
          <p className="mt-3 text-muted">
            Quiz үүсгэх үг алга байна. Add words хэсэгт очоод үгээ нэмсний дараа шууд quiz өгч болно.
          </p>
        </div>
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
            href: "/stats",
            label: "Stats",
            icon: <FiBarChart2 />
          }].map((item) => (
            <motion.div key={item.href} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
              <ParallaxWrap className="parallax-soft">
                <Link className="block rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-text transition hover:border-accent hover:text-accent" href={item.href}>
                  <span className="inline-flex items-center gap-2">{item.icon} {item.label}</span>
                </Link>
              </ParallaxWrap>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-6">
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_55%),radial-gradient(circle_at_30%_40%,rgba(var(--accent),0.35),transparent_55%),radial-gradient(circle_at_80%_60%,rgba(var(--accent3),0.25),transparent_60%)]" />
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-6xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.05, 1] }}
              transition={{ duration: 0.8 }}
            >
              🎉🎊✨
            </motion.div>
          </motion.div>
        )}
        <div className="rounded-2xl border border-border bg-surface p-10 text-center space-y-3">
          <p className="text-sm text-muted">Your score</p>
          <p className="font-display text-5xl text-accent">{result.score}/{result.total}</p>
          <p className="text-xl text-accent3">{statusLabel(percent)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface2 p-8 text-lg text-text">
          {result.feedback}
        </div>
        <ShareCard score={result.score} total={result.total} feedback={result.feedback} />
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
            href: "/stats",
            label: "Stats",
            icon: <FiBarChart2 />
          }].map((item) => (
            <motion.div key={item.href} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
              <ParallaxWrap className="parallax-soft">
                <Link className="block rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-text transition hover:border-accent hover:text-accent" href={item.href}>
                  <span className="inline-flex items-center gap-2">{item.icon} {item.label}</span>
                </Link>
              </ParallaxWrap>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 space-y-8">
      <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "standard", label: "Fun Quiz" },
            { id: "spelling", label: "Spelling" },
            { id: "fill", label: "Fill-in" },
            { id: "boss", label: "Boss battle (7 days)" }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id as any)}
              className={`rounded-full border px-4 py-2 text-xs transition ${
                mode === item.id ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
              Timed mode
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={speech} onChange={(e) => setSpeech(e.target.checked)} />
              Speaking mode
            </label>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-sm text-text transition hover:border-accent hover:text-accent"
          >
            <FiRefreshCw />
            New questions
          </button>
        </div>
      </div>
      <QuizGame questions={questions} onComplete={handleComplete} timed={timed} timeLimit={20} enableSpeech={speech} />
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
          href: "/stats",
          label: "Stats",
          icon: <FiBarChart2 />
        }].map((item) => (
          <motion.div key={item.href} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <ParallaxWrap className="parallax-soft">
              <Link className="block rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-text transition hover:border-accent hover:text-accent" href={item.href}>
                <span className="inline-flex items-center gap-2">{item.icon} {item.label}</span>
              </Link>
            </ParallaxWrap>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
