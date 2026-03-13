"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Word } from "../lib/types";
import { ApiError, fetchReviewQueue, submitReview } from "../lib/api";

const ratings: Array<{ id: "again" | "hard" | "good" | "easy"; label: string; color: string }> = [
  { id: "again", label: "Again", color: "text-accent2" },
  { id: "hard", label: "Hard", color: "text-accent3" },
  { id: "good", label: "Good", color: "text-accent" },
  { id: "easy", label: "Easy", color: "text-accent" }
];

export default function ReviewPanel() {
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const words = await fetchReviewQueue(5);
        setQueue(words);
        setIndex(0);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setQueue([]);
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const current = queue[index];

  const handleRate = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!current) return;
    try {
      await submitReview({ wordId: current.id, rating });
      if (index + 1 >= queue.length) {
        const next = await fetchReviewQueue(5);
        setQueue(next);
        setIndex(0);
      } else {
        setIndex(index + 1);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setQueue([]);
      }
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-border bg-surface p-6 animate-pulse h-40" />;
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center text-muted">
        Today’s review is complete.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Spaced repetition</span>
        <span>{index + 1}/{queue.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="space-y-2"
        >
          <h3 className="font-display text-2xl text-text">{current.english}</h3>
          <p className="text-sm text-muted">{current.mongolian}</p>
          <p className="text-xs text-muted">{current.example || "No example sentence yet."}</p>
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-2">
        {ratings.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleRate(item.id)}
            className={`rounded-xl border border-border bg-surface2 px-3 py-2 text-xs transition hover:border-accent ${item.color}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
