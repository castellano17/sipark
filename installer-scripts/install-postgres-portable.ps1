# Script para instalar PostgreSQL Portable en Windows
# Este script se ejecuta durante la instalación del programa

param(
    [string]$InstallDir = "$env:ProgramFiles\SIPARK"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Instalando PostgreSQL Portable para SIPARK ===" -ForegroundColor Green

# Directorios
$PostgresDir = Join-Path $InstallDir "postgresql"
$DataDir = Join-Path $PostgresDir "data"
$BinDir = Join-Path $PostgresDir "bin"

# Verificar si ya existe
if (Test-Path $DataDir) {
    Write-Host "PostgreSQL ya está instalado en: $DataDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "Creando directorios..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $PostgresDir | Out-Null
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

# Inicializar base de datos
Write-Host "Inicializando base de datos PostgreSQL..." -ForegroundColor Cyan
$initdbPath = Join-Path $BinDir "initdb.exe"

if (Test-Path $initdbPath) {
    & $initdbPath -D $DataDir -U postgres -E UTF8 --locale=C -A trust
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Base de datos inicializada correctamente" -ForegroundColor Green
    } else {
        Write-Host "✗ Error inicializando base de datos" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ No se encontró initdb.exe en: $initdbPath" -ForegroundColor Red
    exit 1
}

# Configurar postgresql.conf
$postgresqlConf = Join-Path $DataDir "postgresql.conf"
$configContent = @"
# PostgreSQL Configuration for SIPARK
port = 5432
max_connections = 20
shared_buffers = 128MB
listen_addresses = 'localhost'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'all'
"@

Set-Content -Path $postgresqlConf -Value $configContent -Encoding UTF8
Write-Host "✓ Configuración de PostgreSQL creada" -ForegroundColor Green

# Configurar pg_hba.conf para permitir conexiones locales sin contraseña
$pgHbaConf = Join-Path $DataDir "pg_hba.conf"
$hbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
"@

Set-Content -Path $pgHbaConf -Value $hbaContent -Encoding UTF8
Write-Host "✓ Configuración de autenticación creada" -ForegroundColor Green

Write-Host ""
Write-Host "=== PostgreSQL Portable instalado correctamente ===" -ForegroundColor Green
Write-Host "Directorio de datos: $DataDir" -ForegroundColor Cyan
