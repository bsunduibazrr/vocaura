"use client";

import { useLanguage } from "../components/LanguageProvider";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const { language } = useLanguage();
  const copy =
    language === "mn"
      ? { title: "Ямар нэг алдаа гарлаа", retry: "Дахин оролдох" }
      : { title: "Something went wrong", retry: "Try again" };

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <div className="rounded-2xl border border-border bg-surface p-10">
        <h2 className="font-display text-2xl text-text">{copy.title}</h2>
        <p className="mt-3 text-muted">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full border border-accent bg-accent/10 px-5 py-2 text-accent"
        >
          {copy.retry}
        </button>
      </div>
    </div>
  );
}
