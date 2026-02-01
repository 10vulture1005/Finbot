"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

// Helper to load external scripts simply
const useScript = (src: string, containerId: string, onLoad?: () => void) => {
    useEffect(() => {
         if (document.getElementById(containerId)?.querySelector("script")) return;

         const script = document.createElement('script');
         script.src = src;
         script.async = true;
         script.type = 'text/javascript';
         if (onLoad) script.onload = onLoad;
         
         document.getElementById(containerId)?.appendChild(script);

         return () => {
             // cleanup if needed
         }
    }, [src, containerId, onLoad]);
}


export default function AnalysisPage() {
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");
  const containerRef = useRef<HTMLDivElement>(null);

  // TradingView Widget Embed Logic
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true, // Allow user to change symbol in widget
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });
    
    containerRef.current.appendChild(script);

  }, [symbol]); // Re-run when symbol changes via our input (optional)


  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      // Logic to parse input to TV format if needed
      // ensuring uppercase
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* Header & Search */}
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm shrink-0">
          <div>
              <h1 className="text-xl font-bold tracking-tight">Technical Analysis</h1>
              <p className="text-sm text-muted-foreground">Advanced charting provided by TradingView.</p>
          </div>
           <form onSubmit={handleSearch} className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                    type="text" 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="Search Symbol (e.g. NASDAQ:TSLA)" 
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                />
           </form>
      </div>

      {/* TradingView Widget Container */}
      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden relative">
          <div className="absolute inset-0" id="tradingview_widget_container">
               <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
                    <div className="tradingview-widget-container__widget h-full w-full"></div>
               </div>
          </div>
      </div>

    </div>
  );
}
