"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiX, FiMail, FiLock, FiUserPlus, FiLogIn } from "react-icons/fi";
import { useAuth } from "./AuthProvider";

export default function AuthModal() {
  const reduceMotion = useReducedMotion();
  const { modalOpen, mode, closeAuth, openAuth, loginWithPassword, registerWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    closeAuth();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        await loginWithPassword(email.trim(), password);
      } else {
        await registerWithPassword(email.trim(), password);
      }
      resetForm();
    } catch (err: any) {
      setError(mode === "login" ? "Login failed. Check your credentials." : "Signup failed. Try a different email.");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setError(null);
    setSubmitting(false);
  }, [mode, modalOpen]);

  return (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close auth modal"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96, rotateX: 8 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4fffb022,transparent_60%)]" />
            <div className="relative space-y-6 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Vocaura</p>
                  <h2 className="font-display text-2xl">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-full border border-border bg-surface2 p-2 text-muted transition hover:border-accent hover:text-accent"
                >
                  <FiX />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-full border border-border bg-surface2 p-1 text-xs">
                <button
                  onClick={() => openAuth("login")}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "login" ? "bg-accent/20 text-accent" : "text-muted hover:text-text"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <FiLogIn /> Login
                  </span>
                </button>
                <button
                  onClick={() => openAuth("register")}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "register" ? "bg-accent/20 text-accent" : "text-muted hover:text-text"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <FiUserPlus /> Sign up
                  </span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm text-muted">Email</label>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface2 px-4 py-3">
                  <FiMail className="text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="flex-1 bg-transparent text-text outline-none"
                  />
                </div>
                <label className="block text-sm text-muted">Password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface2 px-4 py-3">
                  <FiLock className="text-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-text outline-none"
                  />
                </div>
                {error && <p className="text-sm text-accent2">{error}</p>}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-2xl border border-accent bg-accent/15 px-4 py-3 text-sm font-semibold text-accent transition hover:bg-accent/25 disabled:opacity-60"
                >
                  {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
                </motion.button>
              </form>
              <p className="text-xs text-muted">
                By continuing, you agree to keep your vocabulary streak alive.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
