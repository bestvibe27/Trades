"""Data providers and connectors module."""

from backend.data.data_provider import DataProvider, MockDataProvider
from backend.data.historical_data import compute_sma_series
from backend.data.market_feed import MarketFeed, PollingFeed
from backend.data.mt5_connector import MT5Connector

__all__ = [
    "DataProvider",
    "MockDataProvider",
    "compute_sma_series",
    "MarketFeed",
    "PollingFeed", 
    "MT5Connector"
]



