# Script para preparar el instalador de Windows con PostgreSQL embebido
# IMPORTANTE: Este script se ejecuta UNA VEZ por el DESARROLLADOR antes de compilar
# El cliente NO necesita ejecutar nada, solo instalar el .exe resultante

param(
    [string]$PostgresVersion = "16.2-1",
    [string]$OutputDir = ".\postgresql-portable"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Preparando PostgreSQL para INCLUIR en el Instalador ===" -ForegroundColor Green
Write-Host "NOTA: Esto se hace UNA VEZ. El cliente NO descargará nada." -ForegroundColor Yellow
Write-Host ""

# URLs de descarga
$PostgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-$PostgresVersion-windows-x64-binaries.zip"
$PostgresZip = "postgresql-portable.zip"

# Crear directorio de salida
if (Test-Path $OutputDir) {
    Write-Host "Limpiando directorio existente..." -ForegroundColor Yellow
    Remove-Item -Path $OutputDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
Write-Host "✓ Directorio creado: $OutputDir" -ForegroundColor Green

# Descargar PostgreSQL portable (SOLO EL DESARROLLADOR hace esto)
Write-Host ""
Write-Host "Descargando PostgreSQL $PostgresVersion..." -ForegroundColor Cyan
Write-Host "Esto se incluirá en el instalador para que el cliente NO tenga que descargar" -ForegroundColor Yellow
Write-Host "URL: $PostgresUrl" -ForegroundColor Gray

try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $PostgresUrl -OutFile $PostgresZip -UseBasicParsing
    Write-Host "✓ PostgreSQL descargado (~50 MB)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error descargando PostgreSQL" -ForegroundColor Red
    Write-Host "Por favor descarga manualmente desde:" -ForegroundColor Yellow
    Write-Host $PostgresUrl -ForegroundColor Cyan
    Write-Host "Y colócalo como: $PostgresZip" -ForegroundColor Yellow
    exit 1
}

# Extraer PostgreSQL
Write-Host ""
Write-Host "Extrayendo PostgreSQL..." -ForegroundColor Cyan
try {
    Expand-Archive -Path $PostgresZip -DestinationPath ".\temp-postgres" -Force
    
    # Copiar solo los archivos necesarios
    $pgsqlDir = Get-ChildItem -Path ".\temp-postgres" -Directory -Filter "pgsql" -Recurse | Select-Object -First 1
    
    if ($pgsqlDir) {
        # Copiar binarios esenciales
        Write-Host "Copiando binarios..." -ForegroundColor Cyan
        Copy-Item -Path "$($pgsqlDir.FullName)\bin" -Destination "$OutputDir\bin" -Recurse -Force
        
        Write-Host "Copiando librerías..." -ForegroundColor Cyan
        Copy-Item -Path "$($pgsqlDir.FullName)\lib" -Destination "$OutputDir\lib" -Recurse -Force
        
        Write-Host "Copiando archivos compartidos..." -ForegroundColor Cyan
        Copy-Item -Path "$($pgsqlDir.FullName)\share" -Destination "$OutputDir\share" -Recurse -Force
        
        Write-Host "✓ PostgreSQL extraído correctamente" -ForegroundColor Green
    } else {
        Write-Host "✗ No se encontró el directorio pgsql" -ForegroundColor Red
        exit 1
    }
    
    # Limpiar
    Remove-Item -Path ".\temp-postgres" -Recurse -Force
    Remove-Item -Path $PostgresZip -Force
    
} catch {
    Write-Host "✗ Error extrayendo PostgreSQL: $_" -ForegroundColor Red
    exit 1
}

# Crear estructura de directorios
Write-Host ""
Write-Host "Creando estructura de directorios..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$OutputDir\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$OutputDir\log" | Out-Null
Write-Host "✓ Estructura creada" -ForegroundColor Green

# Copiar scripts de instalación
Write-Host ""
Write-Host "Copiando scripts de instalación..." -ForegroundColor Cyan
Copy-Item -Path ".\installer-scripts\*.ps1" -Destination "$OutputDir\" -Force
Write-Host "✓ Scripts copiados" -ForegroundColor Green

# Calcular tamaño
$size = (Get-ChildItem -Path $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "=== PostgreSQL Preparado para Incluir ===" -ForegroundColor Green
Write-Host "Directorio: $OutputDir" -ForegroundColor Cyan
Write-Host "Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Este contenido se incluirá en el instalador" -ForegroundColor Green
Write-Host "✓ El cliente NO necesitará descargar nada" -ForegroundColor Green
Write-Host "✓ El instalador final será de ~200 MB" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: npm run build:win" -ForegroundColor Yellow
