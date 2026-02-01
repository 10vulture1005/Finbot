import api from "@/app/libs/api";

export interface PortfolioActionPayload {
  action: "rebalance";
  mode: "dry_run" | "execute";
  reason: "manual" | "scheduled" | "drift";
}

export interface RebalanceResponse {
  executed: boolean;
  vol_before: number;
  vol_after: number;
  turnover?: number;
  drift_detected: boolean;
  explanation: string;
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

// ... (imports)

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

export const getPortfolio = async (user_id?: number) => {
  // Currently backend GET /api/v1/portfolio/ uses current user from token
  const response = await api.get("/portfolio/");
  return response.data as PortfolioStock[]; 
};

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data as UserPortfolioData;
};

export const triggerRebalance = async (user_id: number, payload: PortfolioActionPayload) => {
  const response = await api.post(`/portfolio/${user_id}/actions`, payload);
  return response.data as RebalanceResponse;
};

export const addStock = async (symbol: string, quantity: number, avg_price: number) => {
  const response = await api.post("/portfolio/", { symbol, quantity, avg_price });
  return response.data;
};
