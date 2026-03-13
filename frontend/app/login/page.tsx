"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../components/AuthProvider";

export default function LoginPage() {
  const { openAuth } = useAuth();

  useEffect(() => {
    openAuth("login");
  }, [openAuth]);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-surface p-8 space-y-4"
      >
        <h1 className="font-display text-2xl">Login</h1>
        <p className="text-sm text-muted">
          The login modal is open. If you closed it, click the login button in the header.
        </p>
      </motion.div>
    </div>
  );
}
