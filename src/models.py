from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Boolean,  DECIMAL, Enum as SqlEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from decimal import Decimal

Base = declarative_base()

class TipoMovimiento(enum.Enum):
    ingreso = "ingreso"
    egreso = "egreso"

class Movimiento(Base):
    __tablename__ = "movimientos"

    id = Column(Integer, primary_key=True, index=True)
    #tipo = Column(SqlEnum(TipoMovimiento, name="tipo_movimiento"), nullable=False)
    #categoria = Column(String(50), nullable=False)
    descripcion_id = Column(Integer, ForeignKey("descripciones.id"), nullable=False)  # NUEVO   
    monto = Column(DECIMAL(10, 2), nullable=False)  # Cambiado de Float a DECIMAL
    fecha = Column(Date, nullable=False)

    deuda_id = Column(Integer, ForeignKey("deudas.id"), nullable=True)  # vínculo con deuda pagada (si aplica)
     # ✅ NUEVO CAMPO
    deuda_saldo_antes = Column(DECIMAL(10, 2), nullable=True)  # ← AGREGAR ESTA LÍNEA

    deuda = relationship("Deuda", back_populates="pagos")
    descripcion = relationship("Descripcion", back_populates="movimientos")  # NUEVO

    def to_dict(self):
        return {
            "id": self.id,
            "descripcion_id": self.descripcion_id,
            "monto": float(self.monto),
            "fecha": self.fecha.isoformat(),
            "deuda_id": self.deuda_id,
            "deuda_saldo_antes": float(self.deuda_saldo_antes) if self.deuda_saldo_antes is not None else None,
            # Incluir datos de la descripción relacionada
            "tipo": self.descripcion.tipo if self.descripcion else None,
            "categoria": self.descripcion.nombre if self.descripcion else None,            
        }

class Deuda(Base):
    __tablename__ = "deudas"
    
    id = Column(Integer, primary_key=True, index=True)
    # Eliminar: descripcion = Column(...)
    descripcion_id = Column(Integer, ForeignKey("descripciones.id"), nullable=False)  # NUEVO
    monto = Column(DECIMAL(10, 2), nullable=False)
    fecha_registro = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=True)
    pagado = Column(Boolean, default=False)
    monto_pagado = Column(DECIMAL(10, 2), default=Decimal('0.00'))
    saldo_pendiente = Column(DECIMAL(10, 2), nullable=True)
    
    # Relaciones actualizadas
    pagos = relationship("Movimiento", back_populates="deuda")
    descripcion = relationship("Descripcion", back_populates="deudas")  # NUEVO
    
    @property
    def esta_pagada(self):
        return self.pagado
    
    def to_dict(self):
        return {
            "id": self.id,
            "descripcion_id": self.descripcion_id,
            "monto": str(self.monto),
            "fecha_registro": self.fecha_registro.isoformat(),
            "fecha_vencimiento": self.fecha_vencimiento.isoformat() if self.fecha_vencimiento else None,
            "pagado": self.pagado,
            "monto_pagado": str(self.monto_pagado),
            "saldo_pendiente": str(self.saldo_pendiente) if self.saldo_pendiente is not None else None,
            # Incluir datos de la descripción relacionada
            "descripcion": self.descripcion.nombre if self.descripcion else None,
        }

# Agregar al final de models.py, después de la clase Deuda:
class Descripcion(Base):
    __tablename__ = "descripciones"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)  # 'ingreso', 'egreso', 'deuda'
    activa = Column(Boolean, default=True)
    telefono = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    direccion = Column(String(200), nullable=True)
    tipo_entidad = Column(String(20), nullable=True)  # 'persona', 'empresa', 'organismo'
    fecha_creacion = Column(Date, nullable=True)
    
    # Relaciones
    movimientos = relationship("Movimiento", back_populates="descripcion")
    deudas = relationship("Deuda", back_populates="descripcion")
    
    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "tipo": self.tipo,
            "activa": self.activa,
            "telefono": self.telefono,
            "email": self.email,
            "direccion": self.direccion,
            "tipo_entidad": self.tipo_entidad,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None
        }