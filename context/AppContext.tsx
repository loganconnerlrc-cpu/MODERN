import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ScanData {
  actualAmount: string;
  calTime: string;
}

export interface CalcResultData {
  dose: number;
  minutesDifference: number;
  isLater: boolean;
  decayFactor: number;
  unit: string;
  actualAmount: number;
  calTime: string;
  injectionTime: string;
}

interface AppContextType {
  scanData: ScanData | null;
  setScanData: (data: ScanData | null) => void;
  calcResult: CalcResultData | null;
  setCalcResult: (data: CalcResultData | null) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [calcResult, setCalcResult] = useState<CalcResultData | null>(null);

  const reset = () => {
    setScanData(null);
    setCalcResult(null);
  };

  return (
    <AppContext.Provider value={{ scanData, setScanData, calcResult, setCalcResult, reset }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
