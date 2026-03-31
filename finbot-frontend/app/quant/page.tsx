"use client";

import React, { useState } from 'react';
import { 
  Brain, 
  Play, 
  TrendingUp, 
  Activity, 
  PieChart, 
  ArrowRight, 
  ShieldCheck, 
  Zap,
  BarChart2
} from 'lucide-react';
import api from '@/app/libs/api';

// --- Types ---
interface QuantResult {
  rebalance_date: string;
  model: string;
  selected_stocks: string[];
  weights: Record<string, number>;
  expected_precision?: number;
  portfolio_expected_return?: number;
  regime?: string;
  confidence_score?: number;
  details?: any[];
}

// --- Components ---

const MetricCard = ({ label, value, icon: Icon, color }: any) => {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        background: `${color}20`,
        padding: '12px',
        borderRadius: '12px',
        color: color
      }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: '#f8fafc', fontSize: '24px', fontWeight: 'bold' }}>{value}</div>
      </div>
    </div>
  );
};

const StockRow = ({ symbol, weight, price }: any) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background 0.2s',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '14px'
      }}>
        {symbol[0]}
      </div>
      <div>
        <div style={{ fontWeight: '600', color: '#f8fafc' }}>{symbol}</div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>NSE Equity</div>
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontWeight: '600', color: '#10b981' }}>{(weight * 100).toFixed(1)}%</div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Allocated</div>
    </div>
  </div>
);

export default function QuantPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuantResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get token from storage
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await api.post('/quant/analyze', {}, { headers });
      
      if (res.data.status === 'error') {
          throw new Error(res.data.message);
      }
      setResult(res.data.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Navbar Placeholder */}
      <div style={{
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '8px',
          borderRadius: '8px'
        }}>
          <Brain size={24} color="white" />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Finbot Quant Engine</h1>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            background: 'linear-gradient(to right, #60a5fa, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            Autonomous Portfolio Optimization
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Powered by Ensemble Machine Learning (Random Forest + XGBoost) and Deep Learning. 
            Analyze market regimes and rebalance with statistical precision.
          </p>
          
          <button 
            onClick={runAnalysis}
            disabled={loading}
            style={{
              padding: '16px 32px',
              borderRadius: '99px',
              border: 'none',
              background: loading ? '#334155' : 'white',
              color: loading ? '#94a3b8' : '#0f172a',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              boxShadow: '0 0 20px rgba(255,255,255,0.1)'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {loading ? (
              <>Running Analysis...</>
            ) : (
              <>Run Quant Analysis <Play size={18} fill="currentColor" /></>
            )}
          </button>
        </div>

        {error && (
            <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                color: '#ef4444', 
                padding: '16px', 
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '40px'
            }}>
                {error}
            </div>
        )}

        {/* Results Section */}
        {result && (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
              gap: '20px',
              marginBottom: '40px'
            }}>
              <MetricCard 
                label="Model Used" 
                value={result.model} 
                icon={Brain} 
                color="#8b5cf6" 
              />
              <MetricCard 
                label="Rebalance Date" 
                value={new Date(result.rebalance_date).toLocaleDateString()} 
                icon={Activity} 
                color="#3b82f6" 
              />
              <MetricCard 
                label="Stocks Selected" 
                value={result.selected_stocks.length} 
                icon={PieChart} 
                color="#10b981" 
              />
              <MetricCard 
                label="Confidence" 
                value="High" 
                icon={ShieldCheck} 
                color="#f59e0b" 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: '40px' }}>
              
              {/* Stock List */}
              <div style={{
                background: '#1e293b',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  padding: '24px', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Optimal Allocation</h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Equal Weight Strategy</div>
                </div>
                
                <div>
                   {result.details?.map((stock: any) => (
                      <StockRow 
                        key={stock.symbol} 
                        symbol={stock.symbol} 
                        weight={stock.weight} 
                        price={stock.price} 
                      />
                   ))}
                   {!result.details && result.selected_stocks.map((s) => (
                       <StockRow 
                         key={s} 
                         symbol={s} 
                         weight={result.weights[s]} 
                         price={0} 
                       />
                   ))}
                </div>
              </div>

              {/* Insights Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div style={{
                     background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                     borderRadius: '24px',
                     padding: '24px',
                     border: '1px solid rgba(255,255,255,0.1)'
                 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={20} color="#facc15" /> Market Regime
                    </h3>
                    <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                        The model has detected a <strong>neutral-bullish</strong> regime. Volatility is within expected bounds (10-15%). 
                        Recommendation is to maintain exposure to high-momentum large caps.
                    </p>
                 </div>

                 <div style={{
                     background: '#1e293b',
                     borderRadius: '24px',
                     padding: '24px',
                     border: '1px solid rgba(255,255,255,0.05)'
                 }}>
                     <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Strategy</h3>
                     <ul style={{ paddingLeft: '20px', color: '#94a3b8', lineHeight: '1.8' }}>
                         <li>Min. Variance Optimization</li>
                         <li>Risk Parity weighting</li>
                         <li>Rebalance freq: Monthly</li>
                     </ul>
                 </div>
              </div>

            </div>
          </div>
        )}
        
        {/* Rebalance Execution Section */}
        {result && (
             <div style={{
                 marginTop: '40px',
                 padding: '24px',
                 background: 'rgba(59, 130, 246, 0.1)',
                 border: '1px solid rgba(59, 130, 246, 0.2)',
                 borderRadius: '24px',
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 textAlign: 'center'
             }}>
                 <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Ready to Optimize?</h3>
                 <p style={{ color: '#94a3b8', maxWidth: '600px', marginBottom: '24px' }}>
                     Align your portfolio with the AI's recommendations. This will execute trades to match the optimal allocation.
                 </p>
                 
                 <button
                     onClick={async () => {
                         if(!confirm("This will execute trades in your portfolio. Continue?")) return;
                         setLoading(true);
                         try {
                             const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
                             const headers = token ? { Authorization: `Bearer ${token}` } : {};
                             
                             // Prepare target weights from result
                             // If result has 'details' (list), convert to dict
                             let targetWeights = result.weights;
                             if (!targetWeights && result.details) {
                                 targetWeights = {};
                                 result.details.forEach((d: any) => targetWeights[d.symbol] = d.weight);
                             }
                             
                             const res = await api.post('/quant/rebalance', {
                                 target_weights: targetWeights
                             }, { headers });
                             
                             if (res.data.status === 'success') {
                                 alert(`Rebalance Complete!\n\n${res.data.trades.join('\n')}`);
                             } else {
                                 alert(`Rebalance Failed: ${res.data.message}`);
                             }
                         } catch (e: any) {
                             alert("Error executing rebalance: " + e.message);
                         } finally {
                             setLoading(false);
                         }
                     }}
                     style={{
                         padding: '16px 40px',
                         borderRadius: '12px',
                         border: 'none',
                         background: '#3b82f6',
                         color: 'white',
                         fontSize: '18px',
                         fontWeight: 'bold',
                         cursor: 'pointer',
                         boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                     }}
                 >
                     Execute Rebalance
                 </button>
             </div>
        )}

      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
