"use client";
import { useEffect, useState } from "react";
import { getQuote, StockQuote } from "@/app/services/marketService";

// Define locally if missing
interface PortfolioStock {
    symbol: string;
    // Add other fields if used, but for now symbol is enough
}

interface Props {
  stock: PortfolioStock;
  onBack: () => void;
}

export default function StockDetailView({ stock, onBack }: Props) {
  const [details, setDetails] = useState<StockQuote | null>(null);

  useEffect(() => {
    getQuote(stock.symbol).then(setDetails);
  }, [stock.symbol]);

  if (!details) return <div>Loading…</div>;

  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h1>{details.symbol}</h1>
      <p>{details.price}</p>
    </div>
  );
}
