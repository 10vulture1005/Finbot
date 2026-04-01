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

export interface RiskAnalysisResult {
  text: string;
  risk_score: "Low" | "Medium" | "High";
  generated_at: string;
  holdings_count: number;
}

export const analyzePortfolio = async () => {
  const response = await api.post("/quant/analyze");
  return response; // Return full APIResponse
};

export const executeRebalance = async (targetWeights: Record<string, number>) => {
  const response = await api.post("/quant/rebalance", { target_weights: targetWeights });
  console.log(response.data ,"rebalance");
  return response.data as RebalanceExecutionResult;
};

export const getRiskAnalysis = async (): Promise<RiskAnalysisResult | null> => {
  const response = await api.get("/quant/risk-analysis");
  return (response.data as any)?.data ?? null;
};

export const generateRiskAnalysis = async (): Promise<RiskAnalysisResult> => {
  const response = await api.post("/quant/risk-analysis");
  const data = response.data as any;
  if (!data?.success) {
    throw new Error(data?.error || "Risk analysis failed");
  }
  return data.data as RiskAnalysisResult;
};

