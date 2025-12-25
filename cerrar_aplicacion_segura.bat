@echo off
echo ============================================
echo   Cierre controlado de la aplicación web
echo ============================================

:: Confirmar cierre de FastAPI (uvicorn)
set /p cerrar_uvicorn=¿Querés cerrar el backend (FastAPI)? (s/n): 
if /i "%cerrar_uvicorn%"=="s" (
    taskkill /f /im uvicorn.exe >nul 2>&1
    echo Backend cerrado.
) else (
    echo Backend sigue funcionando.
)

:: Confirmar cierre del frontend (React - Vite)
set /p cerrar_node=¿Querés cerrar el frontend (Vite)? (s/n): 
if /i "%cerrar_node%"=="s" (
    taskkill /f /im node.exe >nul 2>&1
    echo Frontend cerrado.
) else (
    echo Frontend sigue funcionando.
)

:: Confirmar cierre de consolas (cmd)
set /p cerrar_cmd=¿Querés cerrar las consolas CMD abiertas por la app? (s/n): 
if /i "%cerrar_cmd%"=="s" (
    taskkill /f /im cmd.exe >nul 2>&1
    echo Consolas CMD cerradas.
) else (
    echo Consolas CMD siguen abiertas.
)

echo --------------------------------------------
echo   Proceso de cierre completo.
exit