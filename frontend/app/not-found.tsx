"use client";

import { useLanguage } from "../components/LanguageProvider";

export default function NotFound() {
  const { language } = useLanguage();
  const copy =
    language === "mn"
      ? { title: "Хуудас олдсонгүй", message: "Энэ хуудас байхгүй байна." }
      : { title: "Page not found", message: "This page doesn’t exist." };

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <div className="rounded-2xl border border-border bg-surface p-10">
        <h2 className="font-display text-2xl text-text">{copy.title}</h2>
        <p className="mt-3 text-muted">{copy.message}</p>
      </div>
    </div>
  );
}
