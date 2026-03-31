import api from "./api";

export interface AIAnalysisResult {
  weights: Record<string, number>;
  details: { symbol: string; weight: number; reasoning: string }[];
  expected_return?: number;
  expected_volatility?: number;
  sharpe_ratio?: number;
}

export interface RebalanceExecutionResult {
  status: string;
  trades: string[];
  message?: string;
}

export const analyzePortfolio = async () => {
  const response = await api.post("/quant/analyze");
  console.log(response.data,"data");
  return response; // Return full APIResponse
};

export const executeRebalance = async (targetWeights: Record<string, number>) => {
  const response = await api.post("/quant/rebalance", { target_weights: targetWeights });
  console.log(response.data ,"rebalance");
  return response.data as RebalanceExecutionResult;
};
