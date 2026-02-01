export interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface PortfolioStock extends Stock {
  id: string;
  quantity: number;
  avgPrice: number;
  totalValue: number;
  totalInvestment: number;
  profitLoss: number;
  profitLossPercent: number;
  purchaseDate?: string;
}

export interface ChartDataPoint {
  date: string;
  price: number;
}

export interface StockDetails extends Stock {
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: string;
  marketCap: string;
  pe: number;
  chartData: ChartDataPoint[];
}
