import streamlit as st
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
from dotenv import load_dotenv
load_dotenv()
st.title("💹 AI Financial Advisor")

uploaded_file = st.file_uploader("Upload your portfolio JSON", type="json")

if uploaded_file:
    portfolio = json.load(uploaded_file)
    st.json(portfolio)
    
    query = st.text_input("Ask something about your portfolio:")
    
    if query:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.7)
        sysconfig = """You are a financial advisor bot that gives practical,
        research-backed investment advice. Suggest portfolio improvements,
        rebalancing, and new investment ideas based on the user's data."""
        
        messages = [
            SystemMessage(content=sysconfig),
            HumanMessage(content=f"Portfolio: {json.dumps(portfolio)}"),
            HumanMessage(content=query)
        ]
        
        response = llm(messages)
        st.write(response.content)
