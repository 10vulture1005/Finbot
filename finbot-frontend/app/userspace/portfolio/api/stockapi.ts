import { mockStockList } from "../data/mockdata";
import { Stock, StockDetails, ChartDataPoint } from "../type/stock";

const generateChartData = (base: number): ChartDataPoint[] => {
  let price = base * 0.9;
  return Array.from({ length: 30 }, (_, i) => {
    price += (Math.random() - 0.45) * base * 0.02;
    return { date: `Day ${i + 1}`, price: Math.round(price * 100) / 100 };
  });
};

export class StockAPI {
  static async fetchStockList(query = ""): Promise<Stock[]> {
    await new Promise(r => setTimeout(r, 300));
    return query
      ? mockStockList.filter(
          s =>
            s.symbol.toLowerCase().includes(query.toLowerCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase())
        )
      : mockStockList;
  }

  static async fetchStockDetails(symbol: string): Promise<StockDetails> {
    await new Promise(r => setTimeout(r, 400));
    const stock = mockStockList.find(s => s.symbol === symbol)!;

    return {
      ...stock,
      high: stock.price * 1.05,
      low: stock.price * 0.95,
      open: stock.price * 0.98,
      previousClose: stock.price - stock.change,
      volume: "12.3M",
      marketCap: "8.5T",
      pe: 28,
      chartData: generateChartData(stock.price),
    };
  }
}
