"use client";
import { useState } from "react";
import { Stock, PortfolioStock } from "../type/stock";

interface Props {
  stock: Stock;
  onSave: (p: PortfolioStock) => void;
  onClose: () => void;
}

export default function AddStockModal({ stock, onSave, onClose }: Props) {
  const [qty, setQty] = useState("");

  const save = () => {
    const quantity = Number(qty);
    const holding: PortfolioStock = {
      ...stock,
      id: Date.now().toString(),
      quantity,
      avgPrice: stock.price,
      totalInvestment: quantity * stock.price,
      totalValue: quantity * stock.price,
      profitLoss: 0,
      profitLossPercent: 0,
    };
    onSave(holding);
    onClose();
  };

  return (
    <div>
      <h3>{stock.symbol}</h3>
      <input type="number" value={qty} onChange={e => setQty(e.target.value)} />
      <button onClick={save}>Add</button>
    </div>
  );
}
