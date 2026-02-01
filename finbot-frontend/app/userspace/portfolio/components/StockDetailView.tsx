"use client";
import { useEffect, useState } from "react";
import { StockAPI } from "../api/stockapi";
import { StockDetails, PortfolioStock } from "../type/stock";

interface Props {
  stock: PortfolioStock;
  onBack: () => void;
}

export default function StockDetailView({ stock, onBack }: Props) {
  const [details, setDetails] = useState<StockDetails | null>(null);

  useEffect(() => {
    StockAPI.fetchStockDetails(stock.symbol).then(setDetails);
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
