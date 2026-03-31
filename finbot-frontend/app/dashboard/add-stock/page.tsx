"use client";

import React, { useState, useEffect } from "react";
import { Upload, Plus, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { searchStocks, getQuote } from "@/app/services/marketService";
import { addStock } from "@/app/services/portfolioService";

export default function AddStockPage() {
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  const [formData, setFormData] = useState({
    stockName: "",
    quantity: "",
    buyPrice: "",
    buyDate: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Search state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.stockName.length > 1 && showSuggestions) {
         try {
           const results = await searchStocks(formData.stockName);
           setSearchResults(results);
         } catch (e) {
           console.error("Search error", e);
         }
      } else if (formData.stockName.length === 0) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.stockName, showSuggestions]);

  const selectStock = async (stock: any) => {
    // Optimistically set symbol
    setFormData((prev) => ({ ...prev, stockName: stock.symbol }));
    setShowSuggestions(false);
    
    // Fetch current price to pre-populate buyPrice
    try {
        const quote = await getQuote(stock.symbol);
        if (quote && quote.price) {
            setFormData((prev) => ({ ...prev, buyPrice: quote.price.toString() }));
        }
    } catch (e) {
        console.error("Failed to fetch quote for pre-population", e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'stockName' ? value.toUpperCase() : value }));
    
    if (name === 'stockName') {
        setShowSuggestions(true);
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.stockName) newErrors.stockName = "Stock name is required";
    if (!formData.quantity || Number(formData.quantity) <= 0)
      newErrors.quantity = "Valid quantity is required";
    if (!formData.buyPrice || Number(formData.buyPrice) <= 0)
      newErrors.buyPrice = "Valid buy price is required";
    if (!formData.buyDate) newErrors.buyDate = "Buy date is required";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      await addStock({
        symbol: formData.stockName, 
        quantity: Number(formData.quantity), 
        avg_price: Number(formData.buyPrice)
      });
      setSuccessMessage("Stock added successfully to your portfolio!");
      setFormData({ stockName: "", quantity: "", buyPrice: "", buyDate: "" });
    } catch (error) {
      console.error("Failed to add stock", error);
      setErrorMessage("Failed to add stock. Please try again.");
    } finally {
      setIsSubmitting(false);
      if(successMessage) setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Calculated Total Value
  const totalValue =
    Number(formData.quantity || 0) * Number(formData.buyPrice || 0);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Add New Asset</h1>
      <p className="text-muted-foreground mb-8">
        Manually add a transaction or upload your broker's statement.
      </p>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border mb-8">
        <button
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "manual"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("manual")}
        >
          Manual Entry
        </button>
        <button
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "csv"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("csv")}
        >
          Import CSV
        </button>
      </div>

      {/* Manual Entry Form */}
      {activeTab === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock Symbol / Name</label>
                <div className="relative">
                    <input
                    type="text"
                    name="stockName"
                    value={formData.stockName}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="e.g. RELIANCE, TCS"
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        errors.stockName ? "border-red-500" : "border-input"
                    }`}
                    />
                    {showSuggestions && searchResults.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-xl border border-border bg-popover text-popover-foreground">
                            {searchResults.map((stock) => (
                                <li
                                    key={stock.symbol}
                                    className="px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 last:border-0"
                                    onClick={() => selectStock(stock)}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold">{stock.symbol}</span>
                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{stock.exchange}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {errors.stockName && (
                  <p className="text-xs text-red-500">{errors.stockName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                      errors.quantity ? "border-red-500" : "border-input"
                    }`}
                  />
                  {errors.quantity && (
                    <p className="text-xs text-red-500">{errors.quantity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Buy Price (Avg)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="buyPrice"
                      value={formData.buyPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className={`flex h-10 w-full rounded-md border bg-background pl-7 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        errors.buyPrice ? "border-red-500" : "border-input"
                      }`}
                    />
                  </div>
                  {errors.buyPrice && (
                    <p className="text-xs text-red-500">{errors.buyPrice}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Date</label>
                <input
                  type="date"
                  name="buyDate"
                  value={formData.buyDate}
                  onChange={handleInputChange}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.buyDate ? "border-red-500" : "border-input"
                  }`}
                />
                {errors.buyDate && (
                  <p className="text-xs text-red-500">{errors.buyDate}</p>
                )}
              </div>

              {/* Total Calculation Display */}
              <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Invested Value
                </span>
                <span className="text-lg font-bold">
                  ₹{totalValue.toLocaleString()}
                </span>
              </div>

              {successMessage && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-md flex items-center gap-2 text-sm">
                  <CheckCircle size={16} />
                  {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md flex items-center gap-2 text-sm">
                  <AlertCircle size={16} />
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus size={18} /> Add Transaction
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Help / Summary */}
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-5 rounded-xl">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <AlertCircle size={18} /> Why add details?
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2 list-disc list-inside">
                <li>Get accurate P&L calculations</li>
                <li>Track portfolio diversification</li>
                <li>Receive AI-powered risk insights</li>
              </ul>
            </div>
            
            {/* <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
                 <h3 className="font-medium mb-3">Recently Added</h3>
                 <p className="text-sm text-muted-foreground">Recent transactions will appear here.</p>
            </div> */}
          </div>
        </div>
      )}

      {/* CSV Import */}
      {activeTab === "csv" && (
        <div className="bg-card border border-border rounded-xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Upload size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Broker Statement</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Drag and drop your CSV file here, or click to select files. We support statements from Zerodha, Groww, Upstox, and more.
            </p>
            
            <div className="max-w-md mx-auto p-8 border-2 border-dashed border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                 <div className="flex flex-col items-center gap-2">
                     <FileText size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                     <span className="text-sm font-medium text-primary">Click to upload CSV</span>
                     <span className="text-xs text-muted-foreground">Max file size 5MB</span>
                 </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                 <button className="text-sm text-muted-foreground hover:text-foreground underline">Download Sample Template</button>
            </div>
        </div>
      )}
    </div>
  );
}
