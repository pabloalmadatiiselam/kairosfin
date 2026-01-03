#!/usr/bin/env python3
import re

INPUT_FILE = "kairosfin_data.sql"
OUTPUT_FILE = "kairosfin_data_postgres.sql"

def convert_mysql_inserts_to_postgres():
    print(f"📖 Leyendo archivo: {INPUT_FILE}")

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        sql = f.read()

    print("🔄 Limpiando sintaxis MySQL...")

    # 1. Eliminar comentarios especiales /*! ... */
    sql = re.sub(r"/\*!.*?\*/;", "", sql, flags=re.DOTALL)

    # 2. Eliminar LOCK / UNLOCK / ALTER TABLE KEYS
    sql = re.sub(r"LOCK TABLES.*?;", "", sql)
    sql = re.sub(r"UNLOCK TABLES;", "", sql)
    sql = re.sub(r"ALTER TABLE .*? DISABLE KEYS;", "", sql)
    sql = re.sub(r"ALTER TABLE .*? ENABLE KEYS;", "", sql)

    # 3. Eliminar SETs de MySQL
    sql = re.sub(r"SET .*?;", "", sql)

    # 4. Convertir backticks a nada
    sql = sql.replace("`", "")

    # 5. Convertir booleanos 0/1 → false/true
    sql = re.sub(r",0(?=,|\))", ",false", sql)
    sql = re.sub(r",1(?=,|\))", ",true", sql)

    # 6. Convertir '' → NULL
    sql = re.sub(r",''(?=,|\))", ",NULL", sql)
    sql = re.sub(r"\(''", "(NULL", sql)

    # 7. Limpiar líneas vacías
    sql = re.sub(r"\n{3,}", "\n\n", sql)

    # 8. Header PostgreSQL
    header = """-- Datos convertidos de MySQL a PostgreSQL
-- Base: kairosfin
-- Fecha: 2025-12-30

BEGIN;
SET client_encoding = 'UTF8';

"""

    footer = """

COMMIT;
"""

    sql = header + sql + footer

    print(f"💾 Guardando archivo: {OUTPUT_FILE}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(sql)

    print("✅ Conversión de datos completada")
    print(f"📄 Archivo generado: {OUTPUT_FILE}")

if __name__ == "__main__":
    convert_mysql_inserts_to_postgres()
