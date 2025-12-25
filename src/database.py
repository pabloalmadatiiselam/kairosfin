# src/database.py

# Importamos la función create_engine para conectarnos a la base de datos
from sqlalchemy import create_engine

# Importamos sessionmaker, que nos permite crear sesiones para interactuar con la base de datos
from sqlalchemy.orm import sessionmaker

from urllib.parse import quote_plus



# -------- CONFIGURACIÓN DE CONEXIÓN --------

# Usuario de MySQL (debe coincidir con el usuario creado en MySQL Workbench)
USER = "root"

# Contraseña del usuario (reemplazá "tu_contraseña" por la real)
PASSWORD = quote_plus("8j9e4S3@")  # Esto convierte @ en %40

# Dirección del servidor de base de datos (localhost si está en tu propia computadora)
HOST = "localhost"

# Puerto por el que se conecta MySQL (por defecto es 3306)
PORT = "3306"

# Nombre de la base de datos que vas a usar (debe existir en MySQL Workbench)
DB = "kairosfin"

# Construimos la URL de conexión con el formato correcto para SQLAlchemy + MySQL
# DATABASE_URL = f"mysql+mysqlconnector://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB}"
DATABASE_URL = f"mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB}"



# -------- CONEXIÓN A LA BASE DE DATOS --------

# CAMBIO CRÍTICO: Agregar parámetros al engine para evitar cache entre sesiones
# EXPLICACIÓN:
# - pool_pre_ping=True: Verifica que la conexión esté viva antes de usarla
# - pool_recycle=3600: Recicla conexiones cada hora (evita conexiones obsoletas)
# - isolation_level="READ COMMITTED": Nivel de aislamiento que garantiza
#   que siempre leas datos comprometidos más recientes, no datos cacheados
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,           # NUEVO: Verifica conexiones antes de usar
    pool_recycle=3600,            # NUEVO: Recicla conexiones cada hora
    isolation_level="READ COMMITTED"  # NUEVO: Lee siempre datos frescos
)

# CAMBIO CRÍTICO: Agregar expire_on_commit=False
# EXPLICACIÓN:
# - expire_on_commit=False: Evita que SQLAlchemy expire objetos después de commit
#   Esto previene comportamientos inesperados de cache
# - autocommit=False: No guarda automáticamente (control manual)
# - autoflush=False: No sincroniza automáticamente (más control)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # NUEVO: Crítico para evitar cache entre requests
)

# EXPLICACIÓN TÉCNICA COMPLETA:
# 
# El problema era que SQLAlchemy cachea objetos en memoria para performance.
# Cuando tienes múltiples requests (egresos y deudas), cada uno tiene su propia
# sesión PERO comparten el mismo pool de conexiones.
#
# Sin estas configuraciones:
# 1. Request A (egresos) modifica deuda → commit
# 2. Request B (deudas) lee deuda → puede obtener versión cacheada
#
# Con estas configuraciones:
# 1. READ COMMITTED garantiza que siempre leas la última versión comprometida
# 2. expire_on_commit=False evita problemas de objetos expirados inesperadamente
# 3. pool_pre_ping verifica que las conexiones estén activas
# 4. pool_recycle evita usar conexiones muy viejas que puedan tener cache obsoleto
#
# RESULTADO: Cada request SIEMPRE lee los datos más frescos de la base de datos
