"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FiBarChart2,
  FiBookOpen,
  FiChevronDown,
  FiHome,
  FiInfo,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiPlusCircle,
  FiUser,
  FiX,
  FiZap
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth, useUser } from "@clerk/nextjs";
import ToastHost from "./ToastHost";
import { ApiError, claimLegacyWords } from "../lib/api";
import { toast } from "../lib/toast";

const primaryLinks = [
  { href: "/", label: "Today", icon: FiHome },
  { href: "/add", label: "Add words", icon: FiPlusCircle },
  { href: "/quiz", label: "Quiz", icon: FiZap }
];

const secondaryLinks = [
  { href: "/words", label: "Words", icon: FiBookOpen },
  { href: "/guide", label: "Guide", icon: FiInfo },
  { href: "/stats", label: "Stats", icon: FiBarChart2 }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const message = window.sessionStorage.getItem("post-login-toast");
    if (!message) {
      return;
    }

    toast(message, "success");
    window.sessionStorage.removeItem("post-login-toast");
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  async function restoreLegacy() {
    setClaiming(true);
    try {
      const res = await claimLegacyWords();
      toast(`Restored ${res.claimed} legacy words`, "success");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to restore legacy words";
      toast(message, "error");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative z-20 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-[radial-gradient(circle_at_top,#4fffb01f,transparent_70%)]">
              <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
                <path d="M32 6l18 10v20l-18 22-18-22V16L32 6z" fill="none" stroke="rgb(var(--accent))" strokeWidth="2.5" />
                <path d="M20 24l12 22 12-22" fill="none" stroke="rgb(var(--accent3))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="32" cy="22" r="3" fill="rgb(var(--accent2))" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block truncate font-display text-xl tracking-widest text-accent">Vocaura</span>
              <span className="block truncate font-mono text-xs uppercase tracking-[0.3em] text-muted">Vocab Lab</span>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <nav className="flex items-center gap-2 rounded-full border border-border/60 bg-surface/50 p-1 text-sm">
              {primaryLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-text transition hover:border-accent hover:text-accent"
                  >
                    <Icon /> {item.label}
                  </Link>
                );
              })}

              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-text transition hover:border-accent hover:text-accent"
                >
                  More <FiChevronDown className={`transition ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      className="absolute right-0 top-full mt-3 w-48 rounded-2xl border border-border bg-surface p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                    >
                      {secondaryLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMoreOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text transition hover:bg-surface2 hover:text-accent"
                          >
                            <Icon /> {item.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-text transition hover:border-accent hover:text-accent"
                >
                  <FiLogIn /> Login
                </Link>
                <Link
                  href="/login?mode=sign-up"
                  className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent/10 px-4 py-2 text-accent transition hover:bg-accent/20"
                >
                  <FiUser /> Sign up
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-text transition hover:border-accent hover:text-accent"
                >
                  <FiUser />
                  <span className="max-w-[160px] truncate">{user.primaryEmailAddress?.emailAddress}</span>
                  <FiChevronDown className={`transition ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-64 rounded-2xl border border-border bg-surface p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-muted">Profile</p>
                      <p className="mt-2 text-sm text-text">{user.primaryEmailAddress?.emailAddress}</p>
                      <p className="text-xs text-muted">
                        Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString("mn-MN") : "-"}
                      </p>
                      <button
                        onClick={restoreLegacy}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-border bg-surface2 px-4 py-2 text-sm text-text transition hover:border-accent hover:text-accent"
                      >
                        {claiming ? "Restoring..." : "Restore legacy words"}
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut();
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

          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-full border border-border p-3 text-text transition hover:border-accent hover:text-accent lg:hidden"
          >
            {mobileNavOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-t border-border/70 px-4 py-4 sm:px-6 lg:hidden"
            >
              <div className="mx-auto flex max-w-6xl flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[...primaryLinks, ...secondaryLinks].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text transition hover:border-accent hover:text-accent"
                      >
                        <Icon /> {item.label}
                      </Link>
                    );
                  })}
                </div>

                {!user ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileNavOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm text-text transition hover:border-accent hover:text-accent"
                    >
                      <FiLogIn /> Login
                    </Link>
                    <Link
                      href="/login?mode=sign-up"
                      onClick={() => setMobileNavOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-accent bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20"
                    >
                      <FiUser /> Sign up
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <p className="text-sm text-text">{user.primaryEmailAddress?.emailAddress}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        onClick={async () => {
                          await restoreLegacy();
                          setMobileNavOpen(false);
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-text transition hover:border-accent hover:text-accent"
                      >
                        {claiming ? "Restoring..." : "Restore words"}
                      </button>
                      <button
                        onClick={() => {
                          setMobileNavOpen(false);
                          signOut();
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-accent2 bg-accent2/15 px-4 py-3 text-sm text-accent2 transition hover:bg-accent2/25"
                      >
                        <FiLogOut /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-[2px] w-full bg-[linear-gradient(90deg,rgb(var(--accent)),transparent,rgba(var(--accent2),0.6))]" />
      </header>
      <main className="flex-1">{children}</main>
      <ToastHost />
    </div>
  );
}
