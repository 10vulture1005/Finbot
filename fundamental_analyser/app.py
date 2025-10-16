import requests
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv
load_dotenv()

symbol = "JKPAPER"
URL = f"https://www.screener.in/company/{symbol}/consolidated/"

headers = {
    "User-Agent": "Mozilla/5.0 (compatible; your-bot/0.1; +https://yourexample.com)"
}

resp = requests.get(URL, headers=headers)
resp.raise_for_status()

soup = BeautifulSoup(resp.text, "html.parser")

kv = soup.select("ul.key-values li")
key_data = {}
for li in kv:
    # e.g. "Market Cap ₹ 6,823 Cr." or "P/E 19.4"
    parts = li.get_text(strip=True).split(None, 1)
    if len(parts) == 2:
        label, value = parts
        key_data[label] = value
    else:
        # fallback
        key_data[parts[0]] = ""

print("Key data:", key_data)

df_qr=None

qt_table = soup.find("h2", string="Quarterly Results")
if qt_table:
    table = qt_table.find_next("table")
    df_qr = pd.read_html(str(table))[0]
    print(df_qr.head())

qt_table = soup.find("h2", string="Profit & Loss")
if qt_table:
    table = qt_table.find_next("table")
    df_Pnl = pd.read_html(str(table))[0]
    print(df_Pnl.head())

qt_table = soup.find("h2", string="Balance Sheet")
if qt_table:
    table = qt_table.find_next("table")
    df_BS = pd.read_html(str(table))[0]
    print(df_BS.head())

qt_table = soup.find("h2", string="Shareholding Pattern")
if qt_table:
    table = qt_table.find_next("table")
    df_share = pd.read_html(str(table))[0]
    print(df_share.head())
# Similarly, you can locate “Profit & Loss”, “Balance Sheet” by headings and parse via pandas

"""
Terminal-based Fundamental Stock Analyzer
Run with: python terminal_analyzer.py
"""

import pandas as pd
import json
import os
from datetime import datetime
from analyzer import FundamentalStockAnalyzer, AnalysisOutput


class TerminalStockAnalyzer:
    """Terminal interface for stock fundamental analysis"""
    
    def __init__(self, api_key=None, model_name="gemini-1.5-pro", temperature=0.3):
        """
        Initialize the terminal analyzer
        
        Args:
            api_key: Google API Key (if None, reads from environment)
            model_name: Model to use for analysis
            temperature: Temperature for LLM (0.0 to 1.0)
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        self.model_name = model_name
        self.temperature = temperature
        
        if not self.api_key:
            raise ValueError("API key not provided. Set GOOGLE_API_KEY environment variable or pass api_key parameter")
        
        self.analyzer = FundamentalStockAnalyzer(
            api_key=self.api_key,
            model_name=self.model_name,
            temperature=self.temperature
        )
    
    def load_csv_files(self, pnl_path, bs_path, shareholding_path, quarterly_path):
        """Load CSV files from paths"""
        try:
            df_pnl = pd.read_csv(pnl_path)
            df_bs = pd.read_csv(bs_path)
            df_share = pd.read_csv(shareholding_path)
            df_quarterly = pd.read_csv(quarterly_path)
            
            print("✅ CSV files loaded successfully!")
            return df_pnl, df_bs, df_share, df_quarterly
        except Exception as e:
            print(f"❌ Error loading CSV files: {e}")
            return None, None, None, None
    
    def get_sample_data(self):
        """Generate sample data for testing"""
        df_pnl = pd.DataFrame({
            'Year': ['Mar 2023', 'Mar 2022', 'Mar 2021', 'Mar 2020'],
            'Revenue': [5240, 4680, 3820, 3450],
            'Operating Profit': [892, 756, 612, 534],
            'Net Profit': [612, 498, 387, 298],
            'EPS': [45.2, 36.8, 28.6, 22.1]
        })
        
        df_bs = pd.DataFrame({
            'Year': ['Mar 2023', 'Mar 2022', 'Mar 2021'],
            'Total Assets': [4520, 3980, 3240],
            'Total Debt': [1240, 1120, 980],
            'Equity': [2180, 1920, 1680],
            'Current Assets': [1820, 1580, 1320],
            'Current Liabilities': [980, 860, 720]
        })
        
        df_share = pd.DataFrame({
            'Quarter': ['Jun 2023', 'Mar 2023', 'Dec 2022'],
            'Promoter %': [68.5, 69.2, 69.8],
            'FII %': [12.3, 11.8, 10.5],
            'DII %': [8.9, 8.2, 7.8]
        })
        
        df_quarterly = pd.DataFrame({
            'Quarter': ['Jun 2023', 'Mar 2023', 'Dec 2022', 'Sep 2022'],
            'Revenue': [1380, 1420, 1320, 1120],
            'Net Profit': [168, 172, 158, 114],
            'EPS': [12.4, 12.7, 11.7, 8.4]
        })
        
        print("ℹ️  Using sample data for analysis")
        return df_pnl, df_bs, df_share, df_quarterly

    def analyze(self, company_name, df_pnl=None, df_bs=None, df_share=None, df_quarterly=None, use_sample=False):
        """
        Perform fundamental analysis
        
        Args:
            company_name: Name of the company
            pnl_path: Path to P&L CSV file
            bs_path: Path to Balance Sheet CSV file
            shareholding_path: Path to Shareholding CSV file
            quarterly_path: Path to Quarterly Results CSV file
            use_sample: If True, use sample data instead of CSV files
        
        Returns:
            Tuple of (AnalysisOutput object, raw JSON string)
        """
        print("\n" + "="*70)
        print(f"📊 AI-POWERED FUNDAMENTAL STOCK ANALYZER")
        print("="*70)
        print(f"Company: {company_name}")
        print(f"Model: {self.model_name}")
        print(f"Temperature: {self.temperature}")
        print("="*70 + "\n")
        
        # Load data

        
        # Perform analysis
        print("🧠 AI is analyzing financial statements...")
        print("⏳ This may take 30-60 seconds...\n")
        
        analysis, raw_json = self.analyzer.analyze_fundamentals(
            df_pnl=df_pnl,
            df_balance_sheet=df_bs,
            df_shareholding=df_share,
            df_quarterly=df_quarterly,
            company_name=company_name
        )
        
        if analysis:
            print("✅ Analysis completed successfully!\n")
        else:
            print("⚠️  Structured parsing failed. Raw JSON output available.\n")
        
        return analysis, raw_json
    
    def display_results(self, analysis):
        """Display analysis results in terminal"""
        if not analysis:
            print("❌ No analysis results to display")
            return
        
        print("\n" + "="*70)
        print("📈 ANALYSIS RESULTS")
        print("="*70 + "\n")
        
        # Overall metrics
        print(f"Overall Sentiment: {analysis.overall_sentiment}")
        print(f"Risk Rating: {analysis.risk_rating}")
        print(f"Analysis Date: {analysis.analysis_date}")
        print("\n" + "-"*70 + "\n")
        
        # Executive Summary
        print("📝 EXECUTIVE SUMMARY")
        print("-"*70)
        print(analysis.analyst_summary)
        print("\n" + "-"*70 + "\n")
        
        # Key Metrics
        print("🔢 KEY FINANCIAL METRICS")
        print("-"*70)
        metrics = analysis.key_metrics
        print(f"Revenue Growth (3Y): {metrics.revenue_growth_3y or 'N/A'}")
        print(f"Profit Growth (3Y): {metrics.profit_growth_3y or 'N/A'}")
        print(f"EPS Growth: {metrics.eps_growth or 'N/A'}")
        print(f"Operating Margin: {metrics.operating_margin or 'N/A'}")
        print(f"ROE: {metrics.roe or 'N/A'}")
        print(f"ROCE: {metrics.roce or 'N/A'}")
        print(f"Debt-to-Equity: {metrics.debt_to_equity or 'N/A'}")
        print(f"Current Ratio: {metrics.current_ratio or 'N/A'}")
        print("\n" + "-"*70 + "\n")
        
        # Strengths
        print("✅ STRENGTHS")
        print("-"*70)
        for i, strength in enumerate(analysis.strengths, 1):
            print(f"{i}. {strength}")
        print("\n" + "-"*70 + "\n")
        
        # Weaknesses
        print("⚠️  WEAKNESSES & RED FLAGS")
        print("-"*70)
        for i, weakness in enumerate(analysis.weaknesses, 1):
            print(f"{i}. {weakness}")
        print("\n" + "-"*70 + "\n")
        
        # Quarterly Trend
        print("📊 QUARTERLY PERFORMANCE TREND")
        print("-"*70)
        print(analysis.quarterly_trend)
        print("\n" + "-"*70 + "\n")
        
        # Shareholding Pattern
        print("👥 SHAREHOLDING PATTERN ANALYSIS")
        print("-"*70)
        print(analysis.promoter_holding_trend)
        print("\n" + "-"*70 + "\n")
        
        # Future Outlook
        print("🔮 FUTURE OUTLOOK")
        print("-"*70)
        print(analysis.future_outlook)
        print("\n" + "="*70 + "\n")
    
    def save_report(self, analysis, filename=None):
        """Save analysis report to text file"""
        if not analysis:
            print("❌ No analysis to save")
            return
        
        report = self.analyzer.generate_report(analysis)
        
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"stock_analysis_{timestamp}.txt"
        
        with open(filename, 'w') as f:
            f.write(report)
        
        print(f"📄 Report saved to: {filename}")
    
    def save_json(self, analysis, filename=None):
        """Save analysis as JSON"""
        if not analysis:
            print("❌ No analysis to save")
            return
        
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"stock_analysis_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(analysis.dict(), f, indent=2)
        
        print(f"📋 JSON saved to: {filename}")


def main():
    """Main function for terminal usage"""


    try:
        # Initialize analyzer
        analyzer = TerminalStockAnalyzer(
            api_key=os.getenv("GOOGLE_API_KEY"),
            model_name="gemini-2.5-pro",
            temperature=0.7
        )
        
        # Perform analysis
        analysis, raw_json = analyzer.analyze(
            company_name='JKPAPER',
            df_pnl=df_Pnl,
            df_bs=df_BS,
            df_share=df_share,
            df_quarterly7y=df_qr,
            use_sample=False
        )
        
        # Display results
        analyzer.display_results(analysis)
        
        # Save report and JSON
        analyzer.save_report(analysis)
        analyzer.save_json(analysis)
        
    
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()