import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";
import type { User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("ap_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const me = await authApi.me();
    setUser(me);
    localStorage.setItem("ap_user", JSON.stringify(me));
  }

  useEffect(() => {
    const token = localStorage.getItem("ap_token");
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => {
        localStorage.removeItem("ap_token");
        localStorage.removeItem("ap_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, user: loggedIn } = await authApi.login(email, password);
    localStorage.setItem("ap_token", token);
    localStorage.setItem("ap_user", JSON.stringify(loggedIn));
    setUser(loggedIn);
    return loggedIn;
  }

  function logout() {
    localStorage.removeItem("ap_token");
    localStorage.removeItem("ap_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
