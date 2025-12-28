# src/database.py

# Importamos la función create_engine para conectarnos a la base de datos
from sqlalchemy import create_engine

# Importamos sessionmaker, que nos permite crear sesiones para interactuar con la base de datos
from sqlalchemy.orm import sessionmaker

from urllib.parse import quote_plus

import os 
from dotenv import load_dotenv

# Cargamos las variables de entorno desde el archivo .env
load_dotenv()

# -------- CONFIGURACIÓN DE CONEXIÓN --------

# CAMBIO 1: Ahora usamos variables de entorno con valores por defecto para desarrollo local
# Esto permite que la app funcione tanto en local como en Railway sin cambiar código

USER = os.getenv("DB_USER", "root")
PASSWORD = os.getenv("DB_PASSWORD", "8j9e4S3@")
HOST = os.getenv("DB_HOST", "localhost")
PORT = os.getenv("DB_PORT", "3306")
DB = os.getenv("DB_NAME", "kairosfin")

# CAMBIO 2: Construimos la URL de forma dinámica
# quote_plus() codifica caracteres especiales en la contraseña (@ → %40)
encoded_password = quote_plus(PASSWORD)
DATABASE_URL = f"mysql+pymysql://{USER}:{encoded_password}@{HOST}:{PORT}/{DB}"

# CAMBIO 3: También respetamos DATABASE_URL si viene directamente de Railway
# Railway a veces provee una URL completa, este código la usa si existe
DATABASE_URL = os.getenv("DATABASE_URL", DATABASE_URL)

# -------- CONEXIÓN A LA BASE DE DATOS --------

# Configuración del engine con parámetros para evitar cache entre sesiones
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,           # Verifica conexiones antes de usar
    pool_recycle=3600,            # Recicla conexiones cada hora
    isolation_level="READ COMMITTED"  # Lee siempre datos frescos
)

# Configuración de la sesión
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Evita cache entre requests
)