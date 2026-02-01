'use client';

import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Stock } from '../type/stock';
import { StockAPI } from '../api/stockapi';
import { formatCurrency } from '../utils/format';

interface SearchStockProps {
  darkMode: boolean;
  onSelect: (stock: Stock) => void;
}

const SearchStock: React.FC<SearchStockProps> = ({ darkMode, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#111827';
  const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
  const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query) {
        setIsSearching(true);
        const data = await StockAPI.fetchStockList(query);
        setResults(data);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={20}
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: mutedColor
          }}
        />
        <input
          placeholder="Search NSE stocks (e.g., RELIANCE, TCS, INFY)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 48px',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            backgroundColor: cardBg,
            color: textColor,
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 10,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {results.map(s => (
            <div
              key={s.symbol}
              onClick={() => {
                onSelect(s);
                setQuery("");
                setResults([]);
              }}
              style={{
                padding: '16px',
                borderBottom: `1px solid ${borderColor}`,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = darkMode ? '#2d3548' : '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: textColor,
                    margin: 0,
                    marginBottom: '2px'
                  }}>
                    {s.symbol}
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: mutedColor,
                    margin: 0
                  }}>
                    {s.name}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: textColor,
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {formatCurrency(s.price)}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    justifyContent: 'flex-end' 
                  }}>
                    {s.change >= 0 ? (
                      <TrendingUp size={14} color="#10b981" />
                    ) : (
                      <TrendingDown size={14} color="#ef4444" />
                    )}
                    <span style={{
                      fontSize: '12px',
                      color: s.change >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {s.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchStock;