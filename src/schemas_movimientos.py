# src/schemas_movimientos.py

from pydantic import BaseModel
from datetime import date
from typing import Optional

# Eliminar TipoMovimiento enum - ya no se usa

class MovimientoCreate(BaseModel):
    descripcion_id: int
    monto: float
    fecha: date | None = None
    deuda_id: Optional[int] = None
    deuda_saldo_antes: Optional[float] = None  # ← AGREGAR ESTA LÍNEA

class MovimientoUpdate(BaseModel):
    descripcion_id: Optional[int] = None
    monto: Optional[float] = None
    fecha: Optional[date] = None
    deuda_id: Optional[int] = None
    deuda_saldo_antes: Optional[float] = None  # ← AGREGAR ESTA LÍNEA
