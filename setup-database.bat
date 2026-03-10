@echo off
chcp 65001 >nul
echo ========================================
echo   CONFIGURACIÓN DE BASE DE DATOS SIPARK
echo ========================================
echo.
echo Este script creará la base de datos y usuario para SIPARK
echo.
echo REQUISITOS:
echo   - PostgreSQL debe estar instalado
echo   - Debes conocer la contraseña del usuario 'postgres'
echo.
pause

echo.
echo Ejecutando script de configuración...
echo.

REM Buscar psql en las ubicaciones comunes
set PSQL_PATH=
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin\psql.exe
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\15\bin\psql.exe
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\14\bin\psql.exe
if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\13\bin\psql.exe

if "%PSQL_PATH%"=="" (
    echo ❌ No se encontró PostgreSQL instalado
    echo.
    echo Por favor instala PostgreSQL desde:
    echo https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL encontrado en: %PSQL_PATH%
echo.

REM Ejecutar el script SQL
"%PSQL_PATH%" -U postgres -f setup-database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ CONFIGURACIÓN COMPLETADA
    echo ========================================
    echo.
    echo La base de datos está lista para usar
    echo Ahora puedes ejecutar SIPARK
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ ERROR EN LA CONFIGURACIÓN
    echo ========================================
    echo.
    echo Verifica que:
    echo   1. PostgreSQL esté corriendo
    echo   2. La contraseña del usuario postgres sea correcta
    echo   3. No exista ya la base de datos ludoteca_pos
    echo.
)

pause
