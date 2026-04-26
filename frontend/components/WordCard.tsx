"use client";

import { motion } from "framer-motion";
import { FiTrash2, FiEye, FiEyeOff, FiEdit2 } from "react-icons/fi";
import { useState } from "react";
import type { Word } from "../lib/types";
import { useLanguage } from "./LanguageProvider";

interface WordCardProps {
  word: Word;
  index: number;
  onDelete?: (id: string) => void;
  onEdit?: (word: Word) => void;
}

export default function WordCard({ word, index, onDelete, onEdit }: WordCardProps) {
  const { language } = useLanguage();
  const [flipped, setFlipped] = useState(false);
  const [showMn, setShowMn] = useState(false);
  const copy =
    language === "mn"
      ? {
          hide: "Нуух",
          show: "Харах",
          edit: "Засах",
          delete: "Устгах",
          example: "Жишээ өгүүлбэр",
          noExample: "Жишээ өгүүлбэр алга байна.",
          longPress: "Эргүүлэхийн тулд удаан дар"
        }
      : {
          hide: "Hide",
          show: "Show",
          edit: "Edit",
          delete: "Delete",
          example: "Example sentence",
          noExample: "No example sentence yet.",
          longPress: "Long press to flip"
        };

  return (
    <motion.div
      className="relative h-56 w-full cursor-pointer will-change-transform"
      style={{ perspective: 1200 }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <motion.div
        className="relative h-full w-full rounded-2xl border border-border bg-surface shadow-[0_0_0_1px_rgba(var(--border),0.2)] will-change-transform shimmer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
      >
        <div
          className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl p-5"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          <div className="flex items-start justify-between">
            <span className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-mono text-accent">
              {word.level}
            </span>
            {word.isAutoAdded && (
              <span className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-mono text-accent3 animate-pulseSlow">
                AI
              </span>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-2xl tracking-wide text-text">
              {word.english}
            </h3>
            {showMn && <p className="text-sm text-muted">{word.mongolian}</p>}
            <p className="text-sm text-muted font-mono">
              {new Date(word.addedAt).toLocaleDateString("mn-MN")}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowMn((prev) => !prev);
              }}
              className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs text-muted transition hover:text-accent"
            >
              <span className="inline-flex items-center gap-2">
                {showMn ? <FiEyeOff /> : <FiEye />} {showMn ? copy.hide : copy.show}
              </span>
            </button>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(word);
                  }}
                  className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs text-muted transition hover:text-accent"
                >
                  <span className="inline-flex items-center gap-2">
                    <FiEdit2 /> {copy.edit}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.(word.id);
                }}
                className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs text-muted transition hover:text-accent2"
              >
                <span className="inline-flex items-center gap-2">
                  <FiTrash2 /> {copy.delete}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div
          className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl bg-surface2 p-5"
          // Back side
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg) scaleX(-1)",
          }}
        >
          <div>
            <p className="text-lg font-medium text-text">{word.mongolian}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted">{copy.example}</p>
            <p className="text-sm text-text opacity-90">
              {word.example || copy.noExample}
            </p>
          </div>
          <div className="text-xs text-muted font-mono">{copy.longPress}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
