# src/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus

# Leer DATABASE_URL desde variables de entorno
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Si no existe, construirla desde variables individuales
    USER = os.getenv("DB_USER", "root")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST", "localhost")
    PORT = os.getenv("DB_PORT", "3306")
    DB_NAME = os.getenv("DB_NAME", "kairosfin")
    
    encoded_password = quote_plus(PASSWORD)
    DATABASE_URL = f"mysql+pymysql://{USER}:{encoded_password}@{HOST}:{PORT}/{DB_NAME}"

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