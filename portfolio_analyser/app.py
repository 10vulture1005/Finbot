import pandas as pd
import requests
import streamlit as st
from dotenv import load_dotenv
import os
import json
import time
load_dotenv()
api_key = os.getenv("API_KEY")
results = []
resultsmini = []
df = pd.read_csv(r'/home/vulture/codefiles/python/langchain/portfoliomanager/EQUITY_L.csv')


def get_symbols():
    return df['SYMBOL'].dropna().tolist()

def search_symbols(query):
    if not query:
        return []
    query = query.lower()
    matches = [s for s in get_symbols() if query in s.lower()]
    return matches[:10]  

def get_symbol_info(symbol):
    try:
        url = "https://stock.indianapi.in/stock"
        querystring = {"name": symbol}
        headers = {"X-Api-Key": api_key}
        res = requests.get(url, headers=headers, params=querystring)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        st.error(f"Error fetching {symbol}: {e}")
        return {}


st.title("📈 Stock Portfolio Builder")

if "portfolio" not in st.session_state:
    st.session_state.portfolio = []

query = st.text_input("🔍 Search stock symbol (partial name supported)")
matches = search_symbols(query)

if matches:
    symbol = st.selectbox("Select a stock", matches)
else:
    symbol = None

quantity = st.number_input("Enter quantity", min_value=1, step=1)
avgbuy = st.number_input("Enter average buy price",min_value = 0.0,step=0.01)

if st.button("➕ Add to Portfolio"):
    if symbol:
        st.session_state.portfolio.append({"symbol": symbol, "quantity": quantity, "average_buy_price": avgbuy})
        st.success(f"Added {symbol} ({quantity}) to portfolio")
    else:
        st.warning("Please select a valid stock symbol first")

if st.session_state.portfolio:
    st.subheader("📊 Current Portfolio")
    portfolio_df = pd.DataFrame(st.session_state.portfolio)
    st.dataframe(portfolio_df, use_container_width=True)

    if st.button("🔎 Get Stock Info"):
        
        for item in st.session_state.portfolio:
            time.sleep(1)
            info = get_symbol_info(item["symbol"])
            ninfo = {
                "tickerid": info.get("tickerId"),
                "industry": info.get("industry"),
                "currentprice_NSE": info.get("currentPrice", {}).get("NSE"),
                "stockTechnicalData": info.get("stockTechnicalData"),
                "analystview": info.get("analystView"),
                "shareholding": info.get("shareholding"),
                "recentnews": info.get("recentNews")
            }
            results.append({"symbol": item["symbol"], "quantity": item["quantity"], "average_buy_price": item["average_buy_price"], "info": ninfo})
            resultsmini.append({"symbol": item["symbol"], "quantity": item["quantity"], "average_buy_price": item["average_buy_price"], "price": ninfo["currentprice_NSE"]})
            with open("portfolio.json", "w") as f:
                json.dump(results, f, indent=4)
        st.json(resultsmini)


# from info tickerid, industry, currentprice["NSE"], stocktechnicaldata,analist view, shareholding,recent news


#langchain part

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage

if results:
    portfolio = results
    query = st.text_input("Enter your query about the portfolio:")
    if st.button("Get Portfolio Analysis"):
        if query:
            model = ChatGoogleGenerativeAI(temperature=0.7, model="gemini-2.5-pro")
            sysconfig = """You are a financial advisor bot that gives practical,
        research-backed investment advice. Suggest portfolio improvements,
        rebalancing, and new investment ideas based on the user's data."""
            system_message = SystemMessage(content=sysconfig)
            # portfolio_details = "\n".join([f"Symbol: {item['symbol']}, Quantity: {item['quantity']}, Average Buy Price: {item['average_buy_price']}, Current Price: {item['info']['currentprice_NSE']}, Industry: {item['info']['industry']}" for item in portfolio])
            portfolio_details = portfolio
            human_message = HumanMessage(content=f"Portfolio Details:\n{portfolio_details}\n\nUser Query: {query}")
            response = model([system_message, human_message])
            st.markdown("### Portfolio Analysis:")
            st.write(response.content)
        else:
            st.warning("Please enter a query to analyze the portfolio.")