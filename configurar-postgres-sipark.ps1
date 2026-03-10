# Script para configurar PostgreSQL para SIPARK
# Ejecutar como Administrador en PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR POSTGRESQL PARA SIPARK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Buscar instalacion de PostgreSQL
$pgVersions = @(18, 17, 16, 15, 14, 13, 12)
$psqlPath = $null
$pgVersion = $null
$pgData = $null

foreach ($version in $pgVersions) {
    $testPath = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
    if (Test-Path $testPath) {
        $psqlPath = $testPath
        $pgVersion = $version
        $pgData = "C:\Program Files\PostgreSQL\$version\data"
        break
    }
}

# Si no se encuentra en Program Files, buscar en otras ubicaciones comunes
if (-not $psqlPath) {
    $otherPaths = @(
        "C:\PostgreSQL\18\bin\psql.exe",
        "C:\PostgreSQL\17\bin\psql.exe",
        "C:\PostgreSQL\16\bin\psql.exe"
    )
    foreach ($path in $otherPaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            $pgVersion = ($path -split '\\')[2]
            $pgData = ($path -replace '\\bin\\psql.exe', '\data')
            break
        }
    }
}

if (-not $psqlPath) {
    Write-Host "[ERROR] No se encontro PostgreSQL instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Descarga PostgreSQL desde:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "[OK] PostgreSQL $pgVersion encontrado" -ForegroundColor Green
Write-Host "   Ruta: $psqlPath" -ForegroundColor Gray
Write-Host ""

# Solicitar contrasena del usuario postgres
Write-Host "Ingresa la contrasena del usuario 'postgres':" -ForegroundColor Yellow
$postgresPassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword)
$postgresPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PASO 1: ELIMINAR USUARIO Y DB ANTIGUOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Configurar variable de entorno para la contrasena
$env:PGPASSWORD = $postgresPasswordPlain

# Eliminar base de datos si existe
Write-Host "Eliminando base de datos anterior (si existe)..." -ForegroundColor Yellow
& $psqlPath -U postgres -h 127.0.0.1 -c "DROP DATABASE IF EXISTS ludoteca_pos;" 2>$null

# Eliminar usuario si existe
Write-Host "Eliminando usuario anterior (si existe)..." -ForegroundColor Yellow
& $psqlPath -U postgres -h 127.0.0.1 -c "DROP USER IF EXISTS ludoteca_user;" 2>$null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PASO 2: CREAR NUEVO USUARIO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Creando usuario: ludoteca_user" -ForegroundColor Yellow
Write-Host "Contrasena: ludoteca2024" -ForegroundColor Yellow

$result = & $psqlPath -U postgres -h 127.0.0.1 -c "CREATE USER ludoteca_user WITH PASSWORD 'ludoteca2024';" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Usuario creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error creando usuario: $result" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica que la contrasena de postgres sea correcta" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PASO 3: CREAR BASE DE DATOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Creando base de datos: ludoteca_pos" -ForegroundColor Yellow

$result = & $psqlPath -U postgres -h 127.0.0.1 -c "CREATE DATABASE ludoteca_pos OWNER ludoteca_user;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Base de datos creada exitosamente" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error creando base de datos: $result" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PASO 4: CONFIGURAR PERMISOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Otorgando permisos al usuario..." -ForegroundColor Yellow

& $psqlPath -U postgres -h 127.0.0.1 -d ludoteca_pos -c "GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;" 2>&1 | Out-Null
& $psqlPath -U postgres -h 127.0.0.1 -d ludoteca_pos -c "GRANT ALL ON SCHEMA public TO ludoteca_user;" 2>&1 | Out-Null
& $psqlPath -U postgres -h 127.0.0.1 -d ludoteca_pos -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ludoteca_user;" 2>&1 | Out-Null
& $psqlPath -U postgres -h 127.0.0.1 -d ludoteca_pos -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ludoteca_user;" 2>&1 | Out-Null

Write-Host "[OK] Permisos configurados" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PASO 5: VERIFICAR CONEXION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Probando conexion con ludoteca_user..." -ForegroundColor Yellow

# Cambiar contrasena para probar con el nuevo usuario
$env:PGPASSWORD = "ludoteca2024"

$testResult = & $psqlPath -U ludoteca_user -h 127.0.0.1 -d ludoteca_pos -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Conexion exitosa" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  [OK] CONFIGURACION COMPLETADA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credenciales configuradas:" -ForegroundColor Cyan
    Write-Host "  Host: 127.0.0.1" -ForegroundColor White
    Write-Host "  Puerto: 5432" -ForegroundColor White
    Write-Host "  Base de datos: ludoteca_pos" -ForegroundColor White
    Write-Host "  Usuario: ludoteca_user" -ForegroundColor White
    Write-Host "  Contrasena: ludoteca2024" -ForegroundColor White
    Write-Host ""
    Write-Host "Ahora puedes ejecutar SIPARK" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error en la conexion: $testResult" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUCION:" -ForegroundColor Yellow
    Write-Host "El archivo pg_hba.conf necesita ser modificado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ejecuta este comando para editar pg_hba.conf:" -ForegroundColor Cyan
    Write-Host "notepad `"$pgData\pg_hba.conf`"" -ForegroundColor White
    Write-Host ""
    Write-Host "Busca estas lineas:" -ForegroundColor Yellow
    Write-Host "host    all             all             127.0.0.1/32            scram-sha-256" -ForegroundColor Gray
    Write-Host "host    all             all             ::1/128                 scram-sha-256" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Y cambialas a:" -ForegroundColor Yellow
    Write-Host "host    all             all             127.0.0.1/32            md5" -ForegroundColor White
    Write-Host "host    all             all             ::1/128                 md5" -ForegroundColor White
    Write-Host ""
    Write-Host "Luego reinicia PostgreSQL y ejecuta este script nuevamente" -ForegroundColor Yellow
    Write-Host ""
    
    # Ofrecer abrir el archivo automaticamente
    $response = Read-Host "Quieres abrir pg_hba.conf ahora? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        notepad "$pgData\pg_hba.conf"
        Write-Host ""
        Write-Host "Despues de guardar los cambios, reinicia PostgreSQL:" -ForegroundColor Yellow
        Write-Host "1. Abre Servicios (services.msc)" -ForegroundColor White
        Write-Host "2. Busca 'postgresql-x64-$pgVersion'" -ForegroundColor White
        Write-Host "3. Clic derecho -> Reiniciar" -ForegroundColor White
        Write-Host ""
        Write-Host "Luego ejecuta este script nuevamente" -ForegroundColor Yellow
    }
}

Write-Host ""
pause
