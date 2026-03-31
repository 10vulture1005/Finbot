import api from "./api";

export interface PortfolioActionPayload {
  action: "rebalance" | "risk_rebalance";
  mode: "dry_run" | "execute";
  reason: "manual" | "scheduled" | "drift";
}

export interface RebalanceResponse {
  executed: boolean;
  vol_before?: number;
  vol_after?: number;
  turnover?: number;
  drift_detected: boolean;
  explanation: string;
  current_weights?: Record<string, number>;
  new_weights?: Record<string, number>;
  metrics?: {
    expected_return?: number;
    expected_volatility?: number;
  };
  validation?: {
    volatility_before: number;
    volatility_after: number;
    sharpe_before: number;
    sharpe_after: number;
    max_drawdown_before: number;
    max_drawdown_after: number;
  };
}

// NOTE: Using /api/v1/portfolio based on backend implementation
// The user_id parameter in triggerRebalance should match the current user's ID
// or the backend should be adjusted to infer it. 
// For this implementation, we assume the frontend passes the user ID or we use 'me' if supported?
// The backend route is `POST /api/v1/portfolio/{user_id}/actions`.

export interface PortfolioStock {
    id: number;
    symbol: string;
    quantity: number;
    avg_price: number;
    // Risk
    risk_contribution?: number;
    volatility?: number;
    weight_target?: number;
    weight_drift?: number;
    // Market
    current_price?: number;
    market_value?: number;
    sector?: string;
    daily_return?: number;
}

export interface UserPortfolioData {
    id: number;
    email: string;
    is_active: boolean;
    is_admin: boolean;
    // Portfolio fields
    target_volatility?: number;
    rebalance_frequency?: string;
    rebalance_threshold?: number;
    last_rebalance_at?: string;
    risk_model_version?: string;
}

export const getPortfolio = async () => {
  const response = await api.get("/portfolio");
  return (response.data || []) as PortfolioStock[]; 
};

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data as UserPortfolioData;
};

export const triggerRebalance = async (payload: PortfolioActionPayload) => {
  const response = await api.post(`/portfolio/actions`, payload);
  return response.data as RebalanceResponse;
};

export const addStock = async (stock: { symbol: string; quantity: number; avg_price: number; purchase_date?: string }) => {
  const response = await api.post("/portfolio", stock);
  return response.data;
};

export const updateStock = async (id: number, stock: { quantity: number; avg_price: number; }) => {
  const response = await api.put(`/portfolio/${id}`, stock);
  return response.data;
};

export const deleteStock = async (id: number) => {
  await api.delete(`/portfolio/${id}`);
};

export const deleteAllStocks = async () => {
  await api.delete("/portfolio");
};

export const runQuantAnalysis = async () => {
  const response = await api.post('/quant/analyze', {});
  return response.data;
};

export interface PortfolioHistoryItem {
  date: string;
  total_value: number;
  daily_return?: number;
}

export const getHistory = async () => {
    const response = await api.get('/portfolio/history');
    return (response.data || []) as PortfolioHistoryItem[];
};
