from sqlalchemy import Column, Integer, String, Float, DateTime
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
