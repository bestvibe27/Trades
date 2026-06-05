import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

try:
    from dotenv import load_dotenv  # optional
    load_dotenv()
except Exception:
    pass

# Example: postgresql+psycopg://user:pass@host:5432/db
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/postgres",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
