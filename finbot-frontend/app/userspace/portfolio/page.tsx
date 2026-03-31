"use client"

import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, TrendingDown, Trash2, Sun, Moon, BarChart3, DollarSign, Calendar } from 'lucide-react';
import { getPortfolio, addStock, deleteStock, updateStock, triggerRebalance, runQuantAnalysis, getHistory, PortfolioStock as APIPortfolioStock, PortfolioHistoryItem } from '@/app/services/portfolioService';
import { toast } from 'sonner';
import { searchStocks, getQuote } from '@/app/services/marketService';
import AllocationChart from '@/components/AllocationChart';
import GrowthChart from '@/components/GrowthChart';


// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
}

// Extend API type for UI
interface PortfolioStock extends APIPortfolioStock {
  // Computed for UI
  name?: string;     // API might return string
  exchange?: string;
  price?: number;
  change?: number;
  changePercent?: number;

  totalValue?: number;
  totalInvested?: number;
  profitLoss?: number;
  profitLossPercent?: number;
}

// ============================================================================
// API
// ============================================================================



// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value);
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Rebalance Modal
const RebalanceModal = ({ onClose, onExecute, darkMode }: { onClose: () => void, onExecute: () => void, darkMode: boolean }) => {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
    const textColor = darkMode ? '#e2e8f0' : '#111827';
    const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
    const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

    useEffect(() => {
        runAnalysis();
    }, []);

    const runAnalysis = async () => {
        try {
            setLoading(true);
            const data = await triggerRebalance({
                action: 'rebalance',
                mode: 'dry_run',
                reason: 'manual'
            });
            setAnalysis(data);
            if (data.executed === false && !data.metrics && data.explanation) {
                 // Optimization failed or refused
            }
        } catch (e) {
            console.error(e);
            setError("Failed to run portfolio analysis.");
        } finally {
            setLoading(false);
        }
    }

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await triggerRebalance({
                action: 'rebalance',
                mode: 'execute',
                reason: 'manual'
            });
            onExecute(); // Refresh parent
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Failed to execute rebalance");
            setLoading(false);
        }
    }

    return (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={onClose}
        >
          <div 
            style={{
              backgroundColor: cardBg,
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '600px',
              width: '100%',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: textColor }}>Portfolio Rebalancer</h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor }}>
                <X size={24} />
              </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: mutedColor }}>
                    <div style={{ marginBottom: '10px' }}>Processing AI Analysis...</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Optimizing weights & generating explanation</div>
                </div>
            ) : error ? (
                 <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>{error}</div>
            ) : analysis ? (
                <div>
                     {/* AI Explanation Section */}
                     <div style={{ 
                         backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', 
                         padding: '16px', 
                         borderRadius: '12px',
                         marginBottom: '20px',
                         border: '1px solid rgba(59, 130, 246, 0.2)'
                     }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#3b82f6', fontWeight: '600' }}>
                             <TrendingUp size={16} /> AI Insight
                         </div>
                         <p style={{ fontSize: '14px', lineHeight: '1.5', color: textColor }}>
                             {analysis.explanation || "No explanation provided."}
                         </p>
                     </div>

                     {/* Metrics Grid */}
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                         <div style={{ padding: '12px', backgroundColor: darkMode ? '#2d3548' : '#f9fafb', borderRadius: '10px' }}>
                             <div style={{ fontSize: '12px', color: mutedColor }}>Expected Return</div>
                             <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
                                 {analysis.metrics?.expected_return ? (analysis.metrics.expected_return * 100).toFixed(2) + '%' : 'N/A'}
                             </div>
                         </div>
                         <div style={{ padding: '12px', backgroundColor: darkMode ? '#2d3548' : '#f9fafb', borderRadius: '10px' }}>
                             <div style={{ fontSize: '12px', color: mutedColor }}>Proj. Volatility</div>
                             <div style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b' }}>
                                 {analysis.metrics?.expected_volatility ? (analysis.metrics.expected_volatility * 100).toFixed(2) + '%' : 'N/A'}
                             </div>
                         </div>
                     </div>

                     {/* Holdings & Proposed Changes */}
                     {(analysis.new_weights || analysis.current_weights) && (
                         <div style={{ marginBottom: '24px' }}>
                             <h4 style={{ fontSize: '16px', fontWeight: '600', color: textColor, marginBottom: '12px' }}>Target Allocation</h4>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                 {Object.entries(
                                     (analysis.new_weights && Object.keys(analysis.new_weights).length > 0) 
                                     ? analysis.new_weights 
                                     : (analysis.current_weights || {})
                                 ).map(([symbol, weight]: [string, any]) => {
                                     const currentWeight = analysis.current_weights ? analysis.current_weights[symbol] || 0 : 0;
                                     const targetWeight = (analysis.new_weights && Object.keys(analysis.new_weights).length > 0) ? weight : currentWeight;
                                     const diff = targetWeight - currentWeight;
                                     return (
                                     <div key={symbol} style={{ 
                                         display: 'flex',
                                         justifyContent: 'space-between',
                                         padding: '10px 16px', 
                                         backgroundColor: darkMode ? '#2d3548' : '#f3f4f6', 
                                         borderRadius: '12px',
                                         fontSize: '14px',
                                         color: textColor,
                                         border: `1px solid ${borderColor}`
                                     }}>
                                         <span style={{ fontWeight: '600' }}>{symbol}</span>
                                         <div style={{ display: 'flex', gap: '16px' }}>
                                             <span style={{ color: mutedColor }}>Current: {(currentWeight * 100).toFixed(1)}%</span>
                                             <span style={{ fontWeight: '600' }}>Target: {(targetWeight * 100).toFixed(1)}%</span>
                                             {Math.abs(diff) > 0.001 && (
                                                <span style={{ color: diff > 0 ? '#10b981' : '#ef4444', width: '60px', textAlign: 'right' }}>
                                                    {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                                                </span>
                                             )}
                                         </div>
                                     </div>
                                 )})}
                             </div>
                         </div>
                     )}
                     
                     {!analysis.drift_detected && (
                         <div style={{ textAlign: 'center', marginBottom: '16px', color: mutedColor, fontSize: '14px' }}>
                             No significant drift detected. Recommended to HOLD.
                         </div>
                     )}

                     <button
                        onClick={handleConfirm}
                        disabled={!analysis.drift_detected}
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontSize: '15px',
                          fontWeight: '600',
                          borderRadius: '10px',
                          border: 'none',
                          background: analysis.drift_detected 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : mutedColor,
                          color: 'white',
                          cursor: analysis.drift_detected ? 'pointer' : 'not-allowed',
                          opacity: analysis.drift_detected ? 1 : 0.7
                        }}
                      >
                        {analysis.drift_detected ? 'Confirm Rebalance' : 'No Action Needed'}
                      </button>
                </div>
            ) : null}
          </div>
        </div>
    );
}

// Search Component
const SearchStock = ({ darkMode, onSelect }: { darkMode: boolean, onSelect: (stock: any) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  useEffect(() => {
    const searchStocksFn = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
          const stocks = await searchStocks(query);
          setResults(stocks);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
    };

    const debounce = setTimeout(searchStocksFn, 500);
    return () => clearTimeout(debounce);
  }, [query]);

  // Function to get quote when selecting
  const handleSelect = async (stock: any) => {
      try {
        const quote = await getQuote(stock.symbol);
        onSelect({ ...stock, ...quote });
      } catch (e) {
          console.error(e);
          // Fallback if quote fails
          onSelect(stock); 
      }
      setQuery('');
      setResults([]);
      setShowResults(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search 
          size={20} 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: mutedColor 
          }} 
        />
        <input
          type="text"
          placeholder="Search stocks (e.g., RELIANCE)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          style={{
            width: '100%',
            padding: '14px 14px 14px 44px',
            fontSize: '14px',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            backgroundColor: cardBg,
            color: textColor,
            outline: 'none',
            transition: 'all 0.2s'
          }}
        />
        {loading && <div style={{position: 'absolute', right: 12, top: 14, color: mutedColor}}>...</div>}
      </div>

      {showResults && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 50
        }}>
          {results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelect(stock)}
              style={{
                width: '100%',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: 'none',
                borderBottom: `1px solid ${borderColor}`,
                backgroundColor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#2d3548' : '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: textColor, marginBottom: '2px' }}>
                  {stock.symbol}
                </div>
                <div style={{ fontSize: '13px', color: mutedColor }}>{stock.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Add Stock Modal
const AddStockModal = ({ stock, darkMode, onClose, onSave }: { stock: any, darkMode: boolean, onClose: () => void, onSave: (data:any) => void }) => {
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState(stock?.price?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (stock?.price && !avgPrice) {
      setAvgPrice(stock.price.toString());
    }
  }, [stock?.price]);

  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  if (!stock) return null;

  const handleSave = () => {
    if (!quantity || !avgPrice) return;

    // Send backend payload structure
    const payload = {
      symbol: stock.symbol,
      quantity: parseFloat(quantity),
      avg_price: parseFloat(avgPrice),
      purchase_date: new Date(purchaseDate).toISOString()
    };

    onSave(payload);
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: cardBg,
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '500px',
          width: '100%',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: '700', color: textColor }}>Add to Portfolio</h3>
          <button onClick={onClose} style={{ 
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: mutedColor,
            padding: '4px',
            borderRadius: '6px',
            transition: 'background-color 0.2s'
          }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ 
          padding: '16px',
          backgroundColor: darkMode ? '#2d3548' : '#f9fafb',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: textColor, marginBottom: '4px' }}>
                {stock.symbol}
              </div>
              <div style={{ fontSize: '14px', color: mutedColor }}>{stock.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: textColor }}>
                {formatCurrency(stock.price || 0)}
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: (stock.change || 0) >= 0 ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'flex-end'
              }}>
                {(stock.change || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stock.changePercent?.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <BarChart3 size={16} /> Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: textColor }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <DollarSign size={16} /> Average Purchase Price (₹)
          </label>
          <input
            type="number"
            value={avgPrice}
            onChange={(e) => setAvgPrice(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: textColor }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Calendar size={16} /> Purchase Date
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: textColor }}
          />
        </div>

        <button
            onClick={handleSave}
            disabled={!quantity || !avgPrice}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              background: quantity && avgPrice 
                ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                : mutedColor,
              color: 'white',
              cursor: quantity && avgPrice ? 'pointer' : 'not-allowed',
            }}
          >
            Add to Portfolio
          </button>
      </div>
    </div>
  );
};

// Sell Stock Modal
const SellStockModal = ({ stock, darkMode, onClose, onConfirm }: { stock: PortfolioStock, darkMode: boolean, onClose: () => void, onConfirm: (quantity: number) => void }) => {
  const [sellQty, setSellQty] = useState(stock?.quantity?.toString() || '');
  const [error, setError] = useState('');

  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  if (!stock) return null;

  const handleConfirm = () => {
      const q = parseFloat(sellQty);
      if (isNaN(q) || q <= 0) {
          setError("Please enter a valid amount.");
          return;
      }
      if (q > stock.quantity) {
          setError(`You cannot sell more than you own (${stock.quantity}).`);
          return;
      }
      onConfirm(q);
  };

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: cardBg, borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%',
          border: `1px solid ${borderColor}`, boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: textColor }}>Sell {stock.symbol}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: mutedColor, marginBottom: '20px', fontSize: '14px' }}>
          You currently own <strong>{stock.quantity}</strong> shares of {stock.symbol}. How many would you like to sell?
        </p>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textColor }}>Quantity to Sell</label>
          <input
            type="number"
            step="any"
            value={sellQty}
            onChange={(e) => { setSellQty(e.target.value); setError(''); }}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: textColor }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{error}</div>}
        </div>

        <button
            onClick={handleConfirm}
            style={{
              width: '100%', padding: '12px', fontSize: '15px', fontWeight: '600',
              borderRadius: '10px', border: 'none',
              background: '#ef4444', color: 'white', cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Confirm Sell
          </button>
      </div>
    </div>
  );
};

// Buy Stock Modal
const BuyStockModal = ({ stock, darkMode, onClose, onConfirm }: { stock: PortfolioStock, darkMode: boolean, onClose: () => void, onConfirm: (quantity: number, price: number, date: string) => void }) => {
  const [buyQty, setBuyQty] = useState('');
  const [buyPrice, setBuyPrice] = useState(stock?.current_price?.toString() || stock?.avg_price?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  if (!stock) return null;

  const handleConfirm = () => {
      const q = parseFloat(buyQty);
      const p = parseFloat(buyPrice);
      if (isNaN(q) || q <= 0 || isNaN(p) || p <= 0) {
          setError("Please enter valid amount and price.");
          return;
      }
      onConfirm(q, p, purchaseDate);
  };

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: cardBg, borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%',
          border: `1px solid ${borderColor}`, boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: textColor }}>Buy more {stock.symbol}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textColor }}>Quantity to Buy</label>
          <input
            type="number"
            step="any"
            value={buyQty}
            onChange={(e) => { setBuyQty(e.target.value); setError(''); }}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: textColor }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textColor }}>Purchase Price (₹)</label>
          <input
            type="number"
            step="any"
            value={buyPrice}
            onChange={(e) => { setBuyPrice(e.target.value); setError(''); }}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: textColor }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textColor }}>Purchase Date</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => { setPurchaseDate(e.target.value); setError(''); }}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${borderColor}`, backgroundColor: cardBg, color: textColor }}
          />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}

        <button
            onClick={handleConfirm}
            style={{
              width: '100%', padding: '12px', fontSize: '15px', fontWeight: '600',
              borderRadius: '10px', border: 'none',
              background: '#10b981', color: 'white', cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Confirm Buy
          </button>
      </div>
    </div>
  );
};

// Stock Card Component
const StockCard = ({ holding, darkMode, onClick, onDelete, onBuy }: { holding: PortfolioStock, darkMode: boolean, onClick: () => void, onDelete: (id: number) => void, onBuy?: (id: number) => void }) => {
  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  // Calculations
  const currentPrice = holding.current_price || holding.avg_price; 
  const totalValue = holding.market_value || (holding.quantity * currentPrice);
  const totalInvested = holding.quantity * holding.avg_price;
  const pnl = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const isProfitable = pnl >= 0;

  return (
    <div 
      style={{
        backgroundColor: cardBg,
        borderRadius: '16px',
        padding: '20px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={onClick}
    >
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: textColor }}>{holding.symbol}</div>
             <div style={{ fontSize: '13px', color: mutedColor }}>{holding.name || holding.symbol} • Qty: {holding.quantity}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
              {onBuy && (
                  <button 
                     onClick={(e) => { e.stopPropagation(); onBuy(holding.id); }}
                     style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        height: 'fit-content'
                     }}
                  >
                     Buy
                  </button>
              )}
              <button 
                 onClick={(e) => { e.stopPropagation(); onDelete(holding.id); }}
                 style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    height: 'fit-content'
                 }}
              >
                 Sell
              </button>
          </div>
       </div>

       <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: mutedColor }}>Current Value</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: textColor }}>{formatCurrency(totalValue)}</div>
       </div>

       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ color: isProfitable ? '#10b981' : '#ef4444', fontWeight: '600' }}>
              {isProfitable ? '+' : ''}{formatCurrency(pnl)}
          </div>
          <div style={{ color: isProfitable ? '#10b981' : '#ef4444', fontWeight: '600' }}>
              {pnlPercent.toFixed(2)}%
          </div>
       </div>
    </div>
  );
}

// Main Page Component
const PortfolioPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [sellStockData, setSellStockData] = useState<PortfolioStock | null>(null);
  const [buyStockData, setBuyStockData] = useState<PortfolioStock | null>(null);
  const [holdings, setHoldings] = useState<PortfolioStock[]>([]);
  const [history, setHistory] = useState<PortfolioHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Load
  useEffect(() => {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      console.log("DEBUG: PortfolioPage mounted. Token found:", !!token);
      
      if (!token) {
          toast.error("No auth token found! Please Login again.");
          window.location.href = '/auth/login';
          return;
      }
      loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
      setLoading(true);
      try {
          const [portfolioData, historyData] = await Promise.all([
              getPortfolio(),
              getHistory()
          ]);
          setHoldings(portfolioData as PortfolioStock[]);
          setHistory(historyData);
      } catch (e: any) {
          console.error("Failed to load portfolio", e);
          const msg = e?.response?.data?.detail || e.message || "Unknown error";
          toast.error(`Failed to load portfolio: ${msg}`);
      } finally {
          setLoading(false);
      }
  }

  const handleCreatePortfolio = async (payload: any) => {
      try {
          await addStock(payload);
          await loadPortfolio(); // Reload
          setShowAddModal(false);
      } catch (e) {
          console.error(e);
          toast.error("Failed to add stock");
      }
  }

  const handleSellInitiate = (id: number) => {
      const stockToSell = holdings.find(h => h.id === id);
      if (stockToSell) {
          setSellStockData(stockToSell);
      }
  };

  const executePartialSell = async (quantityToSell: number) => {
      if (!sellStockData) return;
      try {
          if (quantityToSell >= sellStockData.quantity) {
              await deleteStock(sellStockData.id);
          } else {
              await updateStock(sellStockData.id, {
                  quantity: sellStockData.quantity - quantityToSell,
                  avg_price: sellStockData.avg_price // avg price doesn't change on sell
              });
          }
          await loadPortfolio();
          setSellStockData(null);
      } catch (e) {
          console.error(e);
          toast.error("Failed to process sell request.");
      }
  };

  const handleBuyInitiate = (id: number) => {
      const stockToBuy = holdings.find(h => h.id === id);
      if (stockToBuy) {
          setBuyStockData(stockToBuy);
      }
  };

  const executePartialBuy = async (quantityToBuy: number, price: number, date: string) => {
      if (!buyStockData) return;
      try {
          const newQty = buyStockData.quantity + quantityToBuy;
          // Calculate new average price
          const newAvgPrice = ((buyStockData.quantity * buyStockData.avg_price) + (quantityToBuy * price)) / newQty;
          
          await updateStock(buyStockData.id, {
              quantity: newQty,
              avg_price: newAvgPrice
          });
          
          await loadPortfolio();
          setBuyStockData(null);
      } catch (e) {
          console.error(e);
          toast.error("Failed to process buy request.");
      }
  };

    const handleRunQuant = async () => {
        try {
            setLoading(true);
            const res = await runQuantAnalysis();
            toast.success("Quant Analysis Result:\n" + JSON.stringify(res, null, 2));
        } catch (e) {
            console.error(e);
            toast.error("Failed to run Quant Analysis");
        } finally {
            setLoading(false);
        }
    }
 

  const totalValue = (holdings || []).reduce((sum, h) => sum + (h.market_value || (h.quantity * (h.current_price || h.avg_price))), 0);
  const totalInvested = (holdings || []).reduce((sum, h) => sum + (h.quantity * h.avg_price), 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#111827' : '#f9fafb', color: darkMode ? '#e2e8f0' : '#111827' }}>
        {/* Simple Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between' }}>
             <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>My Portfolio</h1>
             <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => setDarkMode(!darkMode)}>
                     {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                 </button>
             </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
             {/* Summary Card */}
             <div style={{ 
                 background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
                 padding: '30px', 
                 borderRadius: '20px', 
                 color: 'white',
                 marginBottom: '30px', 
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)'
             }}>
                 <div>
                     <div style={{ fontSize: '14px', opacity: 0.8 }}>Total Portfolio Value</div>
                     <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{formatCurrency(totalValue)}</div>
                     <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                         <div>
                             <div style={{ fontSize: '12px', opacity: 0.8 }}>Invested</div>
                             <div style={{ fontWeight: '600' }}>{formatCurrency(totalInvested)}</div>
                         </div>
                         <div>
                             <div style={{ fontSize: '12px', opacity: 0.8 }}>Total P&L</div>
                             <div style={{ fontWeight: '600', color: totalPnL >= 0 ? '#10b981' : '#ffcdd2' }}>
                                 {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} ({totalPnLPercent.toFixed(2)}%)
                             </div>
                         </div>
                     </div>
                 </div>
                 <div style={{ display: 'flex', gap: '10px' }}>



                     <button 
                         onClick={handleRunQuant}
                         style={{ 
                             backgroundColor: 'rgba(255,255,255,0.2)', 
                             color: 'white', 
                             padding: '12px 24px', 
                             borderRadius: '12px', 
                             fontWeight: 'bold', 
                             border: '1px solid rgba(255,255,255,0.3)',
                             cursor: 'pointer',
                             backdropFilter: 'blur(10px)'
                         }}
                      >
                         AI Analysis
                      </button>
                     <button 
                         onClick={() => setShowRebalanceModal(true)}
                         style={{ 
                             backgroundColor: 'rgba(255,255,255,0.2)', 
                             color: 'white', 
                             padding: '12px 24px', 
                             borderRadius: '12px', 
                             fontWeight: 'bold', 
                             border: '1px solid rgba(255,255,255,0.3)',
                             cursor: 'pointer',
                             backdropFilter: 'blur(10px)'
                         }}
                      >
                         Rebalance
                      </button>
                     <button 
                        onClick={() => setShowAddModal(true)}
                        style={{ 
                            backgroundColor: 'white', 
                            color: '#3b82f6', 
                            padding: '12px 24px', 
                            borderRadius: '12px', 
                            fontWeight: 'bold', 
                            border: 'none', 
                            cursor: 'pointer' 
                        }}
                     >
                         + Add Stock
                     </button>
                 </div>
             </div>

             {/* Charts Section */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                 {/* Allocation Chart */}
                 <div style={{ 
                     backgroundColor: darkMode ? '#1a1f2e' : '#ffffff', 
                     padding: '24px', 
                     borderRadius: '20px',
                     border: `1px solid ${darkMode ? '#2d3548' : '#e5e7eb'}`,
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                 }}>
                     <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Asset Allocation</h3>
                     <AllocationChart holdings={holdings} darkMode={darkMode} />
                 </div>
                 
                 {/* Growth/Risk Chart */}
                 <div style={{ 
                     backgroundColor: darkMode ? '#1a1f2e' : '#ffffff', 
                     padding: '24px', 
                     borderRadius: '20px',
                     border: `1px solid ${darkMode ? '#2d3548' : '#e5e7eb'}`,
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                 }}>
                     <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Portfolio Growth</h3>
                     <GrowthChart history={history} darkMode={darkMode} />
                 </div>
             </div>

             {/* Search Area */}
             <div style={{ marginBottom: '30px' }}>
                 <SearchStock darkMode={darkMode} onSelect={(stock) => { setSelectedStock(stock); setShowAddModal(true); }} />
             </div>

             {/* Holdings Grid */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                 {loading ? <div>Loading portfolio...</div> : holdings.map((h) => (
                     <StockCard 
                        key={h.id} 
                        holding={h} 
                        darkMode={darkMode} 
                        onClick={() => {}} 
                        onDelete={handleSellInitiate} 
                        onBuy={handleBuyInitiate}
                     />
                 ))}
             </div>
        </div>

        {showAddModal && (
            <AddStockModal 
                stock={selectedStock} 
                darkMode={darkMode} 
                onClose={() => { setShowAddModal(false); setSelectedStock(null); }} 
                onSave={handleCreatePortfolio} 
            />
        )}

        {sellStockData && (
            <SellStockModal
                stock={sellStockData}
                darkMode={darkMode}
                onClose={() => setSellStockData(null)}
                onConfirm={executePartialSell}
            />
        )}

        {buyStockData && (
            <BuyStockModal
                stock={buyStockData}
                darkMode={darkMode}
                onClose={() => setBuyStockData(null)}
                onConfirm={executePartialBuy}
            />
        )}

        {showRebalanceModal && (
            <RebalanceModal 
                darkMode={darkMode}
                onClose={() => setShowRebalanceModal(false)}
                onExecute={() => {
                    loadPortfolio();
                }}
            />
        )}
    </div>
  )
}

export default PortfolioPage;
