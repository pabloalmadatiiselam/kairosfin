# src/schemas_descripciones.py

from pydantic import BaseModel
from typing import Optional
from datetime import date

class DescripcionCreate(BaseModel):
    nombre: str
    tipo: str  # 'ingreso', 'egreso', 'deuda'
    activa: Optional[bool] = True
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    tipo_entidad: Optional[str] = None  # 'persona', 'empresa', 'organismo'
    fecha_creacion: Optional[date] = None

class DescripcionUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    activa: Optional[bool] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    tipo_entidad: Optional[str] = None
    fecha_creacion: Optional[date] = None