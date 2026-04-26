"use client";

import { useState } from "react";
import { ApiError } from "../lib/api";
import { getAuthToken } from "../lib/authToken";
import { useLanguage } from "./LanguageProvider";

export default function PackTools() {
  const { language } = useLanguage();
  const [status, setStatus] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const copy =
    language === "mn"
      ? {
          loginExport: "Pack export хийхийн тулд нэвтэрнэ үү.",
          exportFailed: "Export амжилтгүй боллоо",
          imported: (count: number) => `${count} үг импортлогдлоо`,
          loginImport: "Pack import хийхийн тулд нэвтэрнэ үү.",
          importFailed: "Import амжилтгүй боллоо",
          title: "Community pack-ууд",
          export: "Pack татах",
          import: "Pack оруулах",
        }
      : {
          loginExport: "Please login to export packs.",
          exportFailed: "Export failed",
          imported: (count: number) => `Imported: ${count} words`,
          loginImport: "Please login to import packs.",
          importFailed: "Import failed",
          title: "Community packs",
          export: "Export pack",
          import: "Import pack",
        };

  const handleExport = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${apiBase}/api/packs/export?days=7`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!res.ok) {
        throw new ApiError(res.status, await res.text());
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "vocaura-pack.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStatus(copy.loginExport);
        return;
      }
      setStatus(copy.exportFailed);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const token = await getAuthToken();
      const payload = JSON.parse(text);
      const res = await fetch(`${apiBase}/api/packs/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new ApiError(res.status, await res.text());
      }
      const data = await res.json();
      setStatus(copy.imported(data.inserted));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStatus(copy.loginImport);
        return;
      }
      setStatus(copy.importFailed);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
      <h3 className="font-display text-lg">{copy.title}</h3>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm text-accent"
        >
          {copy.export}
        </button>
        <label className="rounded-full border border-border px-4 py-2 text-sm text-muted cursor-pointer">
          {copy.import}
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
      </div>
      {status && <p className="text-xs text-muted">{status}</p>}
    </div>
  );
}
