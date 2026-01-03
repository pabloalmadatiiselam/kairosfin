-- Conversión de MySQL a PostgreSQL
-- Base de datos: kairosfin
-- Generado para Supabase

SET client_encoding = 'UTF8';

-- =========================
-- TABLA: descripciones
-- =========================
CREATE TABLE descripciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('ingreso', 'egreso', 'deuda')),
  activa BOOLEAN DEFAULT true,
  fecha_creacion DATE,
  telefono VARCHAR(20),
  email VARCHAR(100),
  direccion VARCHAR(200),
  tipo_entidad VARCHAR(20) CHECK (tipo_entidad IN ('persona', 'empresa', 'organismo')),

  CONSTRAINT unique_nombre_tipo UNIQUE (nombre, tipo)
);

-- =========================
-- TABLA: deudas
-- =========================
CREATE TABLE deudas (
  id SERIAL PRIMARY KEY,
  monto DECIMAL(10,2) NOT NULL,
  fecha_registro DATE NOT NULL,
  fecha_vencimiento DATE,
  pagado BOOLEAN DEFAULT false,
  monto_pagado DECIMAL(10,2) DEFAULT 0.00,
  saldo_pendiente DECIMAL(10,2),
  descripcion_id INTEGER,

  CONSTRAINT deudas_descripcion_fk
    FOREIGN KEY (descripcion_id)
    REFERENCES descripciones(id)
);

-- =========================
-- TABLA: movimientos
-- =========================
CREATE TABLE movimientos (
  id SERIAL PRIMARY KEY,
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL,
  deuda_id INTEGER,
  descripcion_id INTEGER,
  deuda_saldo_antes DECIMAL(10,2),

  CONSTRAINT movimientos_deuda_fk
    FOREIGN KEY (deuda_id)
    REFERENCES deudas(id)
    ON DELETE SET NULL,

  CONSTRAINT movimientos_descripcion_fk
    FOREIGN KEY (descripcion_id)
    REFERENCES descripciones(id)
);

-- =========================
-- ÍNDICES
-- =========================
CREATE INDEX IF NOT EXISTS idx_deudas_descripcion
  ON deudas(descripcion_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_deuda
  ON movimientos(deuda_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_descripcion
  ON movimientos(descripcion_id);

CREATE INDEX IF NOT EXISTS idx_descripciones_tipo
  ON descripciones(tipo);
