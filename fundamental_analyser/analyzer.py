"""
Fundamental Stock Analyzer using LangChain + Gemini API
Author: AI Financial Systems
Version: 1.0
"""

import pandas as pd
import json
from typing import Dict, Optional, Tuple
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
import os


# ============================================================================
# OUTPUT SCHEMA DEFINITION
# ============================================================================

class KeyMetrics(BaseModel):
    """Key financial metrics and ratios"""
    revenue_growth_3y: Optional[str] = Field(description="3-year revenue CAGR")
    profit_growth_3y: Optional[str] = Field(description="3-year profit CAGR")
    eps_growth: Optional[str] = Field(description="EPS growth trend")
    roe: Optional[str] = Field(description="Return on Equity")
    roce: Optional[str] = Field(description="Return on Capital Employed")
    debt_to_equity: Optional[str] = Field(description="Debt to Equity ratio")
    current_ratio: Optional[str] = Field(description="Current Ratio")
    operating_margin: Optional[str] = Field(description="Operating Profit Margin")


class AnalysisOutput(BaseModel):
    """Structured output for fundamental analysis"""
    company_name: str = Field(description="Company name being analyzed")
    analysis_date: str = Field(description="Date of analysis")
    
    key_metrics: KeyMetrics = Field(description="Key financial metrics")
    
    strengths: list[str] = Field(description="List of company strengths (3-5 points)")
    weaknesses: list[str] = Field(description="List of weaknesses and red flags (3-5 points)")
    
    quarterly_trend: str = Field(description="Summary of quarterly performance trends")
    
    promoter_holding_trend: str = Field(description="Promoter and institutional holding analysis")
    
    future_outlook: str = Field(description="Forward-looking outlook based on trends")
    
    overall_sentiment: str = Field(description="Overall sentiment: Bullish/Neutral/Bearish")
    
    analyst_summary: str = Field(description="Concise 2-3 sentence executive summary")
    
    risk_rating: str = Field(description="Risk level: Low/Medium/High")


# ============================================================================
# PROMPT TEMPLATE
# ============================================================================

ANALYSIS_PROMPT = """You are an expert equity research analyst with 15+ years of experience in fundamental analysis. 
Your task is to analyze the provided financial statements and generate a comprehensive research report.

**FINANCIAL DATA:**

### Profit & Loss Statement (Annual):
{pnl_data}

### Balance Sheet (Annual):
{balance_sheet_data}

### Shareholding Pattern:
{shareholding_data}

### Quarterly Results:
{quarterly_data}

---

**ANALYSIS INSTRUCTIONS:**

Perform a thorough fundamental analysis covering:

1. **Profitability Trends:** Analyze revenue, net profit, and EPS growth over the years. Calculate or estimate CAGR where possible.

2. **Margin Analysis:** Evaluate operating margins, net profit margins, and their trends. Identify margin expansion or compression.

3. **Efficiency Ratios:** Assess ROE (Return on Equity), ROCE (Return on Capital Employed), and asset turnover trends.

4. **Financial Health:** Examine debt levels, debt-to-equity ratio, interest coverage, current ratio, and cash position. Flag any concerning debt trends.

5. **Shareholding Pattern:** Analyze promoter holding changes, FII/DII participation, and pledge status. Identify any red flags.

6. **Quarterly Momentum:** Compare recent quarters (QoQ and YoY). Identify acceleration or deceleration in growth.

7. **Red Flags:** Explicitly call out: rising debt, declining margins, promoter stake reduction, working capital issues, or any other concerns.

8. **Sentiment & Outlook:** Based on all factors, provide an overall sentiment (Bullish/Neutral/Bearish) and forward outlook.

**IMPORTANT GUIDELINES:**
- If a metric is not available in the data, mention "Data not available" instead of making assumptions.
- Be objective and balanced - highlight both positives and negatives.
- Use specific numbers from the data to support your analysis.
- Keep the analyst summary concise but insightful.

{format_instructions}

Provide your analysis in the specified JSON format."""


# ============================================================================
# CORE ANALYZER CLASS
# ============================================================================

class FundamentalStockAnalyzer:
    """Main class for fundamental stock analysis using LangChain + Gemini"""
    
    def __init__(self, 
                 api_key: Optional[str] = None,
                 model_name: str = "gemini-1.5-pro",
                 temperature: float = 0.3):
        """
        Initialize the analyzer
        
        Args:
            api_key: Google API key (if None, reads from GOOGLE_API_KEY env var)
            model_name: Gemini model to use
            temperature: Model temperature (0.0-1.0, lower = more focused)
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key not provided. Set GOOGLE_API_KEY environment variable or pass api_key parameter.")
        
        self.model_name = model_name
        self.temperature = temperature
        
        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model=self.model_name,
            temperature=self.temperature,
            google_api_key=self.api_key
        )
        
        # Initialize parser
        self.parser = PydanticOutputParser(pydantic_object=AnalysisOutput)
        
        # Create prompt template
        self.prompt_template = ChatPromptTemplate.from_template(ANALYSIS_PROMPT)
    
    def _dataframe_to_markdown(self, df: pd.DataFrame, max_rows: int = 50) -> str:
        """
        Convert DataFrame to readable markdown format
        
        Args:
            df: Input DataFrame
            max_rows: Maximum rows to include
            
        Returns:
            Markdown formatted string
        """
        if df is None or df.empty:
            return "No data available"
        
        # Limit rows if too large
        if len(df) > max_rows:
            df = df.head(max_rows)
            note = f"\n\n*(Showing first {max_rows} rows)*"
        else:
            note = ""
        
        # Convert to markdown
        markdown = df.to_markdown(index=False, floatfmt=".2f")
        return markdown + note
    
    def _prepare_financial_context(self,
                                   df_pnl: pd.DataFrame,
                                   df_balance_sheet: pd.DataFrame,
                                   df_shareholding: pd.DataFrame,
                                   df_quarterly: pd.DataFrame) -> Dict[str, str]:
        """
        Prepare all financial data in text format for LLM
        
        Returns:
            Dictionary with formatted financial data
        """
        return {
            "pnl_data": self._dataframe_to_markdown(df_pnl),
            "balance_sheet_data": self._dataframe_to_markdown(df_balance_sheet),
            "shareholding_data": self._dataframe_to_markdown(df_shareholding),
            "quarterly_data": self._dataframe_to_markdown(df_quarterly)
        }
    
    def analyze_fundamentals(self,
                            df_pnl: pd.DataFrame,
                            df_balance_sheet: pd.DataFrame,
                            df_shareholding: pd.DataFrame,
                            df_quarterly: pd.DataFrame,
                            company_name: str = "Company") -> Tuple[AnalysisOutput, str]:
        """
        Perform comprehensive fundamental analysis
        
        Args:
            df_pnl: Profit & Loss DataFrame
            df_balance_sheet: Balance Sheet DataFrame
            df_shareholding: Shareholding Pattern DataFrame
            df_quarterly: Quarterly Results DataFrame
            company_name: Name of the company
            
        Returns:
            Tuple of (AnalysisOutput object, raw JSON string)
        """
        print(f"🔍 Analyzing fundamentals for {company_name}...")
        
        # Prepare context
        financial_context = self._prepare_financial_context(
            df_pnl, df_balance_sheet, df_shareholding, df_quarterly
        )
        
        # Create prompt
        prompt = self.prompt_template.format_messages(
            pnl_data=financial_context["pnl_data"],
            balance_sheet_data=financial_context["balance_sheet_data"],
            shareholding_data=financial_context["shareholding_data"],
            quarterly_data=financial_context["quarterly_data"],
            format_instructions=self.parser.get_format_instructions()
        )
        
        print("📡 Sending request to Gemini API...")
        
        # Get LLM response
        response = self.llm.invoke(prompt)
        raw_output = response.content
        
        print("✅ Analysis complete! Parsing results...")
        
        # Parse structured output
        try:
            parsed_output = self.parser.parse(raw_output)
        except Exception as e:
            print(f"⚠️  Warning: Could not parse structured output. Error: {e}")
            print("Returning raw output instead.")
            # Return raw output as fallback
            return None, raw_output
        
        return parsed_output, raw_output
    
    def generate_report(self, analysis: AnalysisOutput) -> str:
        """
        Generate a formatted text report from analysis output
        
        Args:
            analysis: AnalysisOutput object
            
        Returns:
            Formatted report string
        """
        report = f"""
{'='*80}
FUNDAMENTAL ANALYSIS REPORT
{'='*80}

Company: {analysis.company_name}
Analysis Date: {analysis.analysis_date}
Overall Sentiment: {analysis.overall_sentiment}
Risk Rating: {analysis.risk_rating}

{'='*80}
EXECUTIVE SUMMARY
{'='*80}
{analysis.analyst_summary}

{'='*80}
KEY FINANCIAL METRICS
{'='*80}
Revenue Growth (3Y CAGR): {analysis.key_metrics.revenue_growth_3y or 'N/A'}
Profit Growth (3Y CAGR): {analysis.key_metrics.profit_growth_3y or 'N/A'}
EPS Growth: {analysis.key_metrics.eps_growth or 'N/A'}
ROE: {analysis.key_metrics.roe or 'N/A'}
ROCE: {analysis.key_metrics.roce or 'N/A'}
Debt-to-Equity: {analysis.key_metrics.debt_to_equity or 'N/A'}
Current Ratio: {analysis.key_metrics.current_ratio or 'N/A'}
Operating Margin: {analysis.key_metrics.operating_margin or 'N/A'}

{'='*80}
STRENGTHS
{'='*80}
"""
        for i, strength in enumerate(analysis.strengths, 1):
            report += f"{i}. {strength}\n"
        
        report += f"""
{'='*80}
WEAKNESSES & RED FLAGS
{'='*80}
"""
        for i, weakness in enumerate(analysis.weaknesses, 1):
            report += f"{i}. {weakness}\n"
        
        report += f"""
{'='*80}
QUARTERLY PERFORMANCE TREND
{'='*80}
{analysis.quarterly_trend}

{'='*80}
SHAREHOLDING PATTERN ANALYSIS
{'='*80}
{analysis.promoter_holding_trend}

{'='*80}
FUTURE OUTLOOK
{'='*80}
{analysis.future_outlook}

{'='*80}
"""
        return report


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def save_analysis_to_json(analysis: AnalysisOutput, filepath: str):
    """Save analysis to JSON file"""
    with open(filepath, 'w') as f:
        json.dump(analysis.dict(), f, indent=2)
    print(f"💾 Analysis saved to {filepath}")


def save_report_to_file(report: str, filepath: str):
    """Save text report to file"""
    with open(filepath, 'w') as f:
        f.write(report)
    print(f"📄 Report saved to {filepath}")


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Sample data (replace with your actual DataFrames)
    
    # Example P&L DataFrame
    df_pnl = pd.DataFrame({
        'Year': ['Mar 2023', 'Mar 2022', 'Mar 2021', 'Mar 2020'],
        'Revenue': [5240, 4680, 3820, 3450],
        'Operating Profit': [892, 756, 612, 534],
        'Net Profit': [612, 498, 387, 298],
        'EPS': [45.2, 36.8, 28.6, 22.1]
    })
    
    # Example Balance Sheet DataFrame
    df_bs = pd.DataFrame({
        'Year': ['Mar 2023', 'Mar 2022', 'Mar 2021'],
        'Total Assets': [4520, 3980, 3240],
        'Total Debt': [1240, 1120, 980],
        'Equity': [2180, 1920, 1680],
        'Current Assets': [1820, 1580, 1320],
        'Current Liabilities': [980, 860, 720]
    })
    
    # Example Shareholding DataFrame
    df_share = pd.DataFrame({
        'Quarter': ['Jun 2023', 'Mar 2023', 'Dec 2022'],
        'Promoter %': [68.5, 69.2, 69.8],
        'FII %': [12.3, 11.8, 10.5],
        'DII %': [8.9, 8.2, 7.8]
    })
    
    # Example Quarterly Results
    df_quarterly = pd.DataFrame({
        'Quarter': ['Jun 2023', 'Mar 2023', 'Dec 2022', 'Sep 2022'],
        'Revenue': [1380, 1420, 1320, 1120],
        'Net Profit': [168, 172, 158, 114],
        'EPS': [12.4, 12.7, 11.7, 8.4]
    })
    
    # Initialize analyzer
    analyzer = FundamentalStockAnalyzer(
        model_name="gemini-1.5-pro",
        temperature=0.3
    )
    
    # Perform analysis
    analysis, raw_json = analyzer.analyze_fundamentals(
        df_pnl=df_pnl,
        df_balance_sheet=df_bs,
        df_shareholding=df_share,
        df_quarterly=df_quarterly,
        company_name="JK Paper Ltd"
    )
    
    if analysis:
        # Generate and print report
        report = analyzer.generate_report(analysis)
        print(report)
        
        # Save outputs
        save_analysis_to_json(analysis, "jkpaper_analysis.json")
        save_report_to_file(report, "jkpaper_report.txt")
    else:
        print("\n📄 RAW OUTPUT (Structured parsing failed):")
        print(raw_json)