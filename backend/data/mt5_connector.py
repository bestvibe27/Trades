"""MetaTrader 5 connector implementation.

This module provides a comprehensive interface for connecting to MetaTrader 5
and Exness MT5 APIs. It includes both real MT5 integration and mock implementations
for development and testing.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MetaTrader5 is optional at runtime; use mock when not installed or disabled
try:  # pragma: no cover
    import MetaTrader5 as mt5  # type: ignore
    _MT5_AVAILABLE = True
except Exception:  # pragma: no cover
    mt5 = None  # type: ignore
    _MT5_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class MT5AccountInfo:
    """MT5 account information."""
    login: int
    server: str
    name: str
    currency: str
    leverage: int
    limit_orders: int
    margin_so_mode: int
    trade_allowed: bool
    trade_expert: bool
    margin_mode: int
    currency_digits: int
    fifo_close: bool


@dataclass
class MT5SymbolInfo:
    """MT5 symbol information."""
    symbol: str
    name: str
    currency_base: str
    currency_profit: str
    currency_margin: str
    contract_size: float
    digits: int
    point: float
    spread: int
    trade_mode: int
    trade_stops_level: int
    trade_freeze_level: int
    trade_exemode: int
    swap_mode: int
    swap_long: float
    swap_short: float
    starting: datetime
    expiration: datetime
    trade_tick_value: float
    trade_tick_size: float
    trade_contract_size: float
    trade_calc_mode: int
    trade_mode_time: int
    trade_flags: int
    margin_initial: float
    margin_maintenance: float
    session_deals: int
    session_buy_orders: int
    session_sell_orders: int
    volume_min: float
    volume_max: float
    volume_step: float
    volume_limit: float
    margin_hedged: float
    price_limit_min: float
    price_limit_max: float


@dataclass
class MT5Order:
    """MT5 order information."""
    ticket: int
    time_setup: datetime
    time_expiration: datetime
    type: int
    type_filling: int
    type_time: int
    state: int
    reason: int
    volume: float
    price_open: float
    sl: float
    tp: float
    price_current: float
    price_stoplimit: float
    symbol: str
    comment: str
    external_id: str


@dataclass
class MT5Position:
    """MT5 position information."""
    ticket: int
    time: datetime
    time_msc: int
    time_update: datetime
    time_update_msc: int
    type: int
    magic: int
    identifier: int
    reason: int
    volume: float
    price_open: float
    sl: float
    tp: float
    price_current: float
    swap: float
    profit: float
    symbol: str
    comment: str
    external_id: str


class MT5Connector:
    """MetaTrader 5 connector with real and mock implementations."""
    
    def __init__(
        self,
        server: str | None = None,
        login: str | None = None,
        password: str | None = None,
        timeout: int = 10000,
        portable: bool = False,
        path: str | None = None,
        use_mock: bool = False,
    ) -> None:
        """Initialize MT5 connector.
        
        Args:
            server: MT5 server name
            login: Account login
            password: Account password
            timeout: Connection timeout in milliseconds
            portable: Use portable mode
            path: Path to MT5 terminal
            use_mock: Use mock implementation for testing
        """
        # Prefer env vars if args are not provided
        self.server = server or os.getenv("MT5_SERVER")
        self.login = login or os.getenv("MT5_LOGIN")
        self.password = password or os.getenv("MT5_PASSWORD")
        self.timeout = timeout
        self.portable = portable
        self.path = path
        # Allow forcing mock via flag or when MetaTrader5 is not available
        self.use_mock = use_mock or (not _MT5_AVAILABLE)
        self.connected = False
        self.account_info: Optional[MT5AccountInfo] = None
        self._real_initialized = False
        
        # Mock data for development - all supported instruments
        self._mock_symbols = [
            # Forex pairs
            "EURUSDm", "GBPUSDm", "USDJPYm", "USDCHFm", "USDCADm", "AUDUSDm", "NZDUSDm",
            "EURGBPm", "EURJPYm", "EURCHFm", "GBPJPYm", "GBPCHFm", "AUDJPYm", "CADJPYm",
            "CHFJPYm", "NZDJPYm", "EURNZDm", "EURCADm", "GBPCADm", "AUDNZDm",
            # Commodities
            "XAUUSDm", "XAGUSDm", "XBRUSDm", "XTIUSDm", "XNGUSDm", "XPDUSDm", "XPTUSDm",
            # Indices
            "US30m", "US500m", "USTECm", "GER40m", "UK100m", "FRA40m", "JPN225m", "HK50m", "AUS200m",
            # Crypto
            "BTCUSDm", "ETHUSDm", "LTCUSDm", "XRPUSDm", "BCHUSDm", "ADAUSDm", "DOGEUSDm", "SOLUSDm",
            # Stocks
            "AAPLm", "TSLAm", "MSFTm", "AMZNm", "METAm", "GOOGLm", "NVDAm", "NFLXm", "JPMm", "BRK.Bm"
        ]
        self._mock_prices: Dict[str, float] = {
            # Forex pairs
            "EURUSDm": 1.0950, "GBPUSDm": 1.2750, "USDJPYm": 149.50,
            "USDCHFm": 0.8750, "USDCADm": 1.3650, "AUDUSDm": 0.6550, "NZDUSDm": 0.6050,
            "EURGBPm": 0.8600, "EURJPYm": 163.75, "EURCHFm": 0.9600, "GBPJPYm": 190.25,
            "GBPCHFm": 1.1000, "AUDJPYm": 98.50, "CADJPYm": 109.75, "CHFJPYm": 170.25,
            "NZDJPYm": 90.50, "EURNZDm": 1.8100, "EURCADm": 1.4950, "GBPCADm": 1.7400, "AUDNZDm": 1.0800,
            # Commodities
            "XAUUSDm": 2025.50, "XAGUSDm": 24.25, "XBRUSDm": 80.25, "XTIUSDm": 75.50,
            "XNGUSDm": 2.85, "XPDUSDm": 1050.00, "XPTUSDm": 950.00,
            # Indices
            "US30m": 37500.0, "US500m": 4750.0, "USTECm": 16500.0, "GER40m": 18500.0,
            "UK100m": 7500.0, "FRA40m": 7200.0, "JPN225m": 38500.0, "HK50m": 18500.0, "AUS200m": 7200.0,
            # Crypto
            "BTCUSDm": 43500.00, "ETHUSDm": 2650.00, "LTCUSDm": 72.50, "XRPUSDm": 0.6250,
            "BCHUSDm": 245.00, "ADAUSDm": 0.4850, "DOGEUSDm": 0.0850, "SOLUSDm": 98.50,
            # Stocks
            "AAPLm": 195.50, "TSLAm": 245.00, "MSFTm": 375.00, "AMZNm": 155.00,
            "METAm": 325.00, "GOOGLm": 145.00, "NVDAm": 485.00, "NFLXm": 485.00,
            "JPMm": 165.00, "BRK.Bm": 365.00
        }
        self._mock_orders: List[MT5Order] = []
        self._mock_positions: List[MT5Position] = []

    def connect(self) -> bool:
        """Connect to MT5 terminal."""
        try:
            if self.use_mock:
                logger.info("Using mock MT5 connection")
                self.connected = True
                self._setup_mock_account()
                return True

            # Real MT5 connection path
            if not _MT5_AVAILABLE:
                logger.warning("MetaTrader5 module not available, falling back to mock")
                self.use_mock = True
                self.connected = True
                self._setup_mock_account()
                return True

            if not self.server or not self.login or not self.password:
                missing_vars = []
                if not self.server:
                    missing_vars.append("MT5_SERVER")
                if not self.login:
                    missing_vars.append("MT5_LOGIN")
                if not self.password:
                    missing_vars.append("MT5_PASSWORD")
                
                logger.error(f"❌ MT5 credentials are missing: {', '.join(missing_vars)}")
                logger.error("💡 Please set the following environment variables:")
                logger.error("   - MT5_SERVER=YourBrokerServer")
                logger.error("   - MT5_LOGIN=YourAccountNumber")
                logger.error("   - MT5_PASSWORD=YourPassword")
                logger.error("   Or create a .env file with these variables")
                logger.error("🔄 Falling back to mock mode for development")
                
                self.use_mock = True
                self.connected = True
                self._setup_mock_account()
                return True

            logger.info(f"Connecting to MT5 server: {self.server}")
            if not mt5.initialize():  # type: ignore
                code, msg = mt5.last_error()  # type: ignore
                raise RuntimeError(f"MT5 initialize failed: {code} {msg}")

            if not mt5.login(int(self.login), password=str(self.password), server=str(self.server)):  # type: ignore
                code, msg = mt5.last_error()  # type: ignore
                raise RuntimeError(f"MT5 login failed: {code} {msg}")

            self.connected = True
            self._real_initialized = True
            
            # Get real account info
            account_info = mt5.account_info()  # type: ignore
            if account_info:
                self.account_info = MT5AccountInfo(
                    login=int(self.login),
                    server=str(self.server),
                    name=getattr(account_info, 'name', 'MT5 Account'),
                    currency=getattr(account_info, 'currency', 'USD'),
                    leverage=getattr(account_info, 'leverage', 100),
                    limit_orders=getattr(account_info, 'limit_orders', 100),
                    margin_so_mode=getattr(account_info, 'margin_so_mode', 0),
                    trade_allowed=getattr(account_info, 'trade_allowed', True),
                    trade_expert=getattr(account_info, 'trade_expert', True),
                    margin_mode=getattr(account_info, 'margin_mode', 0),
                    currency_digits=getattr(account_info, 'currency_digits', 2),
                    fifo_close=getattr(account_info, 'fifo_close', False),
                )
                logger.info(f"✅ Connected to MT5 account: {self.account_info.name} (Login: {self.account_info.login})")
                logger.info(f"💰 Balance: {getattr(account_info, 'balance', 0):.2f} {self.account_info.currency}")
                logger.info(f"📊 Equity: {getattr(account_info, 'equity', 0):.2f} {self.account_info.currency}")
            else:
                # Fallback if account_info fails
                self.account_info = MT5AccountInfo(
                    login=int(self.login),
                    server=str(self.server),
                    name="MT5 Account",
                    currency="USD",
                    leverage=100,
                    limit_orders=100,
                    margin_so_mode=0,
                    trade_allowed=True,
                    trade_expert=True,
                    margin_mode=0,
                    currency_digits=2,
                    fifo_close=False,
                )
                logger.info(f"✅ Connected to MT5 server: {self.server} (Login: {self.login})")
            
            return True

        except Exception as e:
            logger.error(f"Failed to connect to MT5: {e}")
            self.connected = False
            return False

    def disconnect(self) -> None:
        """Disconnect from MT5 terminal."""
        if self.connected:
            logger.info("Disconnecting from MT5")
            self.connected = False
            self.account_info = None

    def _setup_mock_account(self) -> None:
        """Setup mock account information."""
        self.account_info = MT5AccountInfo(
            login=int(self.login) if self.login else 123456,
            server=self.server or "Demo-Server",
            name="Demo Account",
            currency="USD",
            leverage=100,
            limit_orders=100,
            margin_so_mode=0,
            trade_allowed=True,
            trade_expert=True,
            margin_mode=0,
            currency_digits=2,
            fifo_close=False
        )

    def get_account_info(self) -> Optional[MT5AccountInfo]:
        """Get account information."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return None
        
        if self.use_mock:
            return self.account_info
        
        return self.account_info

    def get_symbols(self) -> List[str]:
        """Get list of available symbols."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return []
        
        if self.use_mock:
            return self._mock_symbols.copy()
        
        # Real implementation: fetch all available symbols
        try:
            if not self._real_initialized:
                self.connect()
            syms = mt5.symbols_get()  # type: ignore
            if syms is None:
                return []
            names = [getattr(s, 'name', None) for s in syms]
            return [n for n in names if isinstance(n, str)]
        except Exception:
            return []

    def get_symbol_info(self, symbol: str) -> Optional[MT5SymbolInfo]:
        """Get symbol information."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return None
        
        if self.use_mock:
            return self._get_mock_symbol_info(symbol)
        
        # Minimal real symbol info (fallback to mock for structure)
        return self._get_mock_symbol_info(symbol)

    def _get_mock_symbol_info(self, symbol: str) -> Optional[MT5SymbolInfo]:
        """Get mock symbol information."""
        if symbol not in self._mock_symbols:
            return None
        
        # Mock symbol info based on symbol type
        if symbol in ["EURUSDm", "GBPUSDm", "USDJPYm", "USDCHFm", "AUDUSDm", "USDCADm", "NZDUSDm",
                     "EURGBPm", "EURJPYm", "EURCHFm", "GBPJPYm", "GBPCHFm", "AUDJPYm", "CADJPYm",
                     "CHFJPYm", "NZDJPYm", "EURNZDm", "EURCADm", "GBPCADm", "AUDNZDm"]:
            # Forex pairs
            base_currency = symbol[:3]
            quote_currency = symbol[3:6]  # Remove 'm' suffix
            digits = 5 if quote_currency != "JPY" else 3
            point = 0.00001 if quote_currency != "JPY" else 0.001
            tick_size = 0.00001 if quote_currency != "JPY" else 0.001
            return MT5SymbolInfo(
                symbol=symbol,
                name=f"{base_currency}/{quote_currency}",
                currency_base=base_currency,
                currency_profit=quote_currency,
                currency_margin=quote_currency,
                contract_size=100000.0,
                digits=digits,
                point=point,
                spread=20,
                trade_mode=4,  # SYMBOL_TRADE_MODE_FULL
                trade_stops_level=0,
                trade_freeze_level=0,
                trade_exemode=1,  # SYMBOL_EXECUTION_MARKET
                swap_mode=0,  # SYMBOL_SWAP_MODE_DISABLED
                swap_long=0.0,
                swap_short=0.0,
                starting=datetime(1970, 1, 1, tzinfo=timezone.utc),
                expiration=datetime(2030, 12, 31, tzinfo=timezone.utc),
                trade_tick_value=1.0,
                trade_tick_size=tick_size,
                trade_contract_size=100000.0,
                trade_calc_mode=0,  # SYMBOL_CALC_MODE_FOREX
                trade_mode_time=0,
                trade_flags=0,
                margin_initial=0.0,
                margin_maintenance=0.0,
                session_deals=0,
                session_buy_orders=0,
                session_sell_orders=0,
                volume_min=0.01,
                volume_max=100.0,
                volume_step=0.01,
                volume_limit=0,
                margin_hedged=0.0,
                price_limit_min=0.0,
                price_limit_max=0.0
            )
        elif symbol in ["XAUUSDm", "XAGUSDm", "XBRUSDm", "XTIUSDm", "XNGUSDm", "XPDUSDm", "XPTUSDm"]:
            # Commodities
            digits = 2 if symbol in ["XAUUSDm", "XBRUSDm", "XTIUSDm", "XPDUSDm", "XPTUSDm"] else 3
            point = 0.01 if symbol in ["XAUUSDm", "XBRUSDm", "XTIUSDm", "XPDUSDm", "XPTUSDm"] else 0.001
            tick_size = 0.01 if symbol in ["XAUUSDm", "XBRUSDm", "XTIUSDm", "XPDUSDm", "XPTUSDm"] else 0.001
            return MT5SymbolInfo(
                symbol=symbol,
                name=symbol,
                currency_base="USD",
                currency_profit="USD",
                currency_margin="USD",
                contract_size=100.0,
                digits=digits,
                point=point,
                spread=30,
                trade_mode=4,
                trade_stops_level=0,
                trade_freeze_level=0,
                trade_exemode=1,
                swap_mode=0,
                swap_long=0.0,
                swap_short=0.0,
                starting=datetime(1970, 1, 1, tzinfo=timezone.utc),
                expiration=datetime(2030, 12, 31, tzinfo=timezone.utc),
                trade_tick_value=1.0,
                trade_tick_size=tick_size,
                trade_contract_size=100.0,
                trade_calc_mode=1,  # SYMBOL_CALC_MODE_CFD
                trade_mode_time=0,
                trade_flags=0,
                margin_initial=0.0,
                margin_maintenance=0.0,
                session_deals=0,
                session_buy_orders=0,
                session_sell_orders=0,
                volume_min=0.01,
                volume_max=100.0,
                volume_step=0.01,
                volume_limit=0,
                margin_hedged=0.0,
                price_limit_min=0.0,
                price_limit_max=0.0
            )
        elif symbol in ["US30m", "US500m", "USTECm", "GER40m", "UK100m", "FRA40m", "JPN225m", "HK50m", "AUS200m"]:
            # Indices
            digits = 1 if symbol in ["JPN225m", "HK50m"] else 1
            point = 1.0 if symbol in ["JPN225m", "HK50m"] else 0.1
            tick_size = 1.0 if symbol in ["JPN225m", "HK50m"] else 0.1
            return MT5SymbolInfo(
                symbol=symbol,
                name=symbol,
                currency_base="USD" if symbol.startswith("US") else ("EUR" if symbol.startswith("GER") or symbol.startswith("FRA") else ("GBP" if symbol.startswith("UK") else ("JPY" if symbol.startswith("JPN") else ("HKD" if symbol.startswith("HK") else "AUD")))),
                currency_profit="USD" if symbol.startswith("US") else ("EUR" if symbol.startswith("GER") or symbol.startswith("FRA") else ("GBP" if symbol.startswith("UK") else ("JPY" if symbol.startswith("JPN") else ("HKD" if symbol.startswith("HK") else "AUD")))),
                currency_margin="USD" if symbol.startswith("US") else ("EUR" if symbol.startswith("GER") or symbol.startswith("FRA") else ("GBP" if symbol.startswith("UK") else ("JPY" if symbol.startswith("JPN") else ("HKD" if symbol.startswith("HK") else "AUD")))),
                contract_size=1.0,
                digits=digits,
                point=point,
                spread=50,
                trade_mode=4,
                trade_stops_level=0,
                trade_freeze_level=0,
                trade_exemode=1,
                swap_mode=0,
                swap_long=0.0,
                swap_short=0.0,
                starting=datetime(1970, 1, 1, tzinfo=timezone.utc),
                expiration=datetime(2030, 12, 31, tzinfo=timezone.utc),
                trade_tick_value=1.0,
                trade_tick_size=tick_size,
                trade_contract_size=1.0,
                trade_calc_mode=1,  # SYMBOL_CALC_MODE_CFD
                trade_mode_time=0,
                trade_flags=0,
                margin_initial=0.0,
                margin_maintenance=0.0,
                session_deals=0,
                session_buy_orders=0,
                session_sell_orders=0,
                volume_min=0.01,
                volume_max=100.0,
                volume_step=0.01,
                volume_limit=0,
                margin_hedged=0.0,
                price_limit_min=0.0,
                price_limit_max=0.0
            )
        elif symbol in ["BTCUSDm", "ETHUSDm", "LTCUSDm", "XRPUSDm", "BCHUSDm", "ADAUSDm", "DOGEUSDm", "SOLUSDm"]:
            # Crypto
            digits = 2 if symbol in ["BTCUSDm", "ETHUSDm", "LTCUSDm", "BCHUSDm", "SOLUSDm"] else 4
            point = 0.01 if symbol in ["BTCUSDm", "ETHUSDm", "LTCUSDm", "BCHUSDm", "SOLUSDm"] else 0.0001
            tick_size = 0.01 if symbol in ["BTCUSDm", "ETHUSDm", "LTCUSDm", "BCHUSDm", "SOLUSDm"] else 0.0001
            return MT5SymbolInfo(
                symbol=symbol,
                name=symbol,
                currency_base="USD",
                currency_profit="USD",
                currency_margin="USD",
                contract_size=1.0,
                digits=digits,
                point=point,
                spread=100,
                trade_mode=4,
                trade_stops_level=0,
                trade_freeze_level=0,
                trade_exemode=1,
                swap_mode=0,
                swap_long=0.0,
                swap_short=0.0,
                starting=datetime(1970, 1, 1, tzinfo=timezone.utc),
                expiration=datetime(2030, 12, 31, tzinfo=timezone.utc),
                trade_tick_value=1.0,
                trade_tick_size=tick_size,
                trade_contract_size=1.0,
                trade_calc_mode=1,  # SYMBOL_CALC_MODE_CFD
                trade_mode_time=0,
                trade_flags=0,
                margin_initial=0.0,
                margin_maintenance=0.0,
                session_deals=0,
                session_buy_orders=0,
                session_sell_orders=0,
                volume_min=0.01,
                volume_max=100.0,
                volume_step=0.01,
                volume_limit=0,
                margin_hedged=0.0,
                price_limit_min=0.0,
                price_limit_max=0.0
            )
        elif symbol in ["AAPLm", "TSLAm", "MSFTm", "AMZNm", "METAm", "GOOGLm", "NVDAm", "NFLXm", "JPMm", "BRK.Bm"]:
            # Stocks
            return MT5SymbolInfo(
                symbol=symbol,
                name=symbol,
                currency_base="USD",
                currency_profit="USD",
                currency_margin="USD",
                contract_size=1.0,
                digits=2,
                point=0.01,
                spread=10,
                trade_mode=4,
                trade_stops_level=0,
                trade_freeze_level=0,
                trade_exemode=1,
                swap_mode=0,
                swap_long=0.0,
                swap_short=0.0,
                starting=datetime(1970, 1, 1, tzinfo=timezone.utc),
                expiration=datetime(2030, 12, 31, tzinfo=timezone.utc),
                trade_tick_value=1.0,
                trade_tick_size=0.01,
                trade_contract_size=1.0,
                trade_calc_mode=1,  # SYMBOL_CALC_MODE_CFD
                trade_mode_time=0,
                trade_flags=0,
                margin_initial=0.0,
                margin_maintenance=0.0,
                session_deals=0,
                session_buy_orders=0,
                session_sell_orders=0,
                volume_min=0.01,
                volume_max=100.0,
                volume_step=0.01,
                volume_limit=0,
                margin_hedged=0.0,
                price_limit_min=0.0,
                price_limit_max=0.0
            )
        else:
            # Default for other symbols
            return MT5SymbolInfo(
                symbol=symbol,
                name=symbol,
                currency_base="USD",
                currency_profit="USD",
                currency_margin="USD",
                contract_size=1.0,
                digits=2,
                point=0.01,
                spread=10,
                trade_mode=4,
                trade_stops_level=0,
                trade_freeze_level=0,
                trade_exemode=1,
                swap_mode=0,
                swap_long=0.0,
                swap_short=0.0,
                starting=datetime(1970, 1, 1, tzinfo=timezone.utc),
                expiration=datetime(2030, 12, 31, tzinfo=timezone.utc),
                trade_tick_value=1.0,
                trade_tick_size=0.01,
                trade_contract_size=1.0,
                trade_calc_mode=1,
                trade_mode_time=0,
                trade_flags=0,
                margin_initial=0.0,
                margin_maintenance=0.0,
                session_deals=0,
                session_buy_orders=0,
                session_sell_orders=0,
                volume_min=0.01,
                volume_max=100.0,
                volume_step=0.01,
                volume_limit=0,
                margin_hedged=0.0,
                price_limit_min=0.0,
                price_limit_max=0.0
            )

    def get_last_price(self, symbol: str) -> float:
        """Get last price for symbol."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return 0.0
        
        if self.use_mock:
            # Simulate price movement
            base_price = self._mock_prices.get(symbol, 100.0)
            # Add small random movement
            import random
            movement = (random.random() - 0.5) * 0.001 * base_price
            new_price = base_price + movement
            self._mock_prices[symbol] = new_price
            return new_price
        
        # Real: use symbol_info_tick
        try:
            if not self._real_initialized:
                self.connect()
            # Ensure symbol is selected
            mt5.symbol_select(symbol, True)  # type: ignore
            tick = mt5.symbol_info_tick(symbol)  # type: ignore
            if tick is None:
                code, msg = mt5.last_error()  # type: ignore
                logger.error(f"symbol_info_tick failed: {code} {msg}")
                return 0.0
            # Prefer last; if not available, mid of bid/ask
            last = getattr(tick, "last", 0.0) or ((getattr(tick, "bid", 0.0) + getattr(tick, "ask", 0.0)) / 2.0)
            return float(last or 0.0)
        except Exception as e:
            logger.error(f"get_last_price error: {e}")
            return 0.0

    def get_bid_ask(self, symbol: str) -> Tuple[float, float]:
        """Get bid and ask prices."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return 0.0, 0.0
        
        price = self.get_last_price(symbol)
        symbol_info = self.get_symbol_info(symbol)
        
        if symbol_info:
            spread = symbol_info.spread * symbol_info.point
            bid = price - spread / 2
            ask = price + spread / 2
            return bid, ask
        
        return price, price

    def place_order(
        self, 
        symbol: str, 
        side: str, 
        quantity: float, 
        price: float,
        sl: float = 0.0,
        tp: float = 0.0,
        comment: str = "",
        order_type: str = "market"
    ) -> Dict[str, Any]:
        """Place an order."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return {"error": "Not connected to MT5"}
        
        if self.use_mock:
            return self._place_mock_order(symbol, side, quantity, price, sl, tp, comment, order_type)
        
        # Real order placement via MetaTrader5
        try:
            if not self._real_initialized:
                self.connect()

            # Ensure symbol selected
            mt5.symbol_select(symbol, True)  # type: ignore

            # Validate symbol tradability
            sinfo = mt5.symbol_info(symbol)  # type: ignore
            if sinfo is None:
                return {"error": f"Symbol not found: {symbol}"}
            if getattr(sinfo, 'trade_allowed', True) is False:
                return {"error": f"Trade disabled for symbol {symbol}"}
            trade_mode = getattr(mt5, 'SYMBOL_TRADE_MODE_FULL', 0)  # type: ignore
            if hasattr(sinfo, 'trade_mode') and getattr(sinfo, 'trade_mode') not in (
                getattr(mt5, 'SYMBOL_TRADE_MODE_FULL', 0),
                getattr(mt5, 'SYMBOL_TRADE_MODE_LONGONLY', 1),
                getattr(mt5, 'SYMBOL_TRADE_MODE_SHORTONLY', 2),
            ):
                return {"error": f"Symbol {symbol} is not in a tradable mode"}

            # Enforce volume rules
            vol_min = float(getattr(sinfo, 'volume_min', 0.01) or 0.01)
            vol_step = float(getattr(sinfo, 'volume_step', 0.01) or 0.01)
            vol_max = float(getattr(sinfo, 'volume_max', 100.0) or 100.0)
            # round to nearest step, clamp between min/max
            try:
                steps = round(float(quantity) / vol_step)
                vol = steps * vol_step
            except Exception:
                vol = float(quantity)
            vol = max(vol_min, min(vol_max, vol))

            # Pick correct execution price from tick
            tick = mt5.symbol_info_tick(symbol)  # type: ignore
            bid = float(getattr(tick, 'bid', 0.0) or 0.0)
            ask = float(getattr(tick, 'ask', 0.0) or 0.0)
            if bid <= 0 or ask <= 0:
                return {"error": f"No prices for symbol {symbol}. Ensure symbol is visible and market is open."}
            req_type = mt5.ORDER_TYPE_BUY if side.lower() == "buy" else mt5.ORDER_TYPE_SELL  # type: ignore
            req_price = ask if req_type == getattr(mt5, 'ORDER_TYPE_BUY') else bid  # type: ignore

            base_request = {
                "action": mt5.TRADE_ACTION_DEAL,  # type: ignore
                "symbol": symbol,
                "volume": vol,
                "type": req_type,
                "price": req_price,
                "deviation": 50,
                "magic": 202501,
                "comment": comment or "exness_mt5_order",
            }
            if sl and sl > 0:
                base_request["sl"] = float(sl)
            if tp and tp > 0:
                base_request["tp"] = float(tp)

            # Try with FOK then IOC
            for filling in (getattr(mt5, 'ORDER_FILLING_FOK'), getattr(mt5, 'ORDER_FILLING_IOC')):  # type: ignore
                request = dict(base_request)
                request["type_filling"] = filling
                result = mt5.order_send(request)  # type: ignore
                if result is not None and getattr(result, "retcode", None) == getattr(mt5, "TRADE_RETCODE_DONE", 10009):  # type: ignore
                    return {
                        "id": getattr(result, "order", None) or getattr(result, "deal", None),
                        "status": "filled",
                        "symbol": symbol,
                        "side": side,
                        "quantity": vol,
                        "price": float(getattr(result, "price", req_price)),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }

            code, msg = mt5.last_error()  # type: ignore
            raise RuntimeError(f"order_send failed: last_error={code} {msg}")
        except Exception as e:
            logger.error(f"place_order error: {e}")
            return {"error": str(e)}

    def _place_mock_order(
        self, 
        symbol: str, 
        side: str, 
        quantity: float, 
        price: float,
        sl: float = 0.0,
        tp: float = 0.0,
        comment: str = "",
        order_type: str = "market"
    ) -> Dict[str, Any]:
        """Place a mock order."""
        if symbol not in self._mock_symbols:
            return {"error": f"Symbol {symbol} not found"}
        
        # Generate mock order ID
        order_id = len(self._mock_orders) + 1
        
        # Create mock order
        order = MT5Order(
            ticket=order_id,
            time_setup=datetime.now(timezone.utc),
            time_expiration=datetime(1970, 1, 1, tzinfo=timezone.utc),
            type=0 if side.lower() == "buy" else 1,  # ORDER_TYPE_BUY or ORDER_TYPE_SELL
            type_filling=1,  # ORDER_FILLING_FOK
            type_time=0,  # ORDER_TIME_GTC
            state=2,  # ORDER_STATE_FILLED
            reason=0,  # ORDER_REASON_CLIENT
            volume=quantity,
            price_open=price,
            sl=sl,
            tp=tp,
            price_current=price,
            price_stoplimit=0.0,
            symbol=symbol,
            comment=comment,
            external_id=""
        )
        
        self._mock_orders.append(order)
        
        # If it's a market order, create a position
        if order_type.lower() == "market":
            position = MT5Position(
                ticket=order_id,
                time=datetime.now(timezone.utc),
                time_msc=int(time.time() * 1000),
                time_update=datetime.now(timezone.utc),
                time_update_msc=int(time.time() * 1000),
                type=order.type,
                magic=0,
                identifier=order_id,
                reason=0,
                volume=quantity,
                price_open=price,
                sl=sl,
                tp=tp,
                price_current=price,
                swap=0.0,
                profit=0.0,
                symbol=symbol,
                comment=comment,
                external_id=""
            )
            self._mock_positions.append(position)
        
        logger.info(f"Mock order placed: {order_id} {side} {quantity} {symbol} @ {price}")
        
        return {
            "id": order_id,
            "status": "filled" if order_type.lower() == "market" else "pending",
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "price": price,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def get_orders(self, symbol: str = "") -> List[MT5Order]:
        """Get orders."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return []
        
        if self.use_mock:
            if symbol:
                return [order for order in self._mock_orders if order.symbol == symbol]
            return self._mock_orders.copy()
        
        # Real implementation would call MT5 API here
        return self._mock_orders.copy()

    def get_positions(self, symbol: str = "") -> List[MT5Position]:
        """Get positions."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return []
        
        if self.use_mock:
            if symbol:
                return [pos for pos in self._mock_positions if pos.symbol == symbol]
            return self._mock_positions.copy()
        
        # Real implementation would call MT5 API here
        return self._mock_positions.copy()

    def close_position(self, ticket: int) -> bool:
        """Close a position."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return False
        
        if self.use_mock:
            # Remove position from mock data
            self._mock_positions = [pos for pos in self._mock_positions if pos.ticket != ticket]
            logger.info(f"Mock position closed: {ticket}")
            return True
        
        # Real implementation would call MT5 API here
        return True

    def cancel_order(self, ticket: int) -> bool:
        """Cancel an order."""
        if not self.connected:
            logger.error("Not connected to MT5")
            return False
        
        if self.use_mock:
            # Remove order from mock data
            self._mock_orders = [order for order in self._mock_orders if order.ticket != ticket]
            logger.info(f"Mock order cancelled: {ticket}")
            return True
        
        # Real implementation would call MT5 API here
        return True

    def get_balance(self) -> float:
        """Get account balance."""
        if not self.connected:
            return 0.0
        if self.use_mock:
            # Mock balance
            return 10000.0
        try:
            if not self._real_initialized:
                self.connect()
            info = mt5.account_info()  # type: ignore
            if info is None:
                return 0.0
            return float(getattr(info, "balance", 0.0))
        except Exception:
            return 0.0

    def get_equity(self) -> float:
        """Get account equity."""
        if not self.connected:
            return 0.0
        if self.use_mock:
            balance = self.get_balance()
            profit = sum(pos.profit for pos in self._mock_positions)
            return balance + profit
        try:
            if not self._real_initialized:
                self.connect()
            info = mt5.account_info()  # type: ignore
            if info is None:
                return 0.0
            return float(getattr(info, "equity", 0.0))
        except Exception:
            return 0.0

    def get_margin(self) -> float:
        """Get used margin."""
        if not self.connected:
            return 0.0
        
        # Mock margin calculation
        total_margin = 0.0
        for pos in self._mock_positions:
            symbol_info = self.get_symbol_info(pos.symbol)
            if symbol_info:
                margin = (pos.volume * symbol_info.contract_size * pos.price_open) / self.account_info.leverage
                total_margin += margin
        
        return total_margin

    def get_free_margin(self) -> float:
        """Get free margin."""
        if not self.connected:
            return 0.0
        if self.use_mock:
            equity = self.get_equity()
            margin = self.get_margin()
            return equity - margin
        try:
            if not self._real_initialized:
                self.connect()
            info = mt5.account_info()  # type: ignore
            if info is None:
                return 0.0
            return float(getattr(info, "margin_free", 0.0))
        except Exception:
            return 0.0

    def is_connected(self) -> bool:
        """Check if connected to MT5."""
        return self.connected

    def get_last_error(self) -> str:
        """Get last error message."""
        return "No error" if self.connected else "Not connected to MT5"

    # --- Portfolio/Trades ---
    def get_open_positions(self) -> List[dict]:
        """Return normalized list of open positions.

        Each item: {symbol, side, volume, price_open, price_current, tp, sl, ticket, time, swap, profit}
        """
        if not self.connected:
            return []
        if self.use_mock:
            return [
                {
                    "symbol": p.symbol,
                    "side": p.side,
                    "volume": p.volume,
                    "price_open": p.price_open,
                    "price_current": p.price_current,
                    "tp": getattr(p, "tp", 0.0),
                    "sl": getattr(p, "sl", 0.0),
                    "ticket": getattr(p, "ticket", None),
                    "time": datetime.now(timezone.utc).isoformat(),
                    "swap": getattr(p, "swap", 0.0),
                    "profit": p.profit,
                }
                for p in self._mock_positions
            ]
        try:
            if not self._real_initialized:
                self.connect()
            pos = mt5.positions_get()  # type: ignore
            items: List[dict] = []
            for p in (pos or []):
                ptype = getattr(p, "type", 0)
                side = "buy" if ptype == getattr(mt5, "POSITION_TYPE_BUY", 0) else ("sell" if ptype == getattr(mt5, "POSITION_TYPE_SELL", 1) else "other")
                items.append(
                    {
                        "symbol": getattr(p, "symbol", ""),
                        "side": side,
                        "volume": float(getattr(p, "volume", 0.0)),
                        "price_open": float(getattr(p, "price_open", 0.0)),
                        "price_current": float(getattr(p, "price_current", 0.0)),
                        "tp": float(getattr(p, "tp", 0.0)),
                        "sl": float(getattr(p, "sl", 0.0)),
                        "ticket": getattr(p, "ticket", None),
                        "time": datetime.fromtimestamp(getattr(p, "time", 0), tz=timezone.utc).isoformat() if getattr(p, "time", 0) else None,
                        "swap": float(getattr(p, "swap", 0.0)),
                        "profit": float(getattr(p, "profit", 0.0)),
                    }
                )
            return items
        except Exception:
            return []

    def get_recent_trades(self, limit: int = 20) -> List[dict]:
        """Return recent deals from account history in a short time window.

        Each item: {id, symbol, side, volume, price, time}
        """
        if not self.connected:
            return []
        if self.use_mock:
            return [
                {
                    "id": o.ticket,
                    "symbol": o.symbol,
                    "side": o.side,
                    "volume": o.volume,
                    "price": o.price,
                    "time": datetime.now(timezone.utc).isoformat(),
                }
                for o in self._mock_orders[-limit:]
            ]
        try:
            if not self._real_initialized:
                self.connect()
            # fetch last 2 days history to be safe
            to = datetime.now()
            frm = to - timedelta(days=2)  # type: ignore
            deals = mt5.history_deals_get(frm, to)  # type: ignore
            rows: List[dict] = []
            for d in sorted(deals or [], key=lambda x: getattr(x, "time", 0), reverse=True)[:limit]:
                deal_type = getattr(d, "type", 0)
                side = "buy" if deal_type in (getattr(mt5, "DEAL_TYPE_BUY", 0),) else (
                    "sell" if deal_type in (getattr(mt5, "DEAL_TYPE_SELL", 1),) else "other"
                )
                rows.append(
                    {
                        "id": getattr(d, "ticket", None),
                        "symbol": getattr(d, "symbol", ""),
                        "side": side,
                        "volume": float(getattr(d, "volume", 0.0)),
                        "price": float(getattr(d, "price", 0.0)),
                        "profit": float(getattr(d, "profit", 0.0)),
                        "time": datetime.fromtimestamp(getattr(d, "time", 0), tz=timezone.utc).isoformat(),
                    }
                )
            return rows
        except Exception:
            return []


