@echo off
chcp 65001 >nul
echo ========================================
echo   CREAR USUARIO Y BASE DE DATOS SIPARK
echo ========================================
echo.

REM Buscar psql
set PSQL_PATH=
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin\psql.exe
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\15\bin\psql.exe
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\14\bin\psql.exe
if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\13\bin\psql.exe
if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" set PSQL_PATH=C:\Program Files\PostgreSQL\17\bin\psql.exe

if "%PSQL_PATH%"=="" (
    echo ❌ No se encontró PostgreSQL
    pause
    exit /b 1
)

echo ✅ PostgreSQL encontrado
echo.
echo Ingresa la contraseña del usuario 'postgres':
echo.

REM Crear usuario
echo Creando usuario ludoteca_user...
"%PSQL_PATH%" -U postgres -c "DROP USER IF EXISTS ludoteca_user;"
"%PSQL_PATH%" -U postgres -c "CREATE USER ludoteca_user WITH PASSWORD 'ludoteca2024';"

REM Crear base de datos
echo Creando base de datos ludoteca_pos...
"%PSQL_PATH%" -U postgres -c "DROP DATABASE IF EXISTS ludoteca_pos;"
"%PSQL_PATH%" -U postgres -c "CREATE DATABASE ludoteca_pos OWNER ludoteca_user;"

REM Dar permisos
echo Configurando permisos...
"%PSQL_PATH%" -U postgres -d ludoteca_pos -c "GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;"
"%PSQL_PATH%" -U postgres -d ludoteca_pos -c "GRANT ALL ON SCHEMA public TO ludoteca_user;"
"%PSQL_PATH%" -U postgres -d ludoteca_pos -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ludoteca_user;"
"%PSQL_PATH%" -U postgres -d ludoteca_pos -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ludoteca_user;"

echo.
echo ========================================
echo   ✅ CONFIGURACIÓN COMPLETADA
echo ========================================
echo.
echo Usuario: ludoteca_user
echo Contraseña: ludoteca2024
echo Base de datos: ludoteca_pos
echo.
echo Ahora puedes ejecutar SIPARK
echo.
pause
