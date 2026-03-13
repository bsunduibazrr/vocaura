"use client";

import { useState } from "react";
import { ApiError } from "../lib/api";

export default function PackTools() {
  const [status, setStatus] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = typeof window !== "undefined" ? window.localStorage.getItem("vocaura_token") : null;

  const handleExport = async () => {
    try {
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
        setStatus("Please login to export packs.");
        return;
      }
      setStatus("Export failed");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
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
      setStatus(`Imported: ${data.inserted} words`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStatus("Please login to import packs.");
        return;
      }
      setStatus("Import failed");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
      <h3 className="font-display text-lg">Community packs</h3>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm text-accent"
        >
          Export pack
        </button>
        <label className="rounded-full border border-border px-4 py-2 text-sm text-muted cursor-pointer">
          Import pack
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
      </div>
      {status && <p className="text-xs text-muted">{status}</p>}
    </div>
  );
}
