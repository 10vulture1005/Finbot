from dataclasses import dataclass, field
from datetime import datetime
import pandas as pd

@dataclass
class Trade:
    date: datetime
    symbol: str
    action: str # BUY / SELL
    quantity: float
    price: float
    commission: float
    tax: float
    realized_pnl: float = 0.0

@dataclass
class Holding:
    symbol: str
    quantity: float
    avg_price: float
    purchase_date: datetime

class PortfolioAccountant:
    def __init__(self, initial_capital: float = 100000.0):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.holdings: dict[str, list[Holding]] = {} # FIFO Queue of holdings
        self.trades: list[Trade] = []
        self.realized_pnl = 0.0
        self.tax_liability = 0.0
        self.equity_curve = []

    def get_total_value(self, market_prices: dict[str, float]) -> float:
        """
        Calculates NAV: Cash + Market Value of Holdings.
        """
        holdings_value = 0.0
        for sym, lots in self.holdings.items():
            price = market_prices.get(sym, 0.0)
            qty = sum(h.quantity for h in lots)
            holdings_value += qty * price
        
        return self.cash + holdings_value

    def get_holdings_summary(self) -> dict[str, float]:
        """
        Returns {symbol: quantity} for rebalancer.
        """
        summary = {}
        for sym, lots in self.holdings.items():
            qty = sum(h.quantity for h in lots)
            if qty > 0:
                summary[sym] = qty
        return summary

    def execute_trade(self, date: datetime, symbol: str, quantity: float, price: float, 
                     commission_rate: float = 0.001, slippage_factor: float = 0.0):
        """
        Executes a trade.
        quantity > 0: BUY
        quantity < 0: SELL
        """
        if quantity == 0:
            return

        # Slippage adjustment
        # Buy: Price increases. Sell: Price decreases.
        impact_price = price * (1 + slippage_factor) if quantity > 0 else price * (1 - slippage_factor)
        
        trade_value = abs(quantity) * impact_price
        commission = trade_value * commission_rate
        
        if quantity > 0: # BUY
            if self.cash < (trade_value + commission):
                # Reject or Partial Fill? For simulation, we assume rebalancer checked cash. 
                # But here we might go negative if not careful.
                # Allow negative cash (margin)? No, lets raise/log.
                pass 
                
            self.cash -= (trade_value + commission)
            
            # Add to Holdings (FIFO)
            if symbol not in self.holdings:
                self.holdings[symbol] = []
            
            self.holdings[symbol].append(Holding(symbol, quantity, impact_price, date))
            
            self.trades.append(Trade(date, symbol, "BUY", quantity, impact_price, commission, 0.0))

        else: # SELL
            # FIFO Logic
            qty_to_sell = abs(quantity)
            realized_pnl = 0.0
            tax = 0.0
            
            if symbol not in self.holdings:
                return # Error
                
            lots = self.holdings[symbol]
            shares_sold = 0.0
            
            while qty_to_sell > 0 and lots:
                lot = lots[0]
                
                if lot.quantity > qty_to_sell:
                    # Partial Lot Sell
                    sold_from_lot = qty_to_sell
                    lot.quantity -= qty_to_sell
                    qty_to_sell = 0
                else:
                    # Full Lot Sell
                    sold_from_lot = lot.quantity
                    qty_to_sell -= lot.quantity
                    lots.pop(0) # Remove empty lot
                
                shares_sold += sold_from_lot
                
                # PnL Calc
                buy_cost = sold_from_lot * lot.avg_price
                sell_val = sold_from_lot * impact_price
                lot_pnl = sell_val - buy_cost
                realized_pnl += lot_pnl
                
                # Tax Calc (India)
                # STCG (< 1y): 15%
                # LTCG (> 1y): 10% (Indexation ignored for simplicity or hard to model)
                days_held = (date - lot.purchase_date).days
                if lot_pnl > 0:
                    if days_held < 365:
                        tax += lot_pnl * 0.15
                    else:
                        tax += lot_pnl * 0.10 # Assuming gains > 1L threshold typically
            
            self.cash += (shares_sold * impact_price) - commission - tax
            self.realized_pnl += realized_pnl
            self.tax_liability += tax
            
            self.trades.append(Trade(date, symbol, "SELL", abs(quantity), impact_price, commission, tax, realized_pnl))

    def record_snapshot(self, date: datetime, market_prices: dict[str, float]):
        nav = self.get_total_value(market_prices)
        self.equity_curve.append({"date": date, "nav": nav, "cash": self.cash})
