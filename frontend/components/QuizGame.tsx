"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizQuestion } from "../lib/types";
import { useLanguage } from "./LanguageProvider";

interface QuizGameProps {
  questions: QuizQuestion[];
  onComplete: (payload: { score: number; total: number; answers: { question: string; selected: string; correctAnswer: string }[] }) => void;
  timed?: boolean;
  timeLimit?: number;
  enableSpeech?: boolean;
}

type GameState = "loading" | "playing" | "reviewing" | "finished";

export default function QuizGame({ questions, onComplete, timed = false, timeLimit = 20, enableSpeech = false }: QuizGameProps) {
  const { language } = useLanguage();
  const [state, setState] = useState<GameState>("loading");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ question: string; selected: string; correctAnswer: string }[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [seconds, setSeconds] = useState(timeLimit);

  useEffect(() => {
    if (questions.length > 0) {
      setState("playing");
    }
  }, [questions]);

  useEffect(() => {
    if (!timed || state !== "playing") return;
    setSeconds(timeLimit);
    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [index, timed, timeLimit, state]);

  useEffect(() => {
    if (!timed) return;
    if (seconds <= 0 && state === "playing") {
      handleAnswer("");
    }
  }, [seconds, timed, state]);

  const current = questions[index];
  const total = questions.length;
  const copy =
    language === "mn"
      ? {
          loading: "Ачаалж байна...",
          question: "Асуулт",
          score: "Оноо",
          time: "Хугацаа",
          placeholder: "Хариултаа бичнэ үү",
          speak: "Дуугаар хариулах",
          submit: "Илгээх",
        }
      : {
          loading: "Loading...",
          question: "Question",
          score: "Score",
          time: "Time",
          placeholder: "Type your answer",
          speak: "Speak answer",
          submit: "Submit",
        };

  const score = useMemo(
    () => answers.filter((a) => a.selected === a.correctAnswer).length,
    [answers]
  );

  const handleAnswer = (option: string) => {
    if (selected || !current) return;
    setSelected(option);
    setState("reviewing");
    const hintText = "funnyHint" in current ? current.funnyHint : undefined;
    setHint(hintText ?? null);

    const nextAnswers = [
      ...answers,
      {
        question: current.type === "mcq" ? current.question : current.prompt,
        selected: option,
        correctAnswer: current.correctAnswer
      }
    ];
    setAnswers(nextAnswers);

    setTimeout(() => {
      setHint(null);
      if (index + 1 >= total) {
        setState("finished");
        const correct = option.trim().toLowerCase() === current.correctAnswer.trim().toLowerCase();
        onComplete({ score: score + (correct ? 1 : 0), total, answers: nextAnswers });
      } else {
        setIndex(index + 1);
        setSelected(null);
        setInput("");
        setState("playing");
      }
    }, 1500);
  };

  if (state === "loading") {
    return <div className="text-center text-muted">{copy.loading}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{copy.question} {index + 1}/{total}</span>
        <span className="font-mono">{copy.score}: {score}</span>
      </div>
      {timed && (
        <div className="text-xs text-muted">{copy.time}: {seconds}s</div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={current?.type === "mcq" ? current.question : current?.prompt}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border bg-surface p-8"
        >
          {current?.type === "mcq" ? (
            <h2 className="font-display text-2xl text-text">{current.question}</h2>
          ) : (
            <h2 className="font-display text-2xl text-text">{current?.prompt}</h2>
          )}
        </motion.div>
      </AnimatePresence>

      {current?.type === "mcq" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {current.options.map((option) => {
            const isCorrect = selected && option === current.correctAnswer;
            const isWrong = selected && option === selected && option !== current.correctAnswer;
            return (
              <motion.button
                key={option}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(option)}
                disabled={!!selected}
                className={`rounded-2xl border px-6 py-4 text-left text-lg transition will-change-transform ${
                  isCorrect
                    ? "border-accent bg-accent/10 text-accent shadow-glow"
                    : isWrong
                    ? "border-accent2 bg-accent2/10 text-accent2 shadow-glowRed"
                    : "border-border bg-surface2 text-text hover:border-accent"
                }`}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!!selected}
            className="w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-lg text-text outline-none focus:border-accent"
            placeholder={copy.placeholder}
          />
          <div className="flex gap-3">
            {enableSpeech && typeof window !== "undefined" && "webkitSpeechRecognition" in window && (
              <button
                type="button"
                onClick={() => {
                  const Speech = (window as any).webkitSpeechRecognition;
                  const recog = new Speech();
                  recog.lang = "en-US";
                  recog.onresult = (event: any) => {
                    const text = event.results?.[0]?.[0]?.transcript || "";
                    setInput(text);
                  };
                  recog.start();
                }}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text hover:border-accent"
              >
                🎙️ {copy.speak}
              </button>
            )}
            <button
              type="button"
              disabled={!!selected}
              onClick={() => handleAnswer(input)}
              className="rounded-xl border border-accent bg-accent/10 px-4 py-2 text-sm text-accent"
            >
              {copy.submit}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-accent"
          >
            {hint}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
