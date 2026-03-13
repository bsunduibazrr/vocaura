"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ToastType } from "../lib/toast";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { message: string; type: ToastType };
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, message: detail.message, type: detail.type }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 3000);
    };
    window.addEventListener("ielts-toast", handler);
    return () => window.removeEventListener("ielts-toast", handler);
  }, []);

  return (
    <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 space-y-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className={`rounded-full border px-4 py-2 text-sm shadow-glow backdrop-blur ${
              item.type === "success"
                ? "border-accent bg-accent/10 text-accent"
                : item.type === "error"
                ? "border-accent2 bg-accent2/10 text-accent2"
                : "border-border bg-surface/80 text-text"
            }`}
          >
            {item.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
