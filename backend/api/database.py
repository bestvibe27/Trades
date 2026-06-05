"""Database utilities and connection management.

This module provides database connection management, session handling,
and both in-memory and SQL database implementations for development and production.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

from sqlalchemy import (
    Boolean, Column, DateTime, Float, Integer, String, Text, Numeric, Interval, create_engine,
    func, select, update, delete, insert
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

logger = logging.getLogger(__name__)

# Database models
Base = declarative_base()


class User(Base):
    """User model."""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_login = Column(DateTime)


class Strategy(Base):
    """Trading strategy model."""
    __tablename__ = "strategies"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    timeframe = Column(String, nullable=False)
    parameters = Column(Text)  # JSON string
    is_active = Column(Boolean, default=False)
    is_running = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    started_at = Column(DateTime)
    stopped_at = Column(DateTime)


class Order(Base):
    """Trading order model."""
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    strategy_id = Column(String, index=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # buy/sell
    type = Column(String, nullable=False)  # market/limit/stop
    quantity = Column(Float, nullable=False)
    price = Column(Float)
    stop_price = Column(Float)
    status = Column(String, nullable=False)  # pending/filled/cancelled
    filled_quantity = Column(Float, default=0.0)
    average_price = Column(Float)
    commission = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    filled_at = Column(DateTime)
    cancelled_at = Column(DateTime)


class Position(Base):
    """Trading position model."""
    __tablename__ = "positions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    strategy_id = Column(String, index=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # long/short
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, default=0.0)
    realized_pnl = Column(Float, default=0.0)
    margin = Column(Float, default=0.0)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    opened_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime)


class Trade(Base):
    """Enhanced trade model matching the database schema."""
    __tablename__ = "trades"
    
    trade_id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, nullable=True)
    strategy_id = Column(Integer, nullable=True)
    symbol = Column(String(10), nullable=False)
    trade_type = Column(String(10), nullable=True)  # BUY/SELL
    volume = Column(Numeric(10, 2), nullable=True)
    open_price = Column(Numeric(10, 2), nullable=True)
    close_price = Column(Numeric(10, 2), nullable=True)
    stop_loss = Column(Numeric(10, 2), nullable=True)
    take_profit = Column(Numeric(10, 2), nullable=True)
    commission = Column(Numeric(10, 2), nullable=True, default=0.00)
    swap = Column(Numeric(10, 2), nullable=True, default=0.00)
    profit_loss = Column(Numeric(10, 2), nullable=True)
    status = Column(String(10), nullable=True, default='OPEN')  # OPEN/CLOSED/CANCELLED/PENDING
    order_id = Column(String(50), nullable=True)
    execution_price = Column(Numeric(10, 2), nullable=True)
    execution_time = Column(DateTime, nullable=True)
    source = Column(String(20), nullable=True, default='AI')  # AI/MANUAL/SIGNAL/BACKTEST
    base_currency = Column(String(10), nullable=True, default='USD')
    profit_currency = Column(String(10), nullable=True, default='USD')
    risk_reward_ratio = Column(Numeric(5, 2), nullable=True)
    pip_gain = Column(Numeric(10, 2), nullable=True)
    duration = Column(Interval, nullable=True)
    notes = Column(Text, nullable=True)
    open_time = Column(DateTime, nullable=True, default=func.now())
    close_time = Column(DateTime, nullable=True)


class BacktestResult(Base):
    """Backtest result model."""
    __tablename__ = "backtest_results"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    strategy_id = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    timeframe = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    initial_balance = Column(Float, nullable=False)
    final_balance = Column(Float, nullable=False)
    total_return = Column(Float, nullable=False)
    max_drawdown = Column(Float, nullable=False)
    sharpe_ratio = Column(Float, nullable=False)
    win_rate = Column(Float, nullable=False)
    total_trades = Column(Integer, nullable=False)
    winning_trades = Column(Integer, nullable=False)
    losing_trades = Column(Integer, nullable=False)
    status = Column(String, nullable=False)  # completed/running/failed
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)


class InMemoryDB:
    """Enhanced in-memory database with table-like operations."""

    def __init__(self) -> None:
        self._tables: Dict[str, Dict[str, Any]] = {
            "users": {},
            "strategies": {},
            "orders": {},
            "positions": {},
            "trades": {},
            "backtest_results": {}
        }
        self._counters: Dict[str, int] = {
            "users": 0,
            "strategies": 0,
            "orders": 0,
            "positions": 0,
            "trades": 0,
            "backtest_results": 0
        }

    def _generate_id(self, table: str) -> str:
        """Generate a unique ID for a table."""
        self._counters[table] += 1
        return f"{table}_{self._counters[table]}"

    def get(self, table: str, key: str, default: Optional[Any] = None) -> Any:
        """Get a record from a table."""
        return self._tables.get(table, {}).get(key, default)

    def set(self, table: str, key: str, value: Any) -> None:
        """Set a record in a table."""
        if table not in self._tables:
            self._tables[table] = {}
        self._tables[table][key] = value

    def delete(self, table: str, key: str) -> None:
        """Delete a record from a table."""
        self._tables.get(table, {}).pop(key, None)

    def create(self, table: str, data: Dict[str, Any]) -> str:
        """Create a new record and return its ID."""
        if table not in self._tables:
            self._tables[table] = {}
        
        record_id = self._generate_id(table)
        data["id"] = record_id
        self._tables[table][record_id] = data.copy()
        return record_id

    def update(self, table: str, key: str, data: Dict[str, Any]) -> bool:
        """Update a record in a table."""
        if table not in self._tables or key not in self._tables[table]:
            return False
        
        self._tables[table][key].update(data)
        return True

    def find(self, table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Find records matching filters."""
        if table not in self._tables:
            return []
        
        records = list(self._tables[table].values())
        
        if not filters:
            return records
        
        filtered_records = []
        for record in records:
            match = True
            for key, value in filters.items():
                if record.get(key) != value:
                    match = False
                    break
            if match:
                filtered_records.append(record)
        
        return filtered_records

    def find_one(self, table: str, filters: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Find one record matching filters."""
        records = self.find(table, filters)
        return records[0] if records else None

    def count(self, table: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records matching filters."""
        return len(self.find(table, filters))

    def clear(self, table: str) -> None:
        """Clear all records from a table."""
        if table in self._tables:
            self._tables[table].clear()
            self._counters[table] = 0

    def clear_all(self) -> None:
        """Clear all tables."""
        for table in self._tables:
            self._tables[table].clear()
            self._counters[table] = 0


class DatabaseManager:
    """Database connection and session manager."""
    
    def __init__(self, database_url: Optional[str] = None, use_memory: bool = False):
        """Initialize database manager.
        
        Args:
            database_url: Database connection URL
            use_memory: Use in-memory database for development
        """
        self.database_url = database_url or os.getenv("DATABASE_URL")
        self.use_memory = bool(use_memory) or not self.database_url
        
        if self.use_memory:
            logger.info("Using in-memory database")
            self.engine = None
            self.async_engine = None
            self.SessionLocal = None
            self.AsyncSessionLocal = None
            self.memory_db = InMemoryDB()
        else:
            logger.info(f"Using database: {self.database_url}")
            self._setup_sql_database()
            self.memory_db = None

    def _setup_sql_database(self) -> None:
        """Setup SQL database connections."""
        try:
            # Create sync engine
            if "sqlite" in self.database_url:
                self.engine = create_engine(
                    self.database_url,
                    poolclass=StaticPool,
                    connect_args={"check_same_thread": False}
                )
            else:
                # Use default pooling for Postgres and others
                self.engine = create_engine(self.database_url)
            
            # Create async engine
            async_url = self.database_url.replace("sqlite://", "sqlite+aiosqlite://")
            if "postgresql://" in self.database_url:
                async_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://")
            
            if "sqlite+aiosqlite" in async_url:
                self.async_engine = create_async_engine(
                    async_url,
                    poolclass=StaticPool,
                    connect_args={"check_same_thread": False}
                )
            else:
                self.async_engine = create_async_engine(async_url)
            
            # Create session makers
            self.SessionLocal = sessionmaker(
                autocommit=False, autoflush=False, bind=self.engine
            )
            self.AsyncSessionLocal = sessionmaker(
                self.async_engine, class_=AsyncSession, expire_on_commit=False
            )
            
            # Create tables
            Base.metadata.create_all(bind=self.engine)
            
        except Exception as e:
            logger.error(f"Failed to setup SQL database: {e}")
            logger.info("Falling back to in-memory database")
            self.use_memory = True
            self.engine = None
            self.async_engine = None
            self.SessionLocal = None
            self.AsyncSessionLocal = None
            self.memory_db = InMemoryDB()

    def get_session(self):
        """Get a database session."""
        if self.use_memory:
            return self.memory_db
        return self.SessionLocal()

    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get an async database session."""
        if self.use_memory:
            # For in-memory, we'll return a mock async session
            class MockAsyncSession:
                def __init__(self, db: InMemoryDB):
                    self.db = db
                
                async def execute(self, query):
                    # Mock implementation
                    return None
                
                async def commit(self):
                    pass
                
                async def rollback(self):
                    pass
                
                async def close(self):
                    pass
            
            yield MockAsyncSession(self.memory_db)
        else:
            async with self.AsyncSessionLocal() as session:
                try:
                    yield session
                    await session.commit()
                except Exception:
                    await session.rollback()
                    raise
                finally:
                    await session.close()

    def create_tables(self) -> None:
        """Create database tables."""
        if not self.use_memory and self.engine:
            Base.metadata.create_all(bind=self.engine)

    def drop_tables(self) -> None:
        """Drop database tables."""
        if not self.use_memory and self.engine:
            Base.metadata.drop_all(bind=self.engine)

    def reset_database(self) -> None:
        """Reset the database."""
        if self.use_memory:
            self.memory_db.clear_all()
        else:
            self.drop_tables()
            self.create_tables()


# Global database manager instance
# Prefer SQL database when DATABASE_URL is provided
db_manager = DatabaseManager(use_memory=False)

# Convenience functions for backward compatibility
def get_db():
    """Get database session (sync)."""
    return db_manager.get_session()

async def get_async_db():
    """Get database session (async)."""
    async with db_manager.get_async_session() as session:
        yield session

# Legacy compatibility
db = db_manager.memory_db if db_manager.use_memory else None


