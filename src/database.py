# src/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. Leer DATABASE_URL (Railway la provee automáticamente)
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Convertir de mysql:// a mysql+pymysql://
if DATABASE_URL and DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

# 3. Fallback para desarrollo local (sin .env, valores fijos)
if not DATABASE_URL:
    DATABASE_URL = "mysql+pymysql://root@localhost:3306/kairosfin"

# 4. Log para debugging
print(f"[INFO] Conectando a base de datos...")

# 5. Crear engine
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