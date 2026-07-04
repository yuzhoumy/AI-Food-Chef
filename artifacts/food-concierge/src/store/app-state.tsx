import { createContext, useContext, useState, ReactNode } from "react";
import { RecommendationRequest, RecommendationResult } from "@workspace/api-client-react";

interface AppStateContextType {
  currentRequest: RecommendationRequest | null;
  setCurrentRequest: (req: RecommendationRequest | null) => void;
  lastResult: RecommendationResult | null;
  setLastResult: (res: RecommendationResult | null) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [currentRequest, setCurrentRequest] = useState<RecommendationRequest | null>(null);
  const [lastResult, setLastResult] = useState<RecommendationResult | null>(null);

  return (
    <AppStateContext.Provider
      value={{
        currentRequest,
        setCurrentRequest,
        lastResult,
        setLastResult,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
