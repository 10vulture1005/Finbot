"""
Streamlit Web Interface for Fundamental Stock Analyzer
Run with: streamlit run app.py
"""

import streamlit as st
import pandas as pd
from datetime import datetime
import os
from analyzer import FundamentalStockAnalyzer, AnalysisOutput

# Page configuration
st.set_page_config(
    page_title="AI Stock Fundamental Analyzer",
    page_icon="📊",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    .positive {
        color: #28a745;
        font-weight: bold;
    }
    .negative {
        color: #dc3545;
        font-weight: bold;
    }
    .neutral {
        color: #ffc107;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# HEADER
# ============================================================================

st.markdown('<div class="main-header">📊 AI-Powered Fundamental Stock Analyzer</div>', 
            unsafe_allow_html=True)
st.markdown("### Powered by LangChain + Google Gemini API")
st.markdown("---")

# ============================================================================
# SIDEBAR - CONFIGURATION
# ============================================================================

with st.sidebar:
    st.header("⚙️ Configuration")
    
    # API Key input
    api_key = st.text_input(
        "Google API Key",
        type="password",
        value=os.getenv("GOOGLE_API_KEY", ""),
        help="Enter your Google Gemini API key"
    )
    
    # Model selection
    model_name = st.selectbox(
        "Select Model",
        ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
        index=0
    )
    
    # Temperature
    temperature = st.slider(
        "Temperature",
        min_value=0.0,
        max_value=1.0,
        value=0.3,
        step=0.1,
        help="Lower = more focused, Higher = more creative"
    )
    
    st.markdown("---")
    st.markdown("### 📄 About")
    st.info("""
    This tool analyzes company fundamentals using:
    - Profit & Loss statements
    - Balance Sheets
    - Shareholding patterns
    - Quarterly results
    
    Upload CSV files or paste data to get AI-powered insights.
    """)

# ============================================================================
# MAIN CONTENT - DATA INPUT
# ============================================================================

st.header("📁 Input Financial Data")

# Company name
company_name = st.text_input("Company Name", value="Sample Company Ltd")

# Create tabs for different input methods
tab1, tab2 = st.tabs(["📤 Upload CSV Files", "📋 Sample Data"])

with tab1:
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Profit & Loss Statement")
        pnl_file = st.file_uploader("Upload P&L CSV", type=['csv'], key='pnl')
        
        st.subheader("Shareholding Pattern")
        share_file = st.file_uploader("Upload Shareholding CSV", type=['csv'], key='share')
    
    with col2:
        st.subheader("Balance Sheet")
        bs_file = st.file_uploader("Upload Balance Sheet CSV", type=['csv'], key='bs')
        
        st.subheader("Quarterly Results")
        qr_file = st.file_uploader("Upload Quarterly Results CSV", type=['csv'], key='qr')

with tab2:
    st.info("📊 Using sample data for demonstration. Upload your own CSV files in the 'Upload CSV Files' tab.")
    
    # Sample data
    df_pnl_sample = pd.DataFrame({
        'Year': ['Mar 2023', 'Mar 2022', 'Mar 2021', 'Mar 2020'],
        'Revenue': [5240, 4680, 3820, 3450],
        'Operating Profit': [892, 756, 612, 534],
        'Net Profit': [612, 498, 387, 298],
        'EPS': [45.2, 36.8, 28.6, 22.1]
    })
    
    df_bs_sample = pd.DataFrame({
        'Year': ['Mar 2023', 'Mar 2022', 'Mar 2021'],
        'Total Assets': [4520, 3980, 3240],
        'Total Debt': [1240, 1120, 980],
        'Equity': [2180, 1920, 1680],
        'Current Assets': [1820, 1580, 1320],
        'Current Liabilities': [980, 860, 720]
    })
    
    df_share_sample = pd.DataFrame({
        'Quarter': ['Jun 2023', 'Mar 2023', 'Dec 2022'],
        'Promoter %': [68.5, 69.2, 69.8],
        'FII %': [12.3, 11.8, 10.5],
        'DII %': [8.9, 8.2, 7.8]
    })
    
    df_quarterly_sample = pd.DataFrame({
        'Quarter': ['Jun 2023', 'Mar 2023', 'Dec 2022', 'Sep 2022'],
        'Revenue': [1380, 1420, 1320, 1120],
        'Net Profit': [168, 172, 158, 114],
        'EPS': [12.4, 12.7, 11.7, 8.4]
    })
    
    col1, col2 = st.columns(2)
    with col1:
        st.write("**P&L Statement**")
        st.dataframe(df_pnl_sample, use_container_width=True)
        st.write("**Shareholding Pattern**")
        st.dataframe(df_share_sample, use_container_width=True)
    
    with col2:
        st.write("**Balance Sheet**")
        st.dataframe(df_bs_sample, use_container_width=True)
        st.write("**Quarterly Results**")
        st.dataframe(df_quarterly_sample, use_container_width=True)

st.markdown("---")

# ============================================================================
# ANALYSIS BUTTON
# ============================================================================

col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    analyze_button = st.button("🚀 Analyze Fundamentals", type="primary", use_container_width=True)

# ============================================================================
# ANALYSIS EXECUTION
# ============================================================================

if analyze_button:
    if not api_key:
        st.error("⚠️ Please provide a Google API Key in the sidebar!")
    else:
        # Load data
        try:
            if pnl_file and bs_file and share_file and qr_file:
                df_pnl = pd.read_csv(pnl_file)
                df_bs = pd.read_csv(bs_file)
                df_share = pd.read_csv(share_file)
                df_quarterly = pd.read_csv(qr_file)
                st.success("✅ CSV files loaded successfully!")
            else:
                # Use sample data
                df_pnl = df_pnl_sample
                df_bs = df_bs_sample
                df_share = df_share_sample
                df_quarterly = df_quarterly_sample
                st.info("ℹ️ Using sample data for analysis")
            
            # Initialize analyzer
            with st.spinner("🔄 Initializing AI analyzer..."):
                analyzer = FundamentalStockAnalyzer(
                    api_key=api_key,
                    model_name=model_name,
                    temperature=temperature
                )
            
            # Perform analysis
            with st.spinner("🧠 AI is analyzing financial statements... This may take 30-60 seconds."):
                analysis, raw_json = analyzer.analyze_fundamentals(
                    df_pnl=df_pnl,
                    df_balance_sheet=df_bs,
                    df_shareholding=df_share,
                    df_quarterly=df_quarterly,
                    company_name=company_name
                )
            
            if analysis:
                st.success("✅ Analysis completed successfully!")
                
                # Store in session state
                st.session_state['analysis'] = analysis
                st.session_state['report'] = analyzer.generate_report(analysis)
                
            else:
                st.warning("⚠️ Structured parsing failed. Showing raw output:")
                st.code(raw_json, language='json')
        
        except Exception as e:
            st.error(f"❌ Error during analysis: {str(e)}")
            st.exception(e)

# ============================================================================
# DISPLAY RESULTS
# ============================================================================

if 'analysis' in st.session_state:
    analysis = st.session_state['analysis']
    
    st.markdown("---")
    st.header("📈 Analysis Results")
    
    # Overall sentiment and metrics
    col1, col2, col3 = st.columns(3)
    
    sentiment_class = "positive" if "Bullish" in analysis.overall_sentiment else \
                      "negative" if "Bearish" in analysis.overall_sentiment else "neutral"
    
    with col1:
        st.metric("Overall Sentiment", analysis.overall_sentiment)
    with col2:
        st.metric("Risk Rating", analysis.risk_rating)
    with col3:
        st.metric("Analysis Date", analysis.analysis_date)
    
    # Executive Summary
    st.subheader("📝 Executive Summary")
    st.info(analysis.analyst_summary)
    
    # Key Metrics
    st.subheader("🔢 Key Financial Metrics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Revenue Growth (3Y)", analysis.key_metrics.revenue_growth_3y or "N/A")
        st.metric("ROE", analysis.key_metrics.roe or "N/A")
    
    with col2:
        st.metric("Profit Growth (3Y)", analysis.key_metrics.profit_growth_3y or "N/A")
        st.metric("ROCE", analysis.key_metrics.roce or "N/A")
    
    with col3:
        st.metric("EPS Growth", analysis.key_metrics.eps_growth or "N/A")
        st.metric("Debt-to-Equity", analysis.key_metrics.debt_to_equity or "N/A")
    
    with col4:
        st.metric("Operating Margin", analysis.key_metrics.operating_margin or "N/A")
        st.metric("Current Ratio", analysis.key_metrics.current_ratio or "N/A")
    
    # Strengths and Weaknesses
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("✅ Strengths")
        for strength in analysis.strengths:
            st.success(f"• {strength}")
    
    with col2:
        st.subheader("⚠️ Weaknesses & Red Flags")
        for weakness in analysis.weaknesses:
            st.warning(f"• {weakness}")
    
    # Quarterly Trend
    st.subheader("📊 Quarterly Performance Trend")
    st.write(analysis.quarterly_trend)
    
    # Shareholding Pattern
    st.subheader("👥 Shareholding Pattern Analysis")
    st.write(analysis.promoter_holding_trend)
    
    # Future Outlook
    st.subheader("🔮 Future Outlook")
    st.write(analysis.future_outlook)
    
    # Download options
    st.markdown("---")
    st.subheader("💾 Download Reports")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.download_button(
            label="📄 Download Text Report",
            data=st.session_state['report'],
            file_name=f"{company_name.replace(' ', '_')}_report.txt",
            mime="text/plain"
        )
    
    with col2:
        import json
        json_data = json.dumps(analysis.dict(), indent=2)
        st.download_button(
            label="📋 Download JSON Analysis",
            data=json_data,
            file_name=f"{company_name.replace(' ', '_')}_analysis.json",
            mime="application/json"
        )

# ============================================================================
# FOOTER
# ============================================================================

st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #888;'>
    <p>Built with ❤️ using LangChain + Google Gemini API | © 2024</p>
</div>
""", unsafe_allow_html=True)