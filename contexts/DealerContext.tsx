"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  type DealerUser,
  dealerLogin,
  getDealerSession,
  dealerLogout,
  hasDealerCookie,
} from "@/lib/dealer-auth";

interface DealerContextValue {
  dealer: DealerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DealerContext = createContext<DealerContextValue>({
  dealer: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, error: "Context not initialized" }),
  logout: async () => {},
  refresh: async () => {},
});

export function DealerProvider({ children }: { children: ReactNode }) {
  const [dealer, setDealer] = useState<DealerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        if (hasDealerCookie()) {
          const session = await getDealerSession();
          if (session) {
            setDealer(session);
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const result = await dealerLogin(email);
      if (result.success && result.dealer) {
        setDealer(result.dealer);
        return { success: true };
      }
      return { success: false, error: result.error || "Login failed" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await dealerLogout();
    setDealer(null);
  }, []);

  const refresh = useCallback(async () => {
    const session = await getDealerSession();
    if (session) {
      setDealer(session);
    } else {
      setDealer(null);
    }
  }, []);

  return (
    <DealerContext.Provider
      value={{
        dealer,
        isLoading,
        isAuthenticated: dealer !== null,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </DealerContext.Provider>
  );
}

export function useDealer() {
  return useContext(DealerContext);
}
