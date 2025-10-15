from data_fetcher.data import DataFetcher
from data_fetcher.analyser import TechnicalAnalyser,StockSentimentAnalyzer


symbol = "REL"

news_analyzer = StockSentimentAnalyzer(symbol, company_name="Reliance Industries")
    
# Scrape and analyze news
df_news = news_analyzer.analyze_all_news(days_back=7, sources=['google'])
df_technical,analysis_report = TechnicalAnalyser().analyze_stock(symbol, plot=False, use_bb_strategy=True)






