"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// =============================================================================
// TYPES
// =============================================================================
export type AppMode = "public" | "partner";

interface ModeContextValue {
  mode: AppMode;
  showPrices: boolean;
}

// =============================================================================
// CONTEXT
// =============================================================================
const ModeContext = createContext<ModeContextValue>({ mode: "public", showPrices: false });

// =============================================================================
// PROVIDER
// =============================================================================
export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("public");
  const [isDealer, setIsDealer] = useState(false);

  useEffect(() => {
    // Read mode from URL parameter
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get("mode");
    if (urlMode === "partner" || urlMode === "public") {
      setMode(urlMode);
    }

    fetch("/api/dealer/auth/me")
      .then((response) => setIsDealer(response.ok))
      .catch(() => setIsDealer(false));
  }, []);

  const showPrices = mode === "partner" || isDealer;

  return (
    <ModeContext.Provider value={{ mode, showPrices }}>
      {children}
    </ModeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useMode() {
  return useContext(ModeContext);
}
