from data_fetcher.data import DataFetcher
from data_fetcher.analyser import TechnicalAnalyser,StockSentimentAnalyzer


symbol = "REL"

news_analyzer = StockSentimentAnalyzer(symbol, company_name="Reliance Industries")
    
df_news = news_analyzer.analyze_all_news(days_back=7, sources=['google'])
df_technical,analysis_report = TechnicalAnalyser().analyze_stock(symbol, plot=False, use_bb_strategy=True)

# print(analysis_report)
# print(df_news)
# print(df_technical)


"""
AI-Powered Stock Analysis System
Combines technical indicators, news sentiment, and historical data using RAG
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.docstore.document import Document
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

class StockAnalysisRAG:
    """
    RAG-based Stock Analysis System combining technical and fundamental analysis
    """
    
    def __init__(self, gemini_api_key: str, use_local_embeddings: bool = True):
        """
        Initialize the RAG system
        
        Args:
            gemini_api_key: Google Gemini API key
            use_local_embeddings: If True, uses HuggingFace embeddings (free), 
                                 else uses Google embeddings
        """
        self.gemini_api_key = gemini_api_key
        os.environ["GOOGLE_API_KEY"] = gemini_api_key
        
        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro",
            temperature=0.7,
            max_output_tokens=8192  # Changed from max_tokens to max_output_tokens
        )
        
        # Initialize embeddings
        if use_local_embeddings:
            # Free, runs locally - good for cost-effective solution
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
        else:
            # Uses Google's embeddings (requires API quota)
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001"
            )
        
        self.vectorstore = None
        self.retrieval_chain = None
        
    def prepare_technical_documents(self, df_technical: pd.DataFrame, 
                                    analysis_report: str) -> List[Document]:
        """
        Convert technical analysis data into documents for RAG
        """
        documents = []
        
        # Add analysis report summary
        documents.append(Document(
            page_content=f"Technical Analysis Report:\n{analysis_report}",
            metadata={"type": "summary", "date": str(datetime.now())}
        ))
        
        # Recent price action (last 30 days)
        recent_data = df_technical.head(30)
        for idx, row in recent_data.iterrows():
            content = f"""
            Date: {row['DATE']}
            Price Action: Open={row['OPEN']}, High={row['HIGH']}, Low={row['LOW']}, Close={row['PREV. CLOSE']}
            Technical Indicators:
            - RSI: {row.get('RSI', 'N/A')}
            - EMA Signal: {row.get('EMASignal', 'N/A')}
            - Bollinger Bands: Lower={row.get('BB_Lower', 'N/A'):.2f}, Middle={row.get('BB_Middle', 'N/A'):.2f}, Upper={row.get('BB_Upper', 'N/A'):.2f}
            - BB Position: {row.get('BBP_20_2.5', 'N/A')}
            - Volume: {row.get('VOLUME', 'N/A')}
            """
            documents.append(Document(
                page_content=content.strip(),
                metadata={"type": "technical", "date": str(row['DATE'])}
            ))
        
        return documents
    
    def prepare_news_documents(self, df_news: pd.DataFrame) -> List[Document]:
        """
        Convert news data into documents for RAG
        """
        documents = []
        
        for idx, row in df_news.iterrows():
            content = f"""
            News Title: {row['title']}
            Sentiment: {row['textblob_sentiment']}
            Analysis: This news article about Reliance Industries carries a {row['textblob_sentiment'].lower()} sentiment.
            """
            
            documents.append(Document(
                page_content=content.strip(),
                metadata={
                    "type": "news",
                    "sentiment": row['textblob_sentiment'],
                    "title": row['title']
                }
            ))
        
        return documents
    
    def prepare_market_context(self, df_technical: pd.DataFrame) -> Document:
        """
        Create overall market context document
        """
        latest = df_technical.iloc[0]
        avg_volume = df_technical['VOLUME'].mean()
        price_change = ((latest['PREV. CLOSE'] - df_technical.iloc[-1]['PREV. CLOSE']) / 
                       df_technical.iloc[-1]['PREV. CLOSE'] * 100)
        
        content = f"""
        Overall Market Context for REL:
        
        Current Price: ₹{latest['PREV. CLOSE']:.2f}
        52-Week Performance: {price_change:.2f}% change over analyzed period
        Average Daily Volume: {avg_volume:,.0f} shares
        Current Market Status: {"Bullish" if price_change > 5 else "Bearish" if price_change < -5 else "Neutral"}
        
        Price Range: 
        - Highest: ₹{df_technical['HIGH'].max():.2f}
        - Lowest: ₹{df_technical['LOW'].min():.2f}
        
        Technical Health:
        - Current RSI indicates {"overbought" if latest.get('RSI', 50) > 70 else "oversold" if latest.get('RSI', 50) < 30 else "neutral"} conditions
        - EMA signals suggest {"bullish" if latest.get('EMASignal', 0) == 2 else "bearish" if latest.get('EMASignal', 0) == 1 else "neutral"} momentum
        """
        
        return Document(
            page_content=content.strip(),
            metadata={"type": "context"}
        )
    
    def build_knowledge_base(self, df_technical: pd.DataFrame, 
                           df_news: pd.DataFrame, 
                           analysis_report: str):
        """
        Build FAISS vector store from all data sources
        """
        print("Building knowledge base...")
        
        # Prepare all documents
        documents = []
        documents.extend(self.prepare_technical_documents(df_technical, analysis_report))
        documents.extend(self.prepare_news_documents(df_news))
        documents.append(self.prepare_market_context(df_technical))
        
        print(f"Created {len(documents)} documents")
        
        # Split documents if needed
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,  # Increased from 1000
            chunk_overlap=300,  # Increased from 200
            length_function=len
        )
        
        split_docs = text_splitter.split_documents(documents)
        print(f"Split into {len(split_docs)} chunks")
        
        # Create vector store
        self.vectorstore = FAISS.from_documents(split_docs, self.embeddings)
        print("Vector store created successfully!")
        
        # Create retrieval chain
        self._create_retrieval_chain()
    
    def _create_retrieval_chain(self):
        """
        Create the retrieval QA chain
        """
        # Custom prompt template
        prompt_template = """You are an expert stock market analyst specializing in technical and fundamental analysis.
        
Use the following pieces of context to answer the question. Be specific, data-driven, and actionable.

Context:
{context}

Question: {input}

Provide a comprehensive answer that:
1. References specific data points from the context
2. Explains technical indicators in simple terms
3. Considers both technical analysis and news sentiment
4. Gives actionable insights (but not direct buy/sell advice)
5. Mentions risks and limitations
6. Answer should be under 8192 tokens (dont mention this in answer)

Answer:"""

        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "input"]
        )
        
        # Create retrieval chain
        retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 8}  # Increased from 6 to 8 for more context
        )
        
        # Create document chain
        document_chain = create_stuff_documents_chain(self.llm, prompt)
        
        # Create full retrieval chain
        self.retrieval_chain = create_retrieval_chain(retriever, document_chain)
        
    def query(self, question: str) -> Dict[str, Any]:
        """
        Query the RAG system
        
        Args:
            question: User's question about the stock
            
        Returns:
            Dictionary with answer and source documents
        """
        if not self.retrieval_chain:
            raise ValueError("Knowledge base not built. Call build_knowledge_base() first.")
        
        result = self.retrieval_chain.invoke({"input": question})
        return result
    
    def get_trading_recommendation(self) -> str:
        """
        Get AI-powered trading recommendation
        """
        question = """Based on all available technical indicators, recent price action, 
        and news sentiment, provide a detailed analysis of REL stock. Include:
        1. Current market position and trend
        2. Key support and resistance levels
        3. Sentiment analysis from recent news
        4. Technical indicator signals (RSI, EMA, Bollinger Bands)
        5. Overall outlook with risk factors"""
        
        result = self.query(question)
        return result['answer']
    
    def save_vectorstore(self, path: str = "stock_vectorstore"):
        """
        Save the vector store to disk
        """
        if self.vectorstore:
            self.vectorstore.save_local(path)
            print(f"Vector store saved to {path}")
    
    def load_vectorstore(self, path: str = "stock_vectorstore"):
        """
        Load vector store from disk
        """
        self.vectorstore = FAISS.load_local(
            path, 
            self.embeddings,
            allow_dangerous_deserialization=True
        )
        self._create_retrieval_chain()
        print(f"Vector store loaded from {path}")


# Example usage
def main():
    """
    Example usage of the Stock Analysis RAG system
    """
    
    # Initialize (replace with your actual API key)
    GEMINI_API_KEY = os.environ['GOOGLE_API_KEY']
    
    rag_system = StockAnalysisRAG(
        gemini_api_key=GEMINI_API_KEY,
        use_local_embeddings=True  # Set False to use Google embeddings
    )
    
    # FIX: Build the knowledge base BEFORE querying
    rag_system.build_knowledge_base(df_technical, df_news, analysis_report)
    
    questions = [
        f"What is the current technical outlook for {symbol} stock?",
        f"How is the news sentiment affecting the {symbol} stock?",
        f"What are the key support and resistance levels for {symbol}?",
        f"Should I be concerned about the current RSI value for {symbol}?",
        f"What is the overall market sentiment based on recent news for {symbol}?"
    ]
    
    print("\n" + "="*80)
    print("AI STOCK ANALYSIS ASSISTANT")
    print("="*80 + "\n")
    
    for question in questions:
        print(f"\nQ: {question}")
        print("-" * 80)
        result = rag_system.query(question)
        print(f"A: {result['answer']}\n")
    
    # Get comprehensive recommendation
    print("\n" + "="*80)
    print("COMPREHENSIVE TRADING RECOMMENDATION")
    print("="*80 + "\n")
    recommendation = rag_system.get_trading_recommendation()
    print(recommendation)


if __name__ == "__main__":
    main()