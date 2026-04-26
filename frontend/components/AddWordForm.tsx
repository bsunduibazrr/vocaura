"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Word, WordLevel } from "../lib/types";
import { addWord, ApiError, deleteWord, generateExample, suggestWord, updateWord } from "../lib/api";
import { FiEdit2, FiTrash2, FiSave, FiX, FiFileText } from "react-icons/fi";
import { BsWordpress } from "react-icons/bs";
import { toast } from "../lib/toast";
import WordCard from "./WordCard";
import { useLanguage } from "./LanguageProvider";

interface AddWordFormProps {
  todayWords: Word[];
  onChange: (words: Word[]) => void;
}

export default function AddWordForm({
  todayWords,
  onChange,
}: AddWordFormProps) {
  const { language } = useLanguage();
  const [english, setEnglish] = useState("");
  const [mongolian, setMongolian] = useState("");
  const [level, setLevel] = useState<WordLevel>("B2");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [example, setExample] = useState("");
  const [autoFill, setAutoFill] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Word | null>(null);
  const [translationPermission, setTranslationPermission] = useState<boolean | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [translating, setTranslating] = useState(false);
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

  const mongolianRef = useRef("");
  const recentlyAddedRef = useRef<HTMLDivElement | null>(null);
  const permissionPromptedRef = useRef(false);
  const safeEnglish = english ?? "";
  const safeAutoFill = Boolean(autoFill);
  const copy =
    language === "mn"
      ? {
          fillEnglish: "Англи талбарыг бөглөнө үү.",
          fillMongolian: "Монгол орчуулгаа бөглөх эсвэл auto-generate-г асаана уу.",
          mongolianRequired: "Монгол орчуулга заавал хэрэгтэй.",
          genericError: "Ямар нэг алдаа гарлаа. Дахин оролдоно уу.",
          added: "Үг нэмэгдлээ",
          updated: "Үг шинэчлэгдлээ",
          updateFailed: "Үгийг шинэчилж чадсангүй",
          deleted: "Үг устгагдлаа",
          deleteFailed: "Үгийг устгаж чадсангүй",
          todayWords: "Өнөөдрийн үгс",
          wordsAdded: (count: number) => `${count}/20 үг нэмсэн`,
          englishWord: "Англи үг",
          englishPlaceholder: "ж: resilient",
          suggestion: "Санал болгож буй орчуулга",
          translating: "Орчуулж байна...",
          mongolianTranslation: "Монгол орчуулга",
          mongolianPlaceholder: "ж: тэсвэртэй",
          exampleSentence: "Жишээ өгүүлбэр (сонголттой)",
          examplePlaceholder: "ж: She remained resilient during the crisis.",
          autoGenerate: "Орчуулга ба жишээг автоматаар үүсгэх",
          adding: "Нэмж байна...",
          addWord: "Үг нэмэх",
          recentlyAdded: "Сүүлд нэмсэн",
          noWords: "Одоогоор үг алга байна.",
          save: "Хадгалах",
          cancel: "Болих",
          deleteTitle: "Энэ үгийг устгах уу?",
          deleteMessage: (word: string) => `"${word}" үгийг устгахдаа итгэлтэй байна уу?`,
          no: "Үгүй",
          yesDelete: "Тийм, устга",
          permissionTitle: "Автомат орчуулгын зөвшөөрөл",
          permissionMessage: "Англи үг бичихэд Vocaura автоматаар монгол орчуулгыг татаж, дараагийн талбарт бөглөх үү?",
          yes: "Тийм",
        }
      : {
          fillEnglish: "Please fill the English field.",
          fillMongolian: "Please fill the Mongolian field or enable auto-generate.",
          mongolianRequired: "Mongolian translation is required.",
          genericError: "Something went wrong. Please try again.",
          added: "Word added",
          updated: "Word updated",
          updateFailed: "Failed to update word",
          deleted: "Word deleted",
          deleteFailed: "Failed to delete word",
          todayWords: "Today's words",
          wordsAdded: (count: number) => `${count}/20 words added`,
          englishWord: "English word",
          englishPlaceholder: "ex: resilient",
          suggestion: "Suggestion",
          translating: "Translating...",
          mongolianTranslation: "Mongolian translation",
          mongolianPlaceholder: "Example: resilient",
          exampleSentence: "Example sentence (optional)",
          examplePlaceholder: "Example: She remained resilient during the crisis.",
          autoGenerate: "Auto-generate translation & example",
          adding: "Adding...",
          addWord: "Add word",
          recentlyAdded: "Recently added",
          noWords: "No words yet.",
          save: "Save",
          cancel: "Cancel",
          deleteTitle: "Delete this word?",
          deleteMessage: (word: string) => `Are you sure you want to delete "${word}"?`,
          no: "No",
          yesDelete: "Yes, delete",
          permissionTitle: "Auto translation permission",
          permissionMessage: "When you type an English word, should Vocaura automatically fetch the Mongolian translation and fill it into the next field?",
          yes: "Yes",
        };

  useEffect(() => {
    mongolianRef.current = mongolian;
  }, [mongolian]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem("vocaura-translation-permission");
    if (saved === "granted") {
      setTranslationPermission(true);
      permissionPromptedRef.current = true;
      return;
    }
    if (saved === "denied") {
      setTranslationPermission(false);
      permissionPromptedRef.current = true;
    }
  }, []);

  const fetchTranslation = async (input: string) => {
    const normalized = input.trim();
    if (!normalized) return;

    setTranslating(true);
    try {
      const response = await suggestWord(normalized);
      const translated = response.mongolian?.trim() || "";
      setSuggestion(translated);
      if (translated && !mongolianRef.current.trim()) {
        setMongolian(translated);
      }
    } catch (err) {
      setSuggestion("");
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    if (!safeEnglish.trim()) {
      setSuggestion("");
      return;
    }
    if (!safeAutoFill) {
      setSuggestion("");
      return;
    }
    if (translationPermission !== true) {
      return;
    }
    const id = setTimeout(async () => {
      await fetchTranslation(safeEnglish);
    }, 500);
    return () => clearTimeout(id);
  }, [safeEnglish, safeAutoFill, translationPermission]);

  const maybeAskTranslationPermission = () => {
    if (!safeAutoFill || !english.trim()) {
      return;
    }
    if (translationPermission !== null || permissionPromptedRef.current) {
      return;
    }
    permissionPromptedRef.current = true;
    setShowPermissionModal(true);
  };

  const handleAllowTranslation = async () => {
    setTranslationPermission(true);
    setShowPermissionModal(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vocaura-translation-permission", "granted");
    }
    await fetchTranslation(english);
  };

  const handleDenyTranslation = () => {
    setTranslationPermission(false);
    setShowPermissionModal(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vocaura-translation-permission", "denied");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!english.trim()) {
      setError(copy.fillEnglish);
      return;
    }
    if (!autoFill && !mongolian.trim()) {
      setError(copy.fillMongolian);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let resolvedMongolian = mongolian.trim();
      if (!resolvedMongolian && autoFill) {
        try {
          const response = await suggestWord(english.trim());
          resolvedMongolian = response.mongolian?.trim() || "";
          if (resolvedMongolian) {
            setMongolian(resolvedMongolian);
          }
        } catch (innerError) {
          resolvedMongolian = "";
        }
      }
      if (!resolvedMongolian) {
        setError(copy.mongolianRequired);
        setLoading(false);
        return;
      }

      let resolvedExample = example.trim();
      if (!resolvedExample && autoFill) {
        try {
          const generated = await generateExample({
            english: english.trim(),
            mongolian: resolvedMongolian || undefined
          });
          resolvedExample = generated.example?.trim() || "";
          if (resolvedExample) {
            setExample(resolvedExample);
          }
        } catch (innerError) {
          resolvedExample = "";
        }
      }
      const word = await addWord({
        english: english.trim(),
        mongolian: resolvedMongolian || undefined,
        level,
        example: resolvedExample ? resolvedExample : undefined,
        autoFill,
      });
      onChange([word, ...todayWords]);
      setEnglish("");
      setMongolian("");
      setExample("");
      setSuggestion("");
      setAutoFill(true);
      toast(copy.added, "success");
      recentlyAddedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : copy.genericError;
      setError(message);
      toast(message, "error");
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
      toast(copy.updated, "success");
    } catch (error) {
      toast(copy.updateFailed, "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWord(id);
      onChange(todayWords.filter((word) => word.id !== id));
      toast(copy.deleted, "success");
    } catch (error) {
      toast(copy.deleteFailed, "error");
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
                  {copy.todayWords}
                </h2>
                <p className="text-sm text-muted">
                  {copy.wordsAdded(todayWords.length)}
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
          <label className="text-sm text-muted">{copy.englishWord}</label>
          <input
            value={english}
            onChange={(event) => setEnglish(event.target.value)}
            onBlur={maybeAskTranslationPermission}
            placeholder={copy.englishPlaceholder}
            className="mt-2 w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-lg text-text outline-none focus:border-accent"
          />
          {suggestion && !mongolian && (
            <p className="mt-2 text-sm text-accent">{copy.suggestion}: {suggestion}</p>
          )}
          {translating && (
            <p className="mt-2 text-sm text-muted">{copy.translating}</p>
          )}
        </div>
        <div>
          <label className="text-sm text-muted">{copy.mongolianTranslation}</label>
          <input
            value={mongolian}
            onChange={(event) => setMongolian(event.target.value)}
            placeholder={copy.mongolianPlaceholder}
            className="mt-2 w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-lg text-text outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-sm text-muted inline-flex items-center gap-2">
            <FiFileText /> {copy.exampleSentence}
          </label>
          <textarea
            value={example}
            onChange={(event) => setExample(event.target.value)}
            placeholder={copy.examplePlaceholder}
            className="mt-2 w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-lg text-text outline-none focus:border-accent"
            rows={3}
          />
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={autoFill}
            onChange={(event) => setAutoFill(event.target.checked)}
            className="h-4 w-4 rounded border border-border bg-surface2 text-accent"
          />
          {copy.autoGenerate}
        </label>
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
          {loading ? copy.adding : copy.addWord}
        </motion.button>
      </form>

      <div className="mt-8 space-y-3">
        <div ref={recentlyAddedRef} className="flex items-center justify-between">
          <h3 className="text-lg font-display">{copy.recentlyAdded}</h3>
        </div>
        {todayWords.length === 0 && (
          <p className="text-sm text-muted">{copy.noWords}</p>
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
                        <FiSave /> {copy.save}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full border border-border px-3 py-1 text-muted"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FiX /> {copy.cancel}
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
            <h4 className="font-display text-lg text-text">{copy.deleteTitle}</h4>
            <p className="mt-2 text-sm text-muted">
              {copy.deleteMessage(pendingDelete.english)}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted"
              >
                <span className="inline-flex items-center gap-2">
                  <FiX /> {copy.no}
                </span>
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full border border-accent2 bg-accent2/10 px-4 py-2 text-sm text-accent2"
              >
                <span className="inline-flex items-center gap-2">
                  <FiTrash2 /> {copy.yesDelete}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
            <h4 className="font-display text-lg text-text">{copy.permissionTitle}</h4>
            <p className="mt-2 text-sm text-muted">
              {copy.permissionMessage}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDenyTranslation}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted"
              >
                <span className="inline-flex items-center gap-2">
                  <FiX /> {copy.no}
                </span>
              </button>
              <button
                type="button"
                onClick={handleAllowTranslation}
                className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm text-accent"
              >
                <span className="inline-flex items-center gap-2">
                  <FiSave /> {copy.yes}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
