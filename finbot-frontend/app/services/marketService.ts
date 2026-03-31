import api from "./api";

export interface StockResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    low: number;
    high: number;
}

export const searchStocks = async (query: string): Promise<StockResult[]> => {
  const response = await api.get<StockResult[]>(`/market/search?q=${query}`);
  return response.data || [];
};

export const getQuote = async (symbol: string): Promise<StockQuote> => {
    try {
        const response = await api.get<StockQuote>(`/market/quote/${symbol}`);
        return response.data || { symbol, price: 0, change: 0, changePercent: 0, low: 0, high: 0 };
    } catch (e) {
        console.error("Failed to fetch quote", e);
        return { symbol, price: 0, change: 0, changePercent: 0, low: 0, high: 0 };
    }
};
