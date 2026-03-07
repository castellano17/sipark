# Script para crear la base de datos y usuario de SIPARK
# Se ejecuta después de instalar PostgreSQL

param(
    [string]$InstallDir = "$env:ProgramFiles\SIPARK",
    [string]$DbName = "ludoteca_pos",
    [string]$DbUser = "ludoteca_user",
    [string]$DbPassword = "ludoteca2024"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Configurando Base de Datos SIPARK ===" -ForegroundColor Green

$PostgresDir = Join-Path $InstallDir "postgresql"
$BinDir = Join-Path $PostgresDir "bin"
$DataDir = Join-Path $PostgresDir "data"
$psqlPath = Join-Path $BinDir "psql.exe"
$pgCtlPath = Join-Path $BinDir "pg_ctl.exe"

# Iniciar PostgreSQL si no está corriendo
Write-Host "Iniciando servidor PostgreSQL..." -ForegroundColor Cyan
$pgProcess = Get-Process -Name postgres -ErrorAction SilentlyContinue

if (-not $pgProcess) {
    & $pgCtlPath start -D $DataDir -l (Join-Path $DataDir "log\postgres.log")
    Start-Sleep -Seconds 3
    Write-Host "✓ Servidor PostgreSQL iniciado" -ForegroundColor Green
} else {
    Write-Host "✓ Servidor PostgreSQL ya está corriendo" -ForegroundColor Yellow
}

# Crear usuario
Write-Host "Creando usuario de base de datos..." -ForegroundColor Cyan
$createUserSql = "CREATE USER $DbUser WITH PASSWORD '$DbPassword';"
& $psqlPath -U postgres -c $createUserSql 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Usuario creado: $DbUser" -ForegroundColor Green
} else {
    Write-Host "! Usuario ya existe o error al crear" -ForegroundColor Yellow
}

# Crear base de datos
Write-Host "Creando base de datos..." -ForegroundColor Cyan
$createDbSql = "CREATE DATABASE $DbName OWNER $DbUser ENCODING 'UTF8';"
& $psqlPath -U postgres -c $createDbSql 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Base de datos creada: $DbName" -ForegroundColor Green
} else {
    Write-Host "! Base de datos ya existe o error al crear" -ForegroundColor Yellow
}

# Otorgar permisos
Write-Host "Otorgando permisos..." -ForegroundColor Cyan
$grantSql = "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;"
& $psqlPath -U postgres -c $grantSql

# Crear archivo de configuración para la aplicación
$appDir = Join-Path $InstallDir "resources\app.asar.unpacked"
$configPath = Join-Path $appDir "db-config.json"

$config = @{
    host = "localhost"
    port = 5432
    database = $DbName
    user = $DbUser
    password = $DbPassword
    max = 20
    idleTimeoutMillis = 30000
    connectionTimeoutMillis = 2000
} | ConvertTo-Json

New-Item -ItemType Directory -Force -Path $appDir | Out-Null
Set-Content -Path $configPath -Value $config -Encoding UTF8

Write-Host "✓ Archivo de configuración creado: $configPath" -ForegroundColor Green

Write-Host ""
Write-Host "=== Base de Datos Configurada Correctamente ===" -ForegroundColor Green
Write-Host "Base de datos: $DbName" -ForegroundColor Cyan
Write-Host "Usuario: $DbUser" -ForegroundColor Cyan
Write-Host "Host: localhost:5432" -ForegroundColor Cyan
