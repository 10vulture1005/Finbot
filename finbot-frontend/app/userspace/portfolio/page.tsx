// "use client"

// import React, { useState, useEffect } from 'react';
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
// import { Search, Plus, X, TrendingUp, TrendingDown, Edit2, Trash2, Sun, Moon, Menu, ArrowLeft, BarChart3, DollarSign, Percent, Calendar } from 'lucide-react';

// // ============================================================================
// // TYPES & INTERFACES
// // ============================================================================

// interface Stock {
//   symbol: string;
//   name: string;
//   exchange: string;
//   price: number;
//   change: number;
//   changePercent: number;
// }

// interface PortfolioStock extends Stock {
//   id: string;
//   quantity: number;
//   avgPrice: number;
//   totalValue: number;
//   totalInvestment: number;
//   profitLoss: number;
//   profitLossPercent: number;
//   purchaseDate?: string;
// }

// interface ChartDataPoint {
//   date: string;
//   price: number;
// }

// interface StockDetails {
//   symbol: string;
//   name: string;
//   price: number;
//   change: number;
//   changePercent: number;
//   high: number;
//   low: number;
//   open: number;
//   previousClose: number;
//   volume: string;
//   marketCap: string;
//   pe: number;
//   chartData: ChartDataPoint[];
// }

// // ============================================================================
// // MOCK DATA
// // ============================================================================

// const mockStockList: Stock[] = [
//   { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', price: 2456.80, change: 23.50, changePercent: 0.97 },
//   { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', price: 3678.90, change: -12.30, changePercent: -0.33 },
//   { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', price: 1654.25, change: 8.75, changePercent: 0.53 },
//   { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', price: 1456.70, change: 15.20, changePercent: 1.05 },
//   { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE', price: 987.35, change: -3.45, changePercent: -0.35 },
//   { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE', price: 876.50, change: 12.80, changePercent: 1.48 },
//   { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', price: 432.60, change: 2.30, changePercent: 0.53 },
//   { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', price: 623.45, change: -5.60, changePercent: -0.89 },
//   { symbol: 'WIPRO', name: 'Wipro Ltd', exchange: 'NSE', price: 423.80, change: 3.90, changePercent: 0.93 },
//   { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', exchange: 'NSE', price: 2987.50, change: 18.30, changePercent: 0.62 },
//   { symbol: 'AXISBANK', name: 'Axis Bank Ltd', exchange: 'NSE', price: 1123.45, change: 14.20, changePercent: 1.28 },
//   { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', exchange: 'NSE', price: 9876.30, change: -45.60, changePercent: -0.46 }
// ];

// const generateChartData = (basePrice: number): ChartDataPoint[] => {
//   const data: ChartDataPoint[] = [];
//   let price = basePrice * 0.9;
//   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
//   for (let i = 0; i < 30; i++) {
//     price += (Math.random() - 0.45) * (basePrice * 0.02);
//     data.push({
//       date: i < 12 ? months[i] : `Day ${i - 11}`,
//       price: Math.round(price * 100) / 100
//     });
//   }
//   return data;
// };

// // ============================================================================
// // API MOCK
// // ============================================================================

// class StockAPI {
//   static async fetchStockList(query: string = ''): Promise<Stock[]> {
//     await new Promise(resolve => setTimeout(resolve, 300));
    
//     if (query) {
//       return mockStockList.filter(stock => 
//         stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
//         stock.name.toLowerCase().includes(query.toLowerCase())
//       );
//     }
//     return mockStockList;
//   }

//   static async fetchStockDetails(symbol: string): Promise<StockDetails> {
//     await new Promise(resolve => setTimeout(resolve, 400));
//     const stock = mockStockList.find(s => s.symbol === symbol) || mockStockList[0];
    
//     return {
//       ...stock,
//       high: stock.price * 1.05,
//       low: stock.price * 0.95,
//       open: stock.price * 0.98,
//       previousClose: stock.price - stock.change,
//       volume: `${(Math.random() * 20 + 5).toFixed(1)}M`,
//       marketCap: `${(Math.random() * 15 + 2).toFixed(1)}T`,
//       pe: Math.random() * 40 + 10,
//       chartData: generateChartData(stock.price)
//     };
//   }
// }

// // ============================================================================
// // UTILITY FUNCTIONS
// // ============================================================================

// const formatCurrency = (value: number): string => {
//   return new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 2
//   }).format(value);
// };

// const formatNumber = (value: number): string => {
//   return new Intl.NumberFormat('en-IN').format(value);
// };

// // ============================================================================
// // COMPONENTS
// // ============================================================================

// // Search Component
// const SearchStock = ({ darkMode, onSelect }) => {
//   const [query, setQuery] = useState('');
//   const [results, setResults] = useState([]);
//   const [showResults, setShowResults] = useState(false);

//   const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
//   const textColor = darkMode ? '#e2e8f0' : '#111827';
//   const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
//   const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

//   useEffect(() => {
//     const searchStocks = async () => {
//       if (query.length < 1) {
//         setResults([]);
//         return;
//       }
//       const stocks = await StockAPI.fetchStockList(query);
//       setResults(stocks);
//     };

//     const debounce = setTimeout(searchStocks, 300);
//     return () => clearTimeout(debounce);
//   }, [query]);

//   return (
//     <div style={{ position: 'relative' }}>
//       <div style={{ position: 'relative' }}>
//         <Search 
//           size={20} 
//           style={{ 
//             position: 'absolute', 
//             left: '12px', 
//             top: '50%', 
//             transform: 'translateY(-50%)',
//             color: mutedColor 
//           }} 
//         />
//         <input
//           type="text"
//           placeholder="Search NSE stocks (e.g., RELIANCE, TCS)"
//           value={query}
//           onChange={(e) => {
//             setQuery(e.target.value);
//             setShowResults(true);
//           }}
//           onFocus={() => setShowResults(true)}
//           style={{
//             width: '100%',
//             padding: '14px 14px 14px 44px',
//             fontSize: '14px',
//             borderRadius: '12px',
//             border: `1px solid ${borderColor}`,
//             backgroundColor: cardBg,
//             color: textColor,
//             outline: 'none',
//             transition: 'all 0.2s'
//           }}
//         />
//       </div>

//       {showResults && results.length > 0 && (
//         <div style={{
//           position: 'absolute',
//           top: '100%',
//           left: 0,
//           right: 0,
//           marginTop: '8px',
//           backgroundColor: cardBg,
//           border: `1px solid ${borderColor}`,
//           borderRadius: '12px',
//           boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
//           maxHeight: '400px',
//           overflowY: 'auto',
//           zIndex: 50
//         }}>
//           {results.map((stock) => (
//             <button
//               key={stock.symbol}
//               onClick={() => {
//                 onSelect(stock);
//                 setQuery('');
//                 setResults([]);
//                 setShowResults(false);
//               }}
//               style={{
//                 width: '100%',
//                 padding: '16px',
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//                 border: 'none',
//                 borderBottom: `1px solid ${borderColor}`,
//                 backgroundColor: 'transparent',
//                 cursor: 'pointer',
//                 textAlign: 'left',
//                 transition: 'background-color 0.2s'
//               }}
//               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#2d3548' : '#f9fafb'}
//               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
//             >
//               <div>
//                 <div style={{ fontSize: '15px', fontWeight: '600', color: textColor, marginBottom: '2px' }}>
//                   {stock.symbol}
//                 </div>
//                 <div style={{ fontSize: '13px', color: mutedColor }}>{stock.name}</div>
//               </div>
//               <div style={{ textAlign: 'right' }}>
//                 <div style={{ fontSize: '15px', fontWeight: '600', color: textColor }}>
//                   {formatCurrency(stock.price)}
//                 </div>
//                 <div style={{ 
//                   fontSize: '13px', 
//                   color: stock.change >= 0 ? '#10b981' : '#ef4444',
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: '4px',
//                   justifyContent: 'flex-end'
//                 }}>
//                   {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
//                   {stock.changePercent.toFixed(2)}%
//                 </div>
//               </div>
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// // Add Stock Modal
// const AddStockModal = ({ stock, darkMode, onClose, onSave }) => {
//   const [quantity, setQuantity] = useState('');
//   const [avgPrice, setAvgPrice] = useState(stock?.price.toString() || '');
//   const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

//   const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
//   const textColor = darkMode ? '#e2e8f0' : '#111827';
//   const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
//   const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

//   if (!stock) return null;

//   const handleSave = () => {
//     if (!quantity || !avgPrice) return;

//     const holding = {
//       ...stock,
//       id: Date.now().toString(),
//       quantity: parseFloat(quantity),
//       avgPrice: parseFloat(avgPrice),
//       purchaseDate,
//       totalInvestment: parseFloat(quantity) * parseFloat(avgPrice),
//       totalValue: parseFloat(quantity) * stock.price,
//       profitLoss: (parseFloat(quantity) * stock.price) - (parseFloat(quantity) * parseFloat(avgPrice)),
//       profitLossPercent: ((stock.price - parseFloat(avgPrice)) / parseFloat(avgPrice)) * 100
//     };

//     onSave(holding);
//     onClose();
//   };

//   const totalInvestment = parseFloat(quantity || '0') * parseFloat(avgPrice || '0');

//   return (
//     <div 
//       style={{
//         position: 'fixed',
//         inset: 0,
//         backgroundColor: 'rgba(0,0,0,0.6)',
//         zIndex: 60,
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: '16px',
//         backdropFilter: 'blur(4px)'
//       }}
//       onClick={onClose}
//     >
//       <div 
//         style={{
//           backgroundColor: cardBg,
//           borderRadius: '16px',
//           padding: '28px',
//           maxWidth: '500px',
//           width: '100%',
//           border: `1px solid ${borderColor}`,
//           boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <h3 style={{ fontSize: '22px', fontWeight: '700', color: textColor }}>Add to Portfolio</h3>
//           <button onClick={onClose} style={{ 
//             background: 'none', 
//             border: 'none', 
//             cursor: 'pointer', 
//             color: mutedColor,
//             padding: '4px',
//             borderRadius: '6px',
//             transition: 'background-color 0.2s'
//           }}
//           onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#2d3548' : '#f3f4f6'}
//           onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
//           >
//             <X size={24} />
//           </button>
//         </div>

//         <div style={{ 
//           padding: '16px',
//           backgroundColor: darkMode ? '#2d3548' : '#f9fafb',
//           borderRadius: '12px',
//           marginBottom: '24px'
//         }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <div>
//               <div style={{ fontSize: '18px', fontWeight: '700', color: textColor, marginBottom: '4px' }}>
//                 {stock.symbol}
//               </div>
//               <div style={{ fontSize: '14px', color: mutedColor }}>{stock.name}</div>
//             </div>
//             <div style={{ textAlign: 'right' }}>
//               <div style={{ fontSize: '18px', fontWeight: '700', color: textColor }}>
//                 {formatCurrency(stock.price)}
//               </div>
//               <div style={{ 
//                 fontSize: '14px', 
//                 fontWeight: '600',
//                 color: stock.change >= 0 ? '#10b981' : '#ef4444',
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '4px',
//                 justifyContent: 'flex-end'
//               }}>
//                 {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
//                 {stock.changePercent.toFixed(2)}%
//               </div>
//             </div>
//           </div>
//         </div>

//         <div style={{ marginBottom: '18px' }}>
//           <label style={{ 
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px',
//             fontSize: '14px', 
//             fontWeight: '600', 
//             color: textColor, 
//             marginBottom: '10px' 
//           }}>
//             <BarChart3 size={16} />
//             Quantity
//           </label>
//           <input
//             type="number"
//             value={quantity}
//             onChange={(e) => setQuantity(e.target.value)}
//             placeholder="Enter quantity"
//             style={{
//               width: '100%',
//               padding: '12px 14px',
//               fontSize: '15px',
//               borderRadius: '10px',
//               border: `1px solid ${borderColor}`,
//               backgroundColor: cardBg,
//               color: textColor,
//               outline: 'none',
//               transition: 'border-color 0.2s'
//             }}
//             onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//             onBlur={(e) => e.target.style.borderColor = borderColor}
//           />
//         </div>

//         <div style={{ marginBottom: '18px' }}>
//           <label style={{ 
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px',
//             fontSize: '14px', 
//             fontWeight: '600', 
//             color: textColor, 
//             marginBottom: '10px' 
//           }}>
//             <DollarSign size={16} />
//             Average Purchase Price (₹)
//           </label>
//           <input
//             type="number"
//             step="0.01"
//             value={avgPrice}
//             onChange={(e) => setAvgPrice(e.target.value)}
//             placeholder="Enter average price"
//             style={{
//               width: '100%',
//               padding: '12px 14px',
//               fontSize: '15px',
//               borderRadius: '10px',
//               border: `1px solid ${borderColor}`,
//               backgroundColor: cardBg,
//               color: textColor,
//               outline: 'none',
//               transition: 'border-color 0.2s'
//             }}
//             onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//             onBlur={(e) => e.target.style.borderColor = borderColor}
//           />
//         </div>

//         <div style={{ marginBottom: '24px' }}>
//           <label style={{ 
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px',
//             fontSize: '14px', 
//             fontWeight: '600', 
//             color: textColor, 
//             marginBottom: '10px' 
//           }}>
//             <Calendar size={16} />
//             Purchase Date
//           </label>
//           <input
//             type="date"
//             value={purchaseDate}
//             onChange={(e) => setPurchaseDate(e.target.value)}
//             style={{
//               width: '100%',
//               padding: '12px 14px',
//               fontSize: '15px',
//               borderRadius: '10px',
//               border: `1px solid ${borderColor}`,
//               backgroundColor: cardBg,
//               color: textColor,
//               outline: 'none',
//               transition: 'border-color 0.2s'
//             }}
//             onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//             onBlur={(e) => e.target.style.borderColor = borderColor}
//           />
//         </div>

//         {totalInvestment > 0 && (
//           <div style={{
//             padding: '16px',
//             background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
//             borderRadius: '12px',
//             marginBottom: '24px',
//             border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)'}`
//           }}>
//             <div style={{ fontSize: '13px', color: mutedColor, marginBottom: '6px', fontWeight: '500' }}>
//               Total Investment
//             </div>
//             <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6' }}>
//               {formatCurrency(totalInvestment)}
//             </div>
//           </div>
//         )}

//         <div style={{ display: 'flex', gap: '12px' }}>
//           <button
//             onClick={onClose}
//             style={{
//               flex: 1,
//               padding: '14px',
//               fontSize: '15px',
//               fontWeight: '600',
//               borderRadius: '10px',
//               border: `1px solid ${borderColor}`,
//               backgroundColor: 'transparent',
//               color: textColor,
//               cursor: 'pointer',
//               transition: 'all 0.2s'
//             }}
//             onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#2d3548' : '#f3f4f6'}
//             onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSave}
//             disabled={!quantity || !avgPrice}
//             style={{
//               flex: 1,
//               padding: '14px',
//               fontSize: '15px',
//               fontWeight: '600',
//               borderRadius: '10px',
//               border: 'none',
//               background: quantity && avgPrice 
//                 ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
//                 : mutedColor,
//               color: 'white',
//               cursor: quantity && avgPrice ? 'pointer' : 'not-allowed',
//               transition: 'transform 0.2s, box-shadow 0.2s',
//               boxShadow: quantity && avgPrice ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
//             }}
//             onMouseEnter={(e) => {
//               if (quantity && avgPrice) {
//                 e.currentTarget.style.transform = 'translateY(-1px)';
//                 e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
//               }
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.transform = 'translateY(0)';
//               e.currentTarget.style.boxShadow = quantity && avgPrice ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none';
//             }}
//           >
//             Add to Portfolio
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Stock Card Component
// const StockCard = ({ holding, darkMode, onClick, onDelete, onEdit }) => {
//   const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
//   const textColor = darkMode ? '#e2e8f0' : '#111827';
//   const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
//   const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

//   const isProfitable = holding.profitLoss >= 0;

//   return (
//     <div 
//       style={{
//         backgroundColor: cardBg,
//         borderRadius: '16px',
//         padding: '20px',
//         border: `1px solid ${borderColor}`,
//         boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
//         transition: 'all 0.3s ease',
//         cursor: 'pointer',
//         position: 'relative',
//         overflow: 'hidden'
//       }}
//       onClick={onClick}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.transform = 'translateY(-4px)';
//         e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.transform = 'translateY(0)';
//         e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
//       }}
//     >
//       {/* Status Indicator */}
//       <div style={{
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         height: '4px',
//         background: isProfitable 
//           ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
//           : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
//       }} />

//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
//         <div style={{ flex: 1 }}>
//           <div style={{ fontSize: '20px', fontWeight: '700', color: textColor, marginBottom: '4px' }}>
//             {holding.symbol}
//           </div>
//           <div style={{ fontSize: '13px', color: mutedColor, lineHeight: '1.4' }}>
//             {holding.name}
//           </div>
//         </div>
//         <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onEdit(holding);
//             }}
//             style={{
//               padding: '8px',
//               borderRadius: '8px',
//               border: 'none',
//               backgroundColor: darkMode ? '#2d3548' : '#f3f4f6',
//               color: textColor,
//               cursor: 'pointer',
//               transition: 'all 0.2s'
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#e5e7eb';
//               e.currentTarget.style.transform = 'scale(1.05)';
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.backgroundColor = darkMode ? '#2d3548' : '#f3f4f6';
//               e.currentTarget.style.transform = 'scale(1)';
//             }}
//           >
//             <Edit2 size={15} />
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onDelete(holding.id);
//             }}
//             style={{
//               padding: '8px',
//               borderRadius: '8px',
//               border: 'none',
//               backgroundColor: darkMode ? '#2d3548' : '#f3f4f6',
//               color: '#ef4444',
//               cursor: 'pointer',
//               transition: 'all 0.2s'
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
//               e.currentTarget.style.transform = 'scale(1.05)';
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.backgroundColor = darkMode ? '#2d3548' : '#f3f4f6';
//               e.currentTarget.style.transform = 'scale(1)';
//             }}
//           >
//             <Trash2 size={15} />
//           </button>
//         </div>
//       </div>

//       <div style={{ marginBottom: '16px' }}>
//         <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '6px', fontWeight: '500' }}>
//           Current Value
//         </div>
//         <div style={{ fontSize: '26px', fontWeight: '700', color: textColor }}>
//           {formatCurrency(holding.totalValue)}
//         </div>
//       </div>

//       <div style={{ 
//         display: 'grid', 
//         gridTemplateColumns: '1fr 1fr', 
//         gap: '12px',
//         marginBottom: '16px'
//       }}>
//         <div style={{
//           padding: '10px',
//           backgroundColor: darkMode ? 'rgba(45, 53, 72, 0.5)' : 'rgba(243, 244, 246, 0.8)',
//           borderRadius: '10px'
//         }}>
//           <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', fontWeight: '500' }}>
//             Quantity
//           </div>
//           <div style={{ fontSize: '15px', fontWeight: '600', color: textColor }}>
//             {formatNumber(holding.quantity)}
//           </div>
//         </div>
//         <div style={{
//           padding: '10px',
//           backgroundColor: darkMode ? 'rgba(45, 53, 72, 0.5)' : 'rgba(243, 244, 246, 0.8)',
//           borderRadius: '10px'
//         }}>
//           <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', fontWeight: '500' }}>
//             Avg Price
//           </div>
//           <div style={{ fontSize: '15px', fontWeight: '600', color: textColor }}>
//             {formatCurrency(holding.avgPrice)}
//           </div>
//         </div>
//       </div>

//       <div style={{
//         padding: '14px',
//         background: isProfitable 
//           ? (darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)')
//           : (darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)'),
//         borderRadius: '12px',
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         border: `1px solid ${isProfitable 
//           ? (darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
//           : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)')
//         }`
//       }}>
//         <div>
//           <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', fontWeight: '500' }}>
//             P&L
//           </div>
//           <div style={{ 
//             fontSize: '17px', 
//             fontWeight: '700', 
//             color: isProfitable ? '#10b981' : '#ef4444',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '6px'
//           }}>
//             {isProfitable ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
//             {isProfitable ? '+' :''}{formatCurrency(Math.abs(holding.profitLoss))}
//           </div>
//         </div>
//         <div style={{ textAlign: 'right' }}>
//           <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '4px', fontWeight: '500' }}>
//             Return
//           </div>
//           <div style={{ 
//             fontSize: '17px', 
//             fontWeight: '700', 
//             color: isProfitable ? '#10b981' : '#ef4444'
//           }}>
//             {isProfitable ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Stock Detail View
// const StockDetailView = ({ stock, darkMode, onBack, holding }) => {
//   const [details, setDetails] = useState<StockDetails | null>(null);
//   const [loading, setLoading] = useState(true);

//   const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
//   const textColor = darkMode ? '#e2e8f0' : '#111827';
//   const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
//   const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

//   useEffect(() => {
//     const loadDetails = async () => {
//       setLoading(true);
//       const data = await StockAPI.fetchStockDetails(stock.symbol);
//       setDetails(data);
//       setLoading(false);
//     };
//     loadDetails();
//   }, [stock.symbol]);

//   if (loading || !details) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <div style={{ color: mutedColor, fontSize: '16px' }}>Loading stock details...</div>
//       </div>
//     );
//   }

//   const isProfitable = details.change >= 0;

//   return (
//     <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
//       <button
//         onClick={onBack}
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '8px',
//           padding: '10px 16px',
//           borderRadius: '10px',
//           border: `1px solid ${borderColor}`,
//           backgroundColor: cardBg,
//           color: textColor,
//           cursor: 'pointer',
//           marginBottom: '24px',
//           fontSize: '14px',
//           fontWeight: '600',
//           transition: 'all 0.2s'
//         }}
//         onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#2d3548' : '#f3f4f6'}
//         onMouseLeave={(e) => e.currentTarget.style.backgroundColor = cardBg}
//       >
//         <ArrowLeft size={18} />
//         Back to Portfolio
//       </button>

//       <div style={{
//         backgroundColor: cardBg,
//         borderRadius: '16px',
//         padding: '28px',
//         border: `1px solid ${borderColor}`,
//         boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
//         marginBottom: '24px'
//       }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
//           <div>
//             <div style={{ fontSize: '32px', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
//               {details.symbol}
//             </div>
//             <div style={{ fontSize: '15px', color: mutedColor, marginBottom: '16px' }}>
//               {details.name}
//             </div>
//             <div style={{ fontSize: '42px', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
//               {formatCurrency(details.price)}
//             </div>
//             <div style={{ 
//               display: 'flex',
//               alignItems: 'center',
//               gap: '8px',
//               fontSize: '18px',
//               fontWeight: '600',
//               color: isProfitable ? '#10b981' : '#ef4444'
//             }}>
//               {isProfitable ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
//               {isProfitable ? '+' : ''}{formatCurrency(details.change)} ({isProfitable ? '+' : ''}{details.changePercent.toFixed(2)}%)
//             </div>
//           </div>

//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(2, 1fr)',
//             gap: '16px',
//             minWidth: '300px'
//           }}>
//             <div>
//               <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '6px', fontWeight: '500' }}>
//                 Open
//               </div>
//               <div style={{ fontSize: '16px', fontWeight: '600', color: textColor }}>
//                 {formatCurrency(details.open)}
//               </div>
//             </div>
//             <div>
//               <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '6px', fontWeight: '500' }}>
//                 Prev Close
//               </div>
//               <div style={{ fontSize: '16px', fontWeight: '600', color: textColor }}>
//                 {formatCurrency(details.previousClose)}
//               </div>
//             </div>
//             <div>
//               <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '6px', fontWeight: '500' }}>
//                 High
//               </div>
//               <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
//                 {formatCurrency(details.high)}
//               </div>
//             </div>
//             <div>
//               <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '6px', fontWeight: '500' }}>
//                 Low
//               </div>
//               <div style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>
//                 {formatCurrency(details.low)}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div style={{
//         backgroundColor: cardBg,
//         borderRadius: '16px',
//         padding: '28px',
//         border: `1px solid ${borderColor}`,
//         boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
//         marginBottom: '24px'
//       }}>
//         <h3 style={{ fontSize: '20px', fontWeight: '700', color: textColor, marginBottom: '20px' }}>
//           Price Chart
//         </h3>
//         <ResponsiveContainer width="100%" height={300}>
//           <AreaChart data={details.chartData}>
//             <defs>
//               <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
//                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
//               </linearGradient>
//             </defs>
//             <XAxis 
//               dataKey="date" 
//               stroke={mutedColor}
//               style={{ fontSize: '12px' }}
//             />
//             <YAxis 
//               stroke={mutedColor}
//               style={{ fontSize: '12px' }}
//               tickFormatter={(value) => `₹${value}`}
//             />
//             <Tooltip 
//               contentStyle={{
//                 backgroundColor: cardBg,
//                 border: `1px solid ${borderColor}`,
//                 borderRadius: '8px',
//                 fontSize: '13px'
//               }}
//               formatter={(value: number) => [formatCurrency(value), 'Price']}
//             />
//             <Area 
//               type="monotone" 
//               dataKey="price" 
//               stroke="#3b82f6" 
//               strokeWidth={2}
//               fillOpacity={1} 
//               fill="url(#colorPrice)" 
//             />
//           </AreaChart>
//         </ResponsiveContainer>
//       </div>

//       {holding && (
//         <div style={{
//           backgroundColor: cardBg,
//           borderRadius: '16px',
//           padding: '28px',
//           border: `1px solid ${borderColor}`,
//           boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
//         }}>
//           <h3 style={{ fontSize: '20px', fontWeight: '700', color: textColor, marginBottom: '20px' }}>
//             Your Holdings
//           </h3>
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//             gap: '16px'
//           }}>
//             <div style={{
//               padding: '16px',
//               backgroundColor: darkMode ? 'rgba(45, 53, 72, 0.5)' : 'rgba(243, 244, 246, 0.8)',
//               borderRadius: '12px'
//             }}>
//               <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '8px', fontWeight: '500' }}>
//                 Quantity
//               </div>
//               <div style={{ fontSize: '24px', fontWeight: '700', color: textColor }}>
//                 {formatNumber(holding.quantity)}
//               </div>
//             </div>
//             <div style={{
//               padding: '16px',
//               backgroundColor: darkMode ? 'rgba(45, 53, 72, 0.5)' : 'rgba(243, 244, 246, 0.8)',
//               borderRadius: '12px'
//             }}>
//               <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '8px', fontWeight: '500' }}>
//                 Avg Price
//               </div>
//               <div style={{ fontSize: '24px', fontWeight: '700', color: textColor }}>
//                 {formatCurrency(holding.avgPrice)}
//               </div>
//             </div>
//             <div style={{
//               padding: '16px',
//               backgroundColor: darkMode ? 'rgba(45, 53, 72, 0.5)' : 'rgba(243, 244, 246, 0.8)',
//               borderRadius: '12px'
//             }}>
//               <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '8px', fontWeight: '500' }}>
//                 Investment
//               </div>
//               <div style={{ fontSize: '24px', fontWeight: '700', color: textColor }}>
//                 {formatCurrency(holding.totalInvestment)}
//               </div>
//             </div>
//             <div style={{
//               padding: '16px',
//               background: holding.profitLoss >= 0
//                 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.15) 100%)'
//                 : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(248, 113, 113, 0.15) 100%)',
//               borderRadius: '12px',
//               border: `1px solid ${holding.profitLoss >= 0 
//                 ? (darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
//                 : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)')
//               }`
//             }}>
//               <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '8px', fontWeight: '500' }}>
//                 Profit/Loss
//               </div>
//               <div style={{ 
//                 fontSize: '24px', 
//                 fontWeight: '700', 
//                 color: holding.profitLoss >= 0 ? '#10b981' : '#ef4444',
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '8px'
//               }}>
//                 {holding.profitLoss >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
//                 {holding.profitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(holding.profitLoss))}
//               </div>
//               <div style={{ 
//                 fontSize: '14px', 
//                 fontWeight: '600', 
//                 color: holding.profitLoss >= 0 ? '#10b981' : '#ef4444',
//                 marginTop: '4px'
//               }}>
//                 {holding.profitLoss >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Main App Component
// const PortfolioTracker = () => {
//   const [darkMode, setDarkMode] = useState(true);
//   const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
//   const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [viewingStock, setViewingStock] = useState<PortfolioStock | null>(null);
//   const [editingStock, setEditingStock] = useState<PortfolioStock | null>(null);

//   const bgColor = darkMode ? '#0f172a' : '#f8fafc';
//   const cardBg = darkMode ? '#1a1f2e' : '#ffffff';
//   const textColor = darkMode ? '#e2e8f0' : '#111827';
//   const mutedColor = darkMode ? '#94a3b8' : '#6b7280';
//   const borderColor = darkMode ? '#2d3548' : '#e5e7eb';

//   const totalInvestment = portfolio.reduce((sum, stock) => sum + stock.totalInvestment, 0);
//   const totalCurrentValue = portfolio.reduce((sum, stock) => sum + stock.totalValue, 0);
//   const totalProfitLoss = totalCurrentValue - totalInvestment;
//   const totalProfitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

//   const handleAddStock = (holding: PortfolioStock) => {
//     setPortfolio([...portfolio, holding]);
//   };

//   const handleDeleteStock = (id: string) => {
//     setPortfolio(portfolio.filter(stock => stock.id !== id));
//   };

//   const handleEditStock = (holding: PortfolioStock) => {
//     setEditingStock(holding);
//     setSelectedStock(holding);
//     setShowAddModal(true);
//   };

//   const handleUpdateStock = (updatedHolding: PortfolioStock) => {
//     setPortfolio(portfolio.map(stock => 
//       stock.id === editingStock?.id ? { ...updatedHolding, id: stock.id } : stock
//     ));
//     setEditingStock(null);
//   };

//   if (viewingStock) {
//     return (
//       <div style={{ 
//         minHeight: '100vh', 
//         backgroundColor: bgColor,
//         transition: 'background-color 0.3s'
//       }}>
//         <StockDetailView 
//           stock={viewingStock} 
//           darkMode={darkMode}
//           onBack={() => setViewingStock(null)}
//           holding={viewingStock}
//         />
//       </div>
//     );
//   }

//   return (
//     <div style={{ 
//       minHeight: '100vh', 
//       backgroundColor: bgColor,
//       padding: '20px',
//       transition: 'background-color 0.3s'
//     }}>
//       <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
//         {/* Header */}
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center', 
//           marginBottom: '32px',
//           flexWrap: 'wrap',
//           gap: '16px'
//         }}>
//           <div>
//             <h1 style={{ 
//               fontSize: '36px', 
//               fontWeight: '800', 
//               color: textColor,
//               marginBottom: '8px',
//               background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
//               WebkitBackgroundClip: 'text',
//               WebkitTextFillColor: 'transparent',
//               backgroundClip: 'text'
//             }}>
//               Stock Portfolio Tracker
//             </h1>
//             <p style={{ fontSize: '15px', color: mutedColor }}>
//               Track your NSE stock investments in real-time
//             </p>
//           </div>
//           <button
//             onClick={() => setDarkMode(!darkMode)}
//             style={{
//               padding: '12px',
//               borderRadius: '12px',
//               border: `1px solid ${borderColor}`,
//               backgroundColor: cardBg,
//               color: textColor,
//               cursor: 'pointer',
//               transition: 'all 0.2s',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '8px'
//             }}
//             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
//             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
//           >
//             {darkMode ? <Sun size={20} /> : <Moon size={20} />}
//           </button>
//         </div>

//         {/* Portfolio Summary */}
//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//           gap: '20px',
//           marginBottom: '32px'
//         }}>
//           <div style={{
//             background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
//             borderRadius: '16px',
//             padding: '24px',
//             color: 'white',
//             boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
//           }}>
//             <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>
//               Total Investment
//             </div>
//             <div style={{ fontSize: '32px', fontWeight: '700' }}>
//               {formatCurrency(totalInvestment)}
//             </div>
//           </div>

//           <div style={{
//             backgroundColor: cardBg,
//             borderRadius: '16px',
//             padding: '24px',
//             border: `1px solid ${borderColor}`,
//             boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
//           }}>
//             <div style={{ fontSize: '13px', color: mutedColor, marginBottom: '8px', fontWeight: '500' }}>
//               Current Value
//             </div>
//             <div style={{ fontSize: '32px', fontWeight: '700', color: textColor }}>
//               {formatCurrency(totalCurrentValue)}
//             </div>
//           </div>

//           <div style={{
//             background: totalProfitLoss >= 0
//               ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
//               : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
//             borderRadius: '16px',
//             padding: '24px',
//             color: 'white',
//             boxShadow: totalProfitLoss >= 0
//               ? '0 8px 20px rgba(16, 185, 129, 0.3)'
//               : '0 8px 20px rgba(239, 68, 68, 0.3)'
//           }}>
//             <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>
//               Total P&L
//             </div>
//             <div style={{ fontSize: '32px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
//               {totalProfitLoss >= 0 ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
//               {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalProfitLoss))}
//             </div>
//             <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px', opacity: 0.95 }}>
//               {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
//             </div>
//           </div>
//         </div>

//         {/* Search and Add */}
//         <div style={{ marginBottom: '32px' }}>
//           <SearchStock 
//             darkMode={darkMode}
//             onSelect={(stock) => {
//               setSelectedStock(stock);
//               setShowAddModal(true);
//             }}
//           />
//         </div>

//         {/* Portfolio Grid */}
//         {portfolio.length === 0 ? (
//           <div style={{
//             backgroundColor: cardBg,
//             borderRadius: '16px',
//             padding: '60px 20px',
//             textAlign: 'center',
//             border: `2px dashed ${borderColor}`
//           }}>
//             <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
//             <h3 style={{ fontSize: '22px', fontWeight: '700', color: textColor, marginBottom: '12px' }}>
//               Start Building Your Portfolio
//             </h3>
//             <p style={{ fontSize: '15px', color: mutedColor, maxWidth: '400px', margin: '0 auto' }}>
//               Search for NSE stocks above and add them to track your investments
//             </p>
//           </div>
//         ) : (
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
//             gap: '20px'
//           }}>
//             {portfolio.map(holding => (
//               <StockCard
//                 key={holding.id}
//                 holding={holding}
//                 darkMode={darkMode}
//                 onClick={() => setViewingStock(holding)}
//                 onDelete={handleDeleteStock}
//                 onEdit={handleEditStock}
//               />
//             ))}
//           </div>
//         )}

//         {/* Add/Edit Modal */}
//         {showAddModal && selectedStock && (
//           <AddStockModal
//             stock={selectedStock}
//             darkMode={darkMode}
//             onClose={() => {
//               setShowAddModal(false);
//               setSelectedStock(null);
//               setEditingStock(null);
//             }}
//             onSave={editingStock ? handleUpdateStock : handleAddStock}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default PortfolioTracker;











"use client";
import { useState } from "react";
import { PortfolioStock, Stock } from "./type/stock";
import SearchStock from "./components/SearchStock";
import AddStockModal from "./components/AddStockModal";
import StockCard from "./components/StockCard";
import StockDetailView from "./components/StockDetailView";

export default function PortfolioTracker() {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [selected, setSelected] = useState<Stock | null>(null);
  const [viewing, setViewing] = useState<PortfolioStock | null>(null);

  if (viewing) {
    return <StockDetailView stock={viewing} onBack={() => setViewing(null)} />;
  }

  return (
    <div>
      <SearchStock darkMode onSelect={setSelected} />

      {portfolio.map(p => (
        <StockCard
          key={p.id}
          holding={p}
          onClick={() => setViewing(p)}
          onDelete={() =>
            setPortfolio(portfolio.filter(x => x.id !== p.id))
          }
        />
      ))}

      {selected && (
        <AddStockModal
          stock={selected}
          onSave={p => setPortfolio([...portfolio, p])}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
