"use client";
import { PortfolioStock } from "../type/stock";
import { formatCurrency } from "../utils/format";

interface Props {
  holding: PortfolioStock;
  onClick: () => void;
  onDelete: () => void;
}

export default function StockCard({ holding, onClick, onDelete }: Props) {
  return (
    <div onClick={onClick}>
      <h3>{holding.symbol}</h3>
      <p>{formatCurrency(holding.totalValue)}</p>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
}
