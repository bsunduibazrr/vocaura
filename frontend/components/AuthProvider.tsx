"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { fetchMe, login, register } from "../lib/api";
import { toast } from "../lib/toast";

export type AuthUser = { id: string; email: string; createdAt: string };
type AuthMode = "login" | "register";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  modalOpen: boolean;
  mode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "vocaura_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const openAuth = useCallback((nextMode?: AuthMode) => {
    if (nextMode) setMode(nextMode);
    setModalOpen(true);
  }, []);

  const closeAuth = useCallback(() => setModalOpen(false), []);

  const loadMe = useCallback(async () => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch (error) {
      window.localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    const handler = () => openAuth("login");
    window.addEventListener("vocaura:auth-required", handler);
    return () => window.removeEventListener("vocaura:auth-required", handler);
  }, [openAuth]);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const result = await login({ email, password });
    window.localStorage.setItem(TOKEN_KEY, result.token);
    await loadMe();
    setModalOpen(false);
    toast("Logged in successfully", "success");
  }, [loadMe]);

  const registerWithPassword = useCallback(async (email: string, password: string) => {
    const result = await register({ email, password });
    window.localStorage.setItem(TOKEN_KEY, result.token);
    await loadMe();
    setModalOpen(false);
    toast("Signed up successfully", "success");
  }, [loadMe]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      modalOpen,
      mode,
      openAuth,
      closeAuth,
      loginWithPassword,
      registerWithPassword,
      logout
    }),
    [user, loading, modalOpen, mode, openAuth, closeAuth, loginWithPassword, registerWithPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
