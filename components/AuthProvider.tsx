"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Me } from "@/types/api";

interface AuthContextType {
  user: Me | null;
  loading: boolean;
  refreshUser: () => Promise<Me | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<Me | null> => {
    try {
      const data = await api.me();
      setUser(data);
      return data;
    } catch (err) {
      // 401 is expected when logged out — not an error worth surfacing.
      if (!(err instanceof ApiError) || err.status !== 401) {
        // Any other failure: treat as logged out but let callers see it.
      }
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch the current user once on mount. State is only updated after the
    // async request resolves (inside refreshUser), never synchronously here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
