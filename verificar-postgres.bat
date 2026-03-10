@echo off
chcp 65001 >nul
echo ========================================
echo   VERIFICAR CONFIGURACIÓN POSTGRESQL
echo ========================================
echo.

REM Buscar psql
set PSQL_PATH=
set PG_VERSION=
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin\psql.exe
    set PG_VERSION=16
)
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\15\bin\psql.exe
    set PG_VERSION=15
)
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\14\bin\psql.exe
    set PG_VERSION=14
)
if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\17\bin\psql.exe
    set PG_VERSION=17
)

if "%PSQL_PATH%"=="" (
    echo ❌ No se encontró PostgreSQL
    pause
    exit /b 1
)

echo ✅ PostgreSQL %PG_VERSION% encontrado
echo.

echo Verificando si el usuario ludoteca_user existe...
"%PSQL_PATH%" -U postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname='ludoteca_user';" > temp_check.txt
findstr /C:"1" temp_check.txt >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Usuario ludoteca_user existe
) else (
    echo ❌ Usuario ludoteca_user NO existe
    echo    Ejecuta: crear-usuario-db.bat
)
del temp_check.txt

echo.
echo Verificando si la base de datos ludoteca_pos existe...
"%PSQL_PATH%" -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='ludoteca_pos';" > temp_check.txt
findstr /C:"1" temp_check.txt >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Base de datos ludoteca_pos existe
) else (
    echo ❌ Base de datos ludoteca_pos NO existe
    echo    Ejecuta: crear-usuario-db.bat
)
del temp_check.txt

echo.
echo Verificando conexión con ludoteca_user...
set PGPASSWORD=ludoteca2024
"%PSQL_PATH%" -h 127.0.0.1 -U ludoteca_user -d ludoteca_pos -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Conexión exitosa con ludoteca_user
    echo.
    echo ========================================
    echo   ✅ TODO ESTÁ CONFIGURADO CORRECTAMENTE
    echo ========================================
) else (
    echo ❌ No se puede conectar con ludoteca_user
    echo.
    echo POSIBLES CAUSAS:
    echo 1. El usuario no existe - Ejecuta: crear-usuario-db.bat
    echo 2. La contraseña es incorrecta
    echo 3. El archivo pg_hba.conf no permite conexiones con contraseña
    echo.
    echo SOLUCIÓN PARA pg_hba.conf:
    echo 1. Abre: C:\Program Files\PostgreSQL\%PG_VERSION%\data\pg_hba.conf
    echo 2. Busca las líneas que dicen "host    all    all    127.0.0.1/32"
    echo 3. Cambia el método de "scram-sha-256" o "md5" a "trust" temporalmente
    echo 4. Guarda el archivo
    echo 5. Reinicia el servicio PostgreSQL
    echo 6. Ejecuta: crear-usuario-db.bat
    echo 7. Vuelve a cambiar "trust" a "scram-sha-256" en pg_hba.conf
    echo 8. Reinicia PostgreSQL nuevamente
)

echo.
pause
