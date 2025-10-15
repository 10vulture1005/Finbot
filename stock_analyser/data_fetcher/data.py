from jugaad_data.nse import stock_df
from datetime import date
class DataFetcher:
    

    def __init__(self,symbol,from_date=date(2015,1,1),to_date=date.today(),series="EQ"):
        self.symbol = symbol
        self.from_date = from_date
        self.to_date = to_date
        self.series = series
    def get_data(self):
        df = stock_df(
            symbol=self.symbol,
            from_date=self.from_date,
            to_date=self.to_date,
            series=self.series,
        )
        try:
            df.to_csv(f"data_csv/{self.symbol}.csv", index=False)
        except Exception as e:
            pass
        return df
