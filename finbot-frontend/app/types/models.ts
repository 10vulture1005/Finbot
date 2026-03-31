export interface User {
    id: number;
    email: string;
    name: string;
    is_active: boolean;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface PortfolioStock {
    id: number;
    symbol: string;
    quantity: number;
    avg_price: number;
    purchase_date?: string;
    
    // Risk Metrics
    risk_contribution?: number;
    volatility?: number;
    weight_target?: number;
    weight_drift?: number;
    
    // Market Data
    current_price?: number;
    market_value?: number;
    sector?: string;
    daily_return?: number;
}

export interface PortfolioHistory {
    date: string;
    total_value: number;
    daily_return?: number;
}

export interface PortfolioCreate {
    symbol: string;
    quantity: number;
    avg_price: number;
    purchase_date?: string;
}

export interface PortfolioUpdate {
    quantity: number;
    avg_price: number;
    purchase_date?: string;
}
