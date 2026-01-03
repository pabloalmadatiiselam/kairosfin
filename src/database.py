# src/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Usamos SOLO DATABASE_URL (Supabase)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
