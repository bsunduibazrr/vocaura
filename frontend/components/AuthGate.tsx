"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FiLogIn } from "react-icons/fi";
import { useUser } from "@clerk/nextjs";

export default function AuthGate({ title, message }: { title: string; message: string }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="h-64 rounded-2xl border border-border bg-surface animate-pulse" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-surface p-10 text-center"
      >
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="mt-3 text-sm text-muted">{message}</p>
        <motion.div whileTap={{ scale: 0.98 }}>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent bg-accent/15 px-6 py-3 text-sm font-semibold text-accent transition hover:bg-accent/25"
          >
            <FiLogIn /> Sign in to continue
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
