"use client";

import { createContext, ReactNode, useContext } from "react";

const DealerModeContext = createContext({ isDealer: true, showPrices: true, showCostPrice: true });

export function DealerModeProvider({ children }: { children: ReactNode }) {
  return (
    <DealerModeContext.Provider value={{ isDealer: true, showPrices: true, showCostPrice: true }}>
      {children}
    </DealerModeContext.Provider>
  );
}

export function useDealerMode() {
  return useContext(DealerModeContext);
}

