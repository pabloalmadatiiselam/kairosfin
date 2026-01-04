# src/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("mysql://"):
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
    
    # Esta línea es la nueva - arregla los acentos
    if "?" not in DATABASE_URL:
        DATABASE_URL += "?charset=utf8mb4"
    
    if DATABASE_URL.endswith(":3306/") or DATABASE_URL.endswith(":3306"):
        DATABASE_URL = DATABASE_URL.rstrip("/") + "/railway"
else:
    DATABASE_URL = "mysql+pymysql://root@localhost:3306/kairosfin?charset=utf8mb4"

print(f"[INFO] Conectando a base de datos...")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)