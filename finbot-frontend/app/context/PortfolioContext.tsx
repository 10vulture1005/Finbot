"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPortfolio, getHistory, getCurrentUser, PortfolioStock, PortfolioHistoryItem, UserPortfolioData } from "@/app/services/portfolioService";

interface PortfolioContextType {
  portfolio: PortfolioStock[];
  history: PortfolioHistoryItem[];
  user: UserPortfolioData | null;
  loading: boolean;
  error: string | null;
  refreshPortfolio: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [history, setHistory] = useState<PortfolioHistoryItem[]>([]);
  const [user, setUser] = useState<UserPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const [u, p, h] = await Promise.all([
            getCurrentUser(),
            getPortfolio(),
            getHistory()
        ]);
        setUser(u || null);
        setPortfolio(Array.isArray(p) ? p : []);
        setHistory(Array.isArray(h) ? h : []);
    } catch (e: any) {
        console.error("Context fetch failed", e);
        setError("Failed to load portfolio data.");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshPortfolio = useCallback(async () => {
      // Background refresh without setting loading to true for better UX
      try {
          const [p, h] = await Promise.all([
              getPortfolio(),
              getHistory()
          ]);
          setPortfolio(Array.isArray(p) ? p : []);
          setHistory(Array.isArray(h) ? h : []);
      } catch (e) {
          console.error("Refresh failed", e);
      }
  }, []);

  return (
    <PortfolioContext.Provider value={{ portfolio, history, user, loading, error, refreshPortfolio }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
