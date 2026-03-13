"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Word, WordLevel } from "../lib/types";
import { addWord, deleteWord, suggestWord, updateWord } from "../lib/api";
import { FiEdit2, FiTrash2, FiSave, FiX, FiFileText } from "react-icons/fi";
import { BsWordpress } from "react-icons/bs";
import { toast } from "../lib/toast";
import WordCard from "./WordCard";

interface AddWordFormProps {
  todayWords: Word[];
  onChange: (words: Word[]) => void;
}

export default function AddWordForm({
  todayWords,
  onChange,
}: AddWordFormProps) {
  const [english, setEnglish] = useState("");
  const [mongolian, setMongolian] = useState("");
  const [level, setLevel] = useState<WordLevel>("B2");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [example, setExample] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Word | null>(null);
  const [editDraft, setEditDraft] = useState<{
    english: string;
    mongolian: string;
    level: WordLevel;
    example: string;
  } | null>(null);

  const progress = useMemo(() => {
    const target = 20;
    return Math.min(todayWords.length / target, 1);
  }, [todayWords.length]);

  useEffect(() => {
    if (!english.trim()) {
      setSuggestion("");
      return;
    }
    const id = setTimeout(async () => {
      try {
        const response = await suggestWord(english.trim());
        setSuggestion(response.mongolian || "");
      } catch (err) {
        setSuggestion("");
      }
    }, 500);
    return () => clearTimeout(id);
  }, [english]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!english.trim() || !mongolian.trim()) {
      setError("Please fill both English and Mongolian fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const word = await addWord({
        english: english.trim(),
        mongolian: mongolian.trim(),
        level,
        example: example.trim() ? example.trim() : undefined,
      });
      onChange([word, ...todayWords]);
      setEnglish("");
      setMongolian("");
      setExample("");
      setSuggestion("");
      toast("Word added", "success");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast("Failed to add word", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (word: Word) => {
    setEditingId(word.id);
    setEditDraft({
      english: word.english,
      mongolian: word.mongolian,
      level: word.level,
      example: word.example || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft) return;
    try {
      const updated = await updateWord(editingId, {
        english: editDraft.english.trim(),
        mongolian: editDraft.mongolian.trim(),
        level: editDraft.level,
        example: editDraft.example.trim() ? editDraft.example.trim() : undefined,
      });
      onChange(
        todayWords.map((word) => (word.id === updated.id ? updated : word)),
      );
      cancelEdit();
      toast("Word updated", "success");
    } catch (error) {
      toast("Failed to update word", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWord(id);
      onChange(todayWords.filter((word) => word.id !== id));
      toast("Word deleted", "success");
    } catch (error) {
      toast("Failed to delete word", "error");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await handleDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10 rounded-2xl border border-green-500 bg-gradient-to-br from-green-500/30 to-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex gap-4 items-center">
              <BsWordpress className="w-12 h-12" />
              <div className="flex flex-col gap-1 ">
                <h2 className="font-display text-2xl text-text">
                  Today’s words
                </h2>
                <p className="text-sm text-muted">
                  {todayWords.length}/20 words added
                </p>
              </div>
            </div>
          </div>
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="var(--border)"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="var(--accent)"
                strokeWidth="10"
                fill="none"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={(1 - progress) * 2 * Math.PI * 52}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-text">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-green-500 bg-surface p-8"
      >
        <div>
          <label className="text-sm text-muted">English word</label>
          <input
            value={english}
            onChange={(event) => setEnglish(event.target.value)}
            placeholder="ex: resilient"
            className="mt-2 w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-lg text-text outline-none focus:border-accent"
          />
          {suggestion && !mongolian && (
            <p className="mt-2 text-sm text-accent">Suggestion: {suggestion}</p>
          )}
        </div>
        <div>
          <label className="text-sm text-muted">Mongolian translation</label>
          <input
            value={mongolian}
            onChange={(event) => setMongolian(event.target.value)}
            placeholder="Example: resilient"
            className="mt-2 w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-lg text-text outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-sm text-muted inline-flex items-center gap-2">
            <FiFileText /> Example sentence (optional)
          </label>
          <textarea
            value={example}
            onChange={(event) => setExample(event.target.value)}
            placeholder="Example: She remained resilient during the crisis."
            className="mt-2 w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-lg text-text outline-none focus:border-accent"
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          {["B1", "B2"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item as WordLevel)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                level === item
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-accent2">{error}</p>}
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border border-border bg-accent/10 px-6 py-3 text-lg font-medium text-accent shadow-glow transition disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add word"}
        </motion.button>
      </form>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display">Recently added</h3>
        </div>
        {todayWords.length === 0 && (
          <p className="text-sm text-muted">No words yet.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {todayWords.map((word, index) => (
            <div key={word.id}>
              {editingId === word.id && editDraft ? (
                <div className="rounded-2xl border border-border bg-surface2 p-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={editDraft.english}
                      onChange={(event) =>
                        setEditDraft({
                          ...editDraft,
                          english: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
                    />
                    <input
                      value={editDraft.mongolian}
                      onChange={(event) =>
                        setEditDraft({
                          ...editDraft,
                          mongolian: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
                    />
                  </div>
                  <textarea
                    value={editDraft.example}
                    onChange={(event) =>
                      setEditDraft({ ...editDraft, example: event.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    {(["B1", "B2"] as WordLevel[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setEditDraft({ ...editDraft, level: item })
                        }
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          editDraft.level === item
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded-full border border-accent bg-accent/10 px-3 py-1 text-accent"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FiSave /> Save
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full border border-border px-3 py-1 text-muted"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FiX /> Cancel
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <WordCard
                  word={word}
                  index={index}
                  onDelete={() => setPendingDelete(word)}
                  onEdit={() => startEdit(word)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
            <h4 className="font-display text-lg text-text">Delete this word?</h4>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete "{pendingDelete.english}"?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted"
              >
                <span className="inline-flex items-center gap-2">
                  <FiX /> No
                </span>
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full border border-accent2 bg-accent2/10 px-4 py-2 text-sm text-accent2"
              >
                <span className="inline-flex items-center gap-2">
                  <FiTrash2 /> Yes, delete
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
