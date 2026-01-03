#!/usr/bin/env python3
"""
Convertidor MySQL → PostgreSQL para Kairosfin
Convierte tu dump de MySQL a formato compatible con Supabase (PostgreSQL)
"""

import re

def convert_mysql_to_postgres(input_file, output_file):
    print(f"📖 Leyendo archivo: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("🔄 Convirtiendo sintaxis...")
    
    # 1. Eliminar comandos específicos de MySQL
    sql = re.sub(r'/\*!.*?\*/;', '', sql, flags=re.DOTALL)
    sql = re.sub(r'LOCK TABLES.*?UNLOCK TABLES;', '', sql, flags=re.DOTALL)
    sql = re.sub(r'DROP TABLE IF EXISTS.*?;', '', sql, flags=re.DOTALL)
    sql = re.sub(r'SET.*?;', '', sql)
    
    # 2. Convertir AUTO_INCREMENT a SERIAL
    sql = re.sub(r'`id` int NOT NULL AUTO_INCREMENT', '`id` SERIAL PRIMARY KEY', sql)
    sql = re.sub(r'PRIMARY KEY \(`id`\),?', '', sql)
    
    # 3. Convertir TINYINT(1) a BOOLEAN
    sql = re.sub(r'`activa` tinyint\(1\)', '`activa` BOOLEAN', sql)
    sql = re.sub(r'`pagado` tinyint', '`pagado` BOOLEAN', sql)
    
    # 4. Convertir backticks a comillas dobles
    sql = sql.replace('`', '"')
    
    # 5. Convertir ENUM a VARCHAR con CHECK (PostgreSQL prefiere esto)
    sql = re.sub(
        r'"tipo" enum\(\'ingreso\',\'egreso\',\'deuda\'\)[^,]*',
        '"tipo" VARCHAR(10) CHECK ("tipo" IN (\'ingreso\', \'egreso\', \'deuda\'))',
        sql
    )
    sql = re.sub(
        r'"tipo_entidad" enum\(\'persona\',\'empresa\',\'organismo\'\)[^,]*',
        '"tipo_entidad" VARCHAR(20) CHECK ("tipo_entidad" IN (\'persona\', \'empresa\', \'organismo\'))',
        sql
    )
    
    # 6. Eliminar ENGINE=InnoDB y CHARSET
    sql = re.sub(r'\) ENGINE=.*?;', ');', sql)
    
    # 7. Convertir KEY a INDEX (PostgreSQL usa INDEX)
    sql = re.sub(r'UNIQUE KEY', 'UNIQUE', sql)
    sql = re.sub(r'KEY "(\w+)" \("(\w+)"\)', r'-- INDEX \1 on \2 (crear después)', sql)
    
    # 8. Ajustar COLLATE (PostgreSQL no usa COLLATE de la misma forma)
    sql = re.sub(r'COLLATE [^\s,)]+', '', sql)
    
    # 9. Ajustar DEFAULT '1' a DEFAULT true para BOOLEAN
    sql = re.sub(r'BOOLEAN DEFAULT \'1\'', 'BOOLEAN DEFAULT true', sql)
    sql = re.sub(r'BOOLEAN DEFAULT \'0\'', 'BOOLEAN DEFAULT false', sql)
    
    # 10. Convertir comillas vacías a NULL en INSERTs
    # 10. Convertir '' a NULL en INSERTs
    sql = re.sub(r",''(?=,|\))", ',NULL', sql)
    sql = re.sub(r"\(''", '(NULL', sql)

    
    # 11. Limpiar líneas vacías múltiples
    sql = re.sub(r'\n{3,}', '\n\n', sql)
    
    # 12. Agregar header PostgreSQL
    postgres_header = """-- Conversión de MySQL a PostgreSQL
-- Base de datos: kairosfin
-- Generado para Supabase
-- Fecha: 2025-12-29

-- Configuración inicial
SET client_encoding = 'UTF8';

"""
    
    # 13. Crear índices al final (PostgreSQL los prefiere separados)
    indexes = """
-- Índices (ejecutar después de crear las tablas)
CREATE INDEX IF NOT EXISTS idx_deudas_descripcion ON deudas(descripcion_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_deuda ON movimientos(deuda_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_descripcion ON movimientos(descripcion_id);
CREATE INDEX IF NOT EXISTS idx_descripciones_tipo ON descripciones(tipo);
"""
    
    sql = postgres_header + sql + indexes
    
    print(f"💾 Guardando archivo: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print("✅ ¡Conversión completada!")
    print(f"\n📄 Archivo generado: {output_file}")
    print("\n🎯 Próximos pasos:")
    print("1. Abre el archivo generado")
    print("2. Copia todo el contenido")
    print("3. Pégalo en el SQL Editor de Supabase")
    print("4. Ejecuta el script")

if __name__ == "__main__":
    # CAMBIA ESTAS RUTAS según tu ubicación del archivo
    input_file = "C:/Users/Pablo/OneDrive/Documentos/Desktop/kairosfin_completo.sql"
    output_file = "C:/Users/Pablo/OneDrive/Documentos/Desktop/kairosfin_postgres.sql"

    try:
        convert_mysql_to_postgres(input_file, output_file)
    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {input_file}")
        print("   Verifica la ruta del archivo.")
    except Exception as e:
        print(f"❌ Error: {e}")