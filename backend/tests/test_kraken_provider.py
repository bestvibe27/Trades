from backend.data.kraken_provider import KrakenDataProvider


def test_kraken_symbol_resolution():
    provider = KrakenDataProvider()
    assert provider._resolve_pair("BTCUSD") == "XXBTZUSD"
    assert provider._resolve_pair("ETHUSD") == "XETHZUSD"
    assert provider._resolve_pair("EURUSD") == "EURUSD"
    assert provider._resolve_pair("XAUUSD") == "XAUUSD"


def test_kraken_historical_candles_structure():
    provider = KrakenDataProvider()
    # Fetch real live candles from Kraken REST
    series = provider.get_historical_candles("BTCUSD", "1m", limit=5)
    assert series.symbol == "BTCUSD"
    assert series.timeframe == "1m"
    assert len(series.candles) > 0
    
    first = series.candles[0]
    assert first.open > 0
    assert first.high >= first.low
    assert first.close > 0
