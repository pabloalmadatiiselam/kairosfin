@echo off
echo ========================================
echo  Iniciando Aplicación Financiera Web...
echo ========================================

:: Paso 1: Activar entorno virtual
call venv\Scripts\activate.bat

:: Paso 2: Iniciar el servidor FastAPI (backend) en nueva ventana
start cmd /k "cd /d %cd% && uvicorn src.main:app --reload"

:: Paso 3: Esperar unos segundos antes de iniciar React
timeout /t 3 /nobreak >nul

:: Paso 4: Iniciar Vite (frontend React) en otra ventana
start cmd /k "cd /d %cd% && npm run dev"

:: Paso 5 (opcional): Abrir la app en el navegador automáticamente
start http://localhost:5173