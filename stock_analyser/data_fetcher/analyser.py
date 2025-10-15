from .data import DataFetcher
from .IndicatorCalculator import IndicatorCalculator as ic
import matplotlib.pyplot as plt
import pandas as pd
import pandas_ta as ta
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import time
class TechnicalAnalyser:
    
    def __init__(self):
        pass
    
    def add_ema_signal(self, df, backcandles):
        """
        Add EMA trend signal based on price position relative to EMA
        
        Args:
            df: DataFrame with EMA column
            backcandles: Number of candles to look back
        
        Returns:
            DataFrame with EMASignal column
        """
        emasignal = [0] * len(df)
        for row in range(backcandles, len(df)):
            upt = 1
            dnt = 1
            for i in range(row - backcandles, row + 1):
                if df.HIGH.iloc[i] >= df.EMA.iloc[i]:
                    dnt = 0
                if df.LOW.iloc[i] <= df.EMA.iloc[i]:
                    upt = 0
            if upt == 1 and dnt == 1:
                emasignal[row] = 3
            elif upt == 1:
                emasignal[row] = 2
            elif dnt == 1:
                emasignal[row] = 1
        df['EMASignal'] = emasignal
        return df
    
    def add_bb_strategy_signals(self, df, percent=0.00):
        """
        Add Bollinger Band strategy signals with EMA confirmation
        
        Strategy:
        - BUY: EMASignal=2 (uptrend) AND Close <= Lower BB
        - SELL: EMASignal=1 (downtrend) AND Close >= Upper BB
        
        Args:
            df: DataFrame with EMA, BB, and RSI
            percent: Price adjustment percent for limit orders
        
        Returns:
            DataFrame with BB_Signal column
        """
        df['BB_Signal'] = 0
        
        for i in range(1, len(df)):
            # Buy signal: Uptrend and price at/below lower BB
            if df.EMASignal.iloc[i] == 2 and df.CLOSE.iloc[i] <= df['BB_Lower'].iloc[i]:
                if percent > 0:
                    df.loc[df.index[i], 'BB_Signal'] = 1
                    df.loc[df.index[i], 'OrderPrice'] = df.CLOSE.iloc[i] - df.CLOSE.iloc[i] * percent
                else:
                    df.loc[df.index[i], 'BB_Signal'] = 1
            
            # Sell signal: Downtrend and price at/above upper BB
            elif df.EMASignal.iloc[i] == 1 and df.CLOSE.iloc[i] >= df['BB_Upper'].iloc[i]:
                if percent > 0:
                    df.loc[df.index[i], 'BB_Signal'] = -1
                    df.loc[df.index[i], 'OrderPrice'] = df.CLOSE.iloc[i] + df.CLOSE.iloc[i] * percent
                else:
                    df.loc[df.index[i], 'BB_Signal'] = -1
        
        return df
    
    def signal_generator(self, df):
        """
        Generate buy/sell signals based on combined strategy
        
        Strategy Rules:
        - BUY: RSI < 30 AND MACD bullish crossover AND Price < Lower Bollinger Band
        - SELL: RSI > 70 AND MACD bearish crossover AND Price > Upper Bollinger Band
        
        Args:
            df (pd.DataFrame): DataFrame with all indicators
        
        Returns:
            pd.DataFrame: DataFrame with Signal column added
        """
        df['Signal'] = 0  # 0 = Hold, 1 = Buy, -1 = Sell
        
        # Detect MACD crossovers
        df['MACD_Crossover'] = 0
        df.loc[df['MACD'] > df['Signal_Line'], 'MACD_Crossover'] = 1  # Bullish
        df.loc[df['MACD'] < df['Signal_Line'], 'MACD_Crossover'] = -1  # Bearish
        
        # Detect crossover changes
        df['MACD_Cross_Signal'] = df['MACD_Crossover'].diff()
        
        # Buy Signal: RSI < 30, MACD bullish crossover, Price < Lower BB
        buy_condition = (
            (df['RSI'] < 30) & 
            (df['MACD_Cross_Signal'] > 0) & 
            (df['CLOSE'] < df['BB_Lower'])
        )
        
        # Sell Signal: RSI > 70, MACD bearish crossover, Price > Upper BB
        sell_condition = (
            (df['RSI'] > 70) & 
            (df['MACD_Cross_Signal'] < 0) & 
            (df['CLOSE'] > df['BB_Upper'])
        )
        
        df.loc[buy_condition, 'Signal'] = 1
        df.loc[sell_condition, 'Signal'] = -1
        
        # Clean up temporary columns
        df.drop(['MACD_Crossover', 'MACD_Cross_Signal'], axis=1, inplace=True)
        
        return df
    
    def analyze_stock(self, symbol, period="6mo", interval="1d", plot=False, use_bb_strategy=False):
        """
        Main function to perform complete technical analysis
        
        Args:
            symbol (str): Stock ticker symbol
            period (str): Data period
            interval (str): Data interval
            plot (bool): Whether to plot the results
            use_bb_strategy (bool): Use BB+EMA strategy instead of RSI+MACD+BB
        
        Returns:
            pd.DataFrame: Complete analysis with all indicators and signals
        """
        report = ""
        report += f"\n{'='*60}\n"
        report += f"Technical Analysis for {symbol.upper()}\n"
        report += f"{'='*60}\n\n"
        
        # Fetch data
        data = DataFetcher(symbol)
        df = data.get_data()
        
        # Calculate indicators
        report += "Calculating technical indicators...\n"
        
        # Calculate RSI using pandas_ta
        df['RSI'] = ta.rsi(df.CLOSE, length=2 if use_bb_strategy else 14)
        
        # Calculate EMA/SMA
        df['EMA'] = ta.sma(df.CLOSE, length=200)
        
        # Calculate Bollinger Bands using pandas_ta
        my_bbands = ta.bbands(df.CLOSE, length=20, std=2.5)
        df = df.join(my_bbands)
        
        # Rename columns to match your existing structure
        if 'BBL_20_2.5' in df.columns:
            df['BB_Lower'] = df['BBL_20_2.5']
            df['BB_Middle'] = df['BBM_20_2.5']
            df['BB_Upper'] = df['BBU_20_2.5']
        
        # Calculate MACD if not using BB strategy
        if not use_bb_strategy:
            macd, signal_line, macd_hist = ic.calculate_macd(df)
            df['MACD'] = macd
            df['Signal_Line'] = signal_line
            df['MACD_Hist'] = macd_hist
        
        # Drop NaN values
        df.dropna(inplace=True)
        df.reset_index(drop=True, inplace=True)
        
        # Generate signals based on strategy
        if use_bb_strategy:
            report += "Using Bollinger Band + EMA Strategy...\n"
            df = self.add_ema_signal(df, backcandles=6)
            df = self.add_bb_strategy_signals(df, percent=0.00)
            signal_col = 'BB_Signal'
        else:
            report += "Using RSI + MACD + Bollinger Band Strategy...\n"
            df = self.signal_generator(df)
            signal_col = 'Signal'
        
        # Display summary statistics
        report += f"\n{'='*60}\n"
        report += "Analysis Summary\n"
        report += f"{'='*60}\n"
        report += f"Data Points: {len(df)}\n"
        report += f"Current RSI: {df['RSI'].iloc[-1]:.2f}\n"
        
        if not use_bb_strategy:
            report += f"Current MACD: {df['MACD'].iloc[-1]:.4f}\n"
        else:
            report += f"Current EMA Signal: {df['EMASignal'].iloc[-1]}\n"
        
        buy_signals = (df[signal_col] == 1).sum()
        sell_signals = (df[signal_col] == -1).sum()
        report += f"\nTotal Buy Signals: {buy_signals}\n"
        report += f"Total Sell Signals: {sell_signals}\n"
        report += f"{'='*60}\n\n"
        
        # Plot if requested
        if plot:
            self.plot_analysis(df, symbol, use_bb_strategy)
        
        return df, report
    
    def plot_analysis(self, df, symbol, use_bb_strategy=False):
        """
        Create visualization of price, Bollinger Bands, and signals
        
        Args:
            df (pd.DataFrame): DataFrame with analysis results
            symbol (str): Stock ticker symbol
            use_bb_strategy (bool): Whether BB strategy was used
        """
        signal_col = 'BB_Signal' if use_bb_strategy else 'Signal'
        
        fig, axes = plt.subplots(3 if not use_bb_strategy else 2, 1, 
                                 figsize=(14, 10), sharex=True)
        fig.suptitle(f'{symbol.upper()} - Technical Analysis', fontsize=16, fontweight='bold')
        
        ax1 = axes[0]
        ax2 = axes[1]
        if not use_bb_strategy:
            ax3 = axes[2]
        
        # Plot 1: Price and Bollinger Bands
        ax1.plot(df.index, df['CLOSE'], label='Close Price', color='black', linewidth=1.5)
        ax1.plot(df.index, df['BB_Upper'], label='Upper BB', color='red', linestyle='--', alpha=0.7)
        ax1.plot(df.index, df['BB_Middle'], label='Middle BB', color='blue', linestyle='--', alpha=0.7)
        ax1.plot(df.index, df['BB_Lower'], label='Lower BB', color='green', linestyle='--', alpha=0.7)
        ax1.fill_between(df.index, df['BB_Upper'], df['BB_Lower'], alpha=0.1, color='gray')
        
        if use_bb_strategy and 'EMA' in df.columns:
            ax1.plot(df.index, df['EMA'], label='EMA 200', color='orange', linestyle='-', alpha=0.7)
        
        # Mark buy/sell signals
        buy_signals = df[df[signal_col] == 1]
        sell_signals = df[df[signal_col] == -1]
        
        ax1.scatter(buy_signals.index, buy_signals['CLOSE'], 
                    marker='^', color='green', s=100, label='Buy Signal', zorder=5)
        ax1.scatter(sell_signals.index, sell_signals['CLOSE'], 
                    marker='v', color='red', s=100, label='Sell Signal', zorder=5)
        
        ax1.set_ylabel('Price ($)', fontweight='bold')
        ax1.legend(loc='best')
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: RSI
        ax2.plot(df.index, df['RSI'], label='RSI', color='purple', linewidth=1.5)
        ax2.axhline(y=70, color='r', linestyle='--', alpha=0.5, label='Overbought (70)')
        ax2.axhline(y=30, color='g', linestyle='--', alpha=0.5, label='Oversold (30)')
        ax2.axhline(y=50, color='b', linestyle='--', alpha=0.5, label='Neutral (50)')
        ax2.fill_between(df.index, 70, 100, alpha=0.1, color='red')
        ax2.fill_between(df.index, 0, 30, alpha=0.1, color='green')
        ax2.set_ylabel('RSI', fontweight='bold')
        ax2.set_ylim(0, 100)
        ax2.legend(loc='best')
        ax2.grid(True, alpha=0.3)
        
        # Plot 3: MACD (only for original strategy)
        if not use_bb_strategy:
            ax3.plot(df.index, df['MACD'], label='MACD', color='blue', linewidth=1.5)
            ax3.plot(df.index, df['Signal_Line'], label='Signal Line', color='red', linewidth=1.5)
            ax3.bar(df.index, df['MACD_Hist'], label='MACD Histogram', color='gray', alpha=0.3)
            ax3.axhline(y=0, color='black', linestyle='-', alpha=0.3)
            ax3.set_ylabel('MACD', fontweight='bold')
            ax3.set_xlabel('Date', fontweight='bold')
            ax3.legend(loc='best')
            ax3.grid(True, alpha=0.3)
        else:
            ax2.set_xlabel('Date', fontweight='bold')
        
        plt.tight_layout()
        plt.show()


# Example usage:

class StockSentimentAnalyzer:
    """
    Analyzes stock sentiment from news articles
    Supports multiple news sources and sentiment analysis methods
    """
    
    def __init__(self, stock_symbol, company_name=None):
        """
        Initialize sentiment analyzer
        
        Args:
            stock_symbol (str): Stock ticker symbol
            company_name (str): Full company name for better search results
        """
        self.stock_symbol = stock_symbol.upper()
        self.company_name = company_name if company_name else stock_symbol
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self.news_data = []
        
    def scrape_google_news(self, days_back=7, max_articles=50):
        """
        Scrape news from Google News
        
        Args:
            days_back (int): Number of days to look back
            max_articles (int): Maximum number of articles to scrape
        
        Returns:
            list: List of news articles
        """
        print(f"Scraping Google News for {self.stock_symbol}...")
        articles = []
        
        try:
            # Google News RSS feed
            search_query = f"{self.company_name} stock"
            url = f"https://news.google.com/rss/search?q={search_query}+when:{days_back}d&hl=en-IN&gl=IN&ceid=IN:en"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'xml')
            
            items = soup.find_all('item')[:max_articles]
            
            for item in items:
                try:
                    title = item.title.text if item.title else ""
                    description = item.description.text if item.description else ""
                    pub_date = item.pubDate.text if item.pubDate else ""
                    link = item.link.text if item.link else ""
                    
                    # Parse date
                    try:
                        date = datetime.strptime(pub_date, '%a, %d %b %Y %H:%M:%S %Z')
                    except:
                        date = datetime.now()
                    
                    articles.append({
                        'title': title,
                        'description': description,
                        'date': date,
                        'link': link,
                        'source': 'Google News'
                    })
                except Exception as e:
                    continue
            
            print(f"✓ Scraped {len(articles)} articles from Google News")
            
        except Exception as e:
            print(f"✗ Error scraping Google News: {e}")
        
        return articles
    
    def scrape_moneycontrol(self, max_articles=20):
        """
        Scrape news from MoneyControl
        
        Args:
            max_articles (int): Maximum number of articles
        
        Returns:
            list: List of news articles
        """
        print(f"Scraping MoneyControl for {self.stock_symbol}...")
        articles = []
        
        try:
            url = f"https://www.moneycontrol.com/news/tags/{self.stock_symbol.lower()}.html"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            news_items = soup.find_all('li', class_='clearfix')[:max_articles]
            
            for item in news_items:
                try:
                    title_tag = item.find('h2')
                    title = title_tag.text.strip() if title_tag else ""
                    
                    link_tag = item.find('a')
                    link = link_tag['href'] if link_tag and 'href' in link_tag.attrs else ""
                    
                    desc_tag = item.find('p')
                    description = desc_tag.text.strip() if desc_tag else ""
                    
                    date_tag = item.find('span')
                    date_text = date_tag.text.strip() if date_tag else ""
                    
                    # Parse date
                    try:
                        date = datetime.strptime(date_text, '%B %d, %Y')
                    except:
                        date = datetime.now()
                    
                    if title:
                        articles.append({
                            'title': title,
                            'description': description,
                            'date': date,
                            'link': link,
                            'source': 'MoneyControl'
                        })
                except Exception as e:
                    continue
            
            print(f"✓ Scraped {len(articles)} articles from MoneyControl")
            
        except Exception as e:
            print(f"✗ Error scraping MoneyControl: {e}")
        
        return articles
    
    def scrape_finviz_news(self, max_articles=30):
        """
        Scrape news from Finviz (works best for US stocks)
        
        Args:
            max_articles (int): Maximum number of articles
        
        Returns:
            list: List of news articles
        """
        print(f"Scraping Finviz for {self.stock_symbol}...")
        articles = []
        
        try:
            url = f"https://finviz.com/quote.ashx?t={self.stock_symbol}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            news_table = soup.find('table', {'id': 'news-table'})
            
            if news_table:
                rows = news_table.find_all('tr')[:max_articles]
                
                current_date = datetime.now()
                
                for row in rows:
                    try:
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            # Date and time
                            date_cell = cells[0].text.strip()
                            if date_cell:
                                date_parts = date_cell.split()
                                if len(date_parts) == 2:
                                    current_date = datetime.strptime(date_parts[0], '%b-%d-%y')
                            
                            # Title and link
                            link_tag = cells[1].find('a')
                            if link_tag:
                                title = link_tag.text.strip()
                                link = link_tag['href']
                                
                                articles.append({
                                    'title': title,
                                    'description': '',
                                    'date': current_date,
                                    'link': link,
                                    'source': 'Finviz'
                                })
                    except Exception as e:
                        continue
            
            print(f"✓ Scraped {len(articles)} articles from Finviz")
            
        except Exception as e:
            print(f"✗ Error scraping Finviz: {e}")
        
        return articles
    
    def analyze_sentiment_vader(self, text):
        """
        Analyze sentiment using VADER (Valence Aware Dictionary and sEntiment Reasoner)
        Better for social media and news
        
        Args:
            text (str): Text to analyze
        
        Returns:
            dict: Sentiment scores
        """
        scores = self.vader_analyzer.polarity_scores(text)
        
        # Classify sentiment
        if scores['compound'] >= 0.05:
            sentiment = 'Positive'
        elif scores['compound'] <= -0.05:
            sentiment = 'Negative'
        else:
            sentiment = 'Neutral'
        
        return {
            'compound': scores['compound'],
            'positive': scores['pos'],
            'negative': scores['neg'],
            'neutral': scores['neu'],
            'sentiment': sentiment
        }
    
    def analyze_sentiment_textblob(self, text):
        """
        Analyze sentiment using TextBlob
        
        Args:
            text (str): Text to analyze
        
        Returns:
            dict: Sentiment scores
        """
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        # Classify sentiment
        if polarity > 0.1:
            sentiment = 'Positive'
        elif polarity < -0.1:
            sentiment = 'Negative'
        else:
            sentiment = 'Neutral'
        
        return {
            'polarity': polarity,
            'subjectivity': subjectivity,
            'sentiment': sentiment
        }
    
    def analyze_all_news(self, days_back=7, sources=['google', 'finviz']):
        """
        Scrape and analyze news from multiple sources
        
        Args:
            days_back (int): Days to look back
            sources (list): List of sources to scrape
        
        Returns:
            pd.DataFrame: DataFrame with news and sentiment analysis
        """
        print(f"\n{'='*60}")
        print(f"Sentiment Analysis for {self.stock_symbol}")
        print(f"{'='*60}\n")
        
        all_articles = []
        
        # Scrape from different sources
        if 'google' in sources:
            all_articles.extend(self.scrape_google_news(days_back=days_back))
            time.sleep(1)  # Respectful delay
        
        if 'moneycontrol' in sources:
            all_articles.extend(self.scrape_moneycontrol())
            time.sleep(1)
        
        if 'finviz' in sources:
            all_articles.extend(self.scrape_finviz_news())
            time.sleep(1)
        
        if not all_articles:
            print("⚠ No articles found!")
            return pd.DataFrame()
        
        # Analyze sentiment for each article
        print(f"\nAnalyzing sentiment for {len(all_articles)} articles...")
        
        for article in all_articles:
            # Combine title and description for analysis
            text = f"{article['title']} {article['description']}"
            
            # VADER sentiment
            vader_sentiment = self.analyze_sentiment_vader(text)
            article['vader_compound'] = vader_sentiment['compound']
            article['vader_sentiment'] = vader_sentiment['sentiment']
            
            # TextBlob sentiment
            textblob_sentiment = self.analyze_sentiment_textblob(text)
            article['textblob_polarity'] = textblob_sentiment['polarity']
            article['textblob_sentiment'] = textblob_sentiment['sentiment']
        
        # Create DataFrame
        df = pd.DataFrame(all_articles)
        df = df.sort_values('date', ascending=False).reset_index(drop=True)
        
        self.news_data = df
        
        return df
    
    def get_sentiment_summary(self):
        """
        Get overall sentiment summary
        
        Returns:
            dict: Summary statistics
        """
        if self.news_data is None or len(self.news_data) == 0:
            return None
        
        df = self.news_data
        
        # Calculate statistics
        avg_vader = df['vader_compound'].mean()
        avg_textblob = df['textblob_polarity'].mean()
        
        # Count sentiment types
        vader_counts = df['vader_sentiment'].value_counts()
        textblob_counts = df['textblob_sentiment'].value_counts()
        
        # Overall sentiment
        if avg_vader >= 0.05:
            overall_sentiment = "POSITIVE 📈"
        elif avg_vader <= -0.05:
            overall_sentiment = "NEGATIVE 📉"
        else:
            overall_sentiment = "NEUTRAL ➡️"
        
        summary = {
            'total_articles': len(df),
            'avg_vader_score': avg_vader,
            'avg_textblob_score': avg_textblob,
            'overall_sentiment': overall_sentiment,
            'vader_positive': vader_counts.get('Positive', 0),
            'vader_negative': vader_counts.get('Negative', 0),
            'vader_neutral': vader_counts.get('Neutral', 0),
            'textblob_positive': textblob_counts.get('Positive', 0),
            'textblob_negative': textblob_counts.get('Negative', 0),
            'textblob_neutral': textblob_counts.get('Neutral', 0),
            'date_range': f"{df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}"
        }
        
        return summary
    
    def print_summary(self):
        """
        Print formatted sentiment summary
        """
        summary = self.get_sentiment_summary()
        
        if not summary:
            print("No data available for summary")
            return
        
        print(f"\n{'='*60}")
        print("SENTIMENT ANALYSIS SUMMARY")
        print(f"{'='*60}")
        print(f"Stock: {self.stock_symbol}")
        print(f"Total Articles Analyzed: {summary['total_articles']}")
        print(f"Date Range: {summary['date_range']}")
        print(f"\nOverall Sentiment: {summary['overall_sentiment']}")
        print(f"\nVADER Sentiment Distribution:")
        print(f"  Positive: {summary['vader_positive']} ({summary['vader_positive']/summary['total_articles']*100:.1f}%)")
        print(f"  Negative: {summary['vader_negative']} ({summary['vader_negative']/summary['total_articles']*100:.1f}%)")
        print(f"  Neutral:  {summary['vader_neutral']} ({summary['vader_neutral']/summary['total_articles']*100:.1f}%)")
        print(f"\nAverage Sentiment Scores:")
        print(f"  VADER Compound: {summary['avg_vader_score']:.3f} (Range: -1 to 1)")
        print(f"  TextBlob Polarity: {summary['avg_textblob_score']:.3f} (Range: -1 to 1)")
        print(f"{'='*60}\n")
    
    def get_recent_headlines(self, n=10):
        """
        Get most recent headlines with sentiment
        
        Args:
            n (int): Number of headlines to return
        
        Returns:
            pd.DataFrame: Recent headlines
        """
        if self.news_data is None or len(self.news_data) == 0:
            return pd.DataFrame()
        
        df = self.news_data.head(n)[['date', 'title', 'vader_sentiment', 'vader_compound', 'source']]
        return df
    
    def export_to_csv(self, filename=None):
        """
        Export news data to CSV
        
        Args:
            filename (str): Output filename
        """
        if self.news_data is None or len(self.news_data) == 0:
            print("No data to export")
            return
        
        if filename is None:
            filename = f"{self.stock_symbol}_sentiment_{datetime.now().strftime('%Y%m%d')}.csv"
        
        self.news_data.to_csv(filename, index=False)
        print(f"✓ Data exported to {filename}")



# if __name__ == "__main__":
#     da = TechnicalAnalyser()

#     print("="*60)
#     df = da.analyze_stock("REL", plot=True, use_bb_strategy=True)
#     print(df.head(10))