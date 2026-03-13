"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiHome,
  FiPlusCircle,
  FiZap,
  FiBarChart2,
  FiBookOpen,
  FiInfo,
  FiLogIn,
  FiLogOut,
  FiUser,
  FiChevronDown
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import ToastHost from "./ToastHost";
import AuthModal from "./AuthModal";
import { useAuth } from "./AuthProvider";
import { claimLegacyWords } from "../lib/api";
import { toast } from "../lib/toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, openAuth, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-2xl border border-border bg-[radial-gradient(circle_at_top,#4fffb01f,transparent_70%)] flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
                <path
                  d="M32 6l18 10v20l-18 22-18-22V16L32 6z"
                  fill="none"
                  stroke="rgb(var(--accent))"
                  strokeWidth="2.5"
                />
                <path
                  d="M20 24l12 22 12-22"
                  fill="none"
                  stroke="rgb(var(--accent3))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="32" cy="22" r="3" fill="rgb(var(--accent2))" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl tracking-widest text-accent">Vocaura</span>
              <span className="text-xs text-muted font-mono uppercase tracking-[0.3em]">Vocab Lab</span>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-start gap-3 text-xs sm:text-sm lg:w-auto lg:justify-end">
            <nav className="flex w-full flex-wrap items-center gap-1 rounded-full border border-border/60 bg-surface/50 p-1 sm:gap-2 lg:w-auto">
              <Link className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-2 text-text transition duration-150 hover:border-accent hover:text-accent sm:px-3" href="/">
              <FiHome /> Today
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-2 text-text transition duration-150 hover:border-accent hover:text-accent sm:px-3" href="/add">
              <FiPlusCircle /> Add words
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-2 text-text transition hover:border-accent hover:text-accent sm:px-3" href="/words">
              <FiBookOpen /> New words
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-2 text-text transition hover:border-accent hover:text-accent sm:px-3" href="/guide">
              <FiInfo /> Guide
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-2 text-text transition duration-150 hover:border-accent hover:text-accent sm:px-3" href="/quiz">
              <FiZap /> Quiz
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-2 text-text transition hover:border-accent hover:text-accent sm:px-3" href="/stats">
              <FiBarChart2 /> Stats
              </Link>
            </nav>
            {!user && (
              <button
                onClick={() => openAuth("login")}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-text transition duration-150 hover:border-accent hover:text-accent"
              >
                <FiLogIn /> Login
              </button>
            )}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-text transition duration-150 hover:border-accent hover:text-accent"
                >
                  <FiUser />
                  <span className="max-w-[140px] truncate">{user.email}</span>
                  <FiChevronDown className={`transition ${menuOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-64 rounded-2xl border border-border bg-surface p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-muted">Profile</p>
                      <p className="mt-2 text-sm text-text">{user.email}</p>
                      <p className="text-xs text-muted">Member since {user.createdAt.slice(0, 10)}</p>
                      <button
                        onClick={async () => {
                          setClaiming(true);
                          try {
                            const res = await claimLegacyWords();
                            toast(`Restored ${res.claimed} legacy words`, "success");
                          } catch (error) {
                            toast("Failed to restore legacy words", "error");
                          } finally {
                            setClaiming(false);
                          }
                        }}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface2 px-4 py-2 text-sm text-text transition hover:border-accent hover:text-accent"
                      >
                        {claiming ? "Restoring..." : "Restore legacy words"}
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent2 bg-accent2/15 px-4 py-2 text-sm text-accent2 transition hover:bg-accent2/25"
                      >
                        <FiLogOut /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
        <div className="h-[2px] w-full bg-[linear-gradient(90deg,rgb(var(--accent)),transparent,rgba(var(--accent2),0.6))]" />
      </header>
      <main className="flex-1">{children}</main>
      <ToastHost />
      <AuthModal />
    </div>
  );
}
