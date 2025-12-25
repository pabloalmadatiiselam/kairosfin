# src/schemas_deudas.py

from pydantic import BaseModel
from typing import Optional
from datetime import date

class DeudaCreate(BaseModel):
    # Eliminar: descripcion: str
    descripcion_id: int  # NUEVO - referencia a tabla descripciones
    monto: float
    fecha_registro: Optional[date] = None
    fecha_vencimiento: Optional[date] = None

class DeudaUpdate(BaseModel):
    #descripcion: Optional[str] = None #eliminar
    descripcion_id: Optional[int] = None  # NUEVO
    monto: Optional[float] = None
    fecha_registro: Optional[date] = None
    fecha_vencimiento: Optional[date] = None