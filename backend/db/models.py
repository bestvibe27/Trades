from sqlalchemy import Column, Integer, BigInteger, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    broker_ticket = Column(String, index=True)
    symbol = Column(String, index=True)
    side = Column(String)
    volume = Column(Float)
    price = Column(Float)
    profit = Column(Float, default=0.0)
    time = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String, default="ui")


class Position(Base):
    __tablename__ = "positions"
    # Use MT5 position ticket as unique identifier
    ticket = Column(BigInteger, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    side = Column(String, nullable=False)  # buy/sell
    volume = Column(Float, nullable=False)
    price_open = Column(Float, nullable=False)
    price_current = Column(Float, nullable=False)
    tp = Column(Float, default=0.0)
    sl = Column(Float, default=0.0)
    swap = Column(Float, default=0.0)
    profit = Column(Float, default=0.0)
    open_time = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
