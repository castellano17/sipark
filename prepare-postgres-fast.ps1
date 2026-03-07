# Script alternativo mas rapido para extraer PostgreSQL
# Usa Expand-Archive con mejor manejo

param(
    [string]$OutputDir = ".\postgresql-portable"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Extraccion Rapida de PostgreSQL ===" -ForegroundColor Green
Write-Host ""

$PostgresZip = ".\postgresql-portable.zip"

# Verificar que existe el ZIP
if (-not (Test-Path $PostgresZip)) {
    Write-Host "Error: No se encuentra $PostgresZip" -ForegroundColor Red
    Write-Host "Descargalo desde: https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64-binaries.zip" -ForegroundColor Yellow
    exit 1
}

Write-Host "Archivo ZIP encontrado" -ForegroundColor Green
$zipSize = (Get-Item $PostgresZip).Length / 1MB
Write-Host "Tamano: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan

# Limpiar directorios
Write-Host ""
Write-Host "Limpiando directorios..." -ForegroundColor Cyan
if (Test-Path $OutputDir) {
    Remove-Item -Path $OutputDir -Recurse -Force
}
if (Test-Path ".\temp-postgres") {
    Remove-Item -Path ".\temp-postgres" -Recurse -Force
}

# Crear directorio de salida
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Extraer directamente con 7-Zip si esta disponible
$sevenZip = "C:\Program Files\7-Zip\7z.exe"
if (Test-Path $sevenZip) {
    Write-Host ""
    Write-Host "Usando 7-Zip (mas rapido)..." -ForegroundColor Cyan
    & $sevenZip x $PostgresZip -o".\temp-postgres" -y | Out-Null
    Write-Host "Extraido con 7-Zip" -ForegroundColor Green
}
else {
    # Usar Expand-Archive nativo
    Write-Host ""
    Write-Host "Extrayendo con PowerShell (puede tardar 2-3 minutos)..." -ForegroundColor Cyan
    Write-Host "Iniciando extraccion..." -ForegroundColor Yellow
    
    try {
        Expand-Archive -Path $PostgresZip -DestinationPath ".\temp-postgres" -Force
        Write-Host "Extraccion completada" -ForegroundColor Green
    }
    catch {
        Write-Host "Error en extraccion: $_" -ForegroundColor Red
        exit 1
    }
}

# Buscar directorio pgsql
Write-Host ""
Write-Host "Buscando archivos de PostgreSQL..." -ForegroundColor Cyan

$pgsqlDir = Get-ChildItem -Path ".\temp-postgres" -Directory -Recurse | Where-Object { $_.Name -eq "pgsql" } | Select-Object -First 1

if (-not $pgsqlDir) {
    Write-Host "No se encontro directorio pgsql" -ForegroundColor Red
    Write-Host "Estructura encontrada:" -ForegroundColor Yellow
    Get-ChildItem -Path ".\temp-postgres" -Recurse -Depth 2 | Select-Object FullName
    exit 1
}

Write-Host "Directorio encontrado: $($pgsqlDir.FullName)" -ForegroundColor Green

# Copiar archivos
Write-Host ""
Write-Host "Copiando archivos..." -ForegroundColor Cyan

$folders = @("bin", "lib", "share")
foreach ($folder in $folders) {
    $source = Join-Path $pgsqlDir.FullName $folder
    if (Test-Path $source) {
        Write-Host "  Copiando $folder..." -ForegroundColor Gray
        Copy-Item -Path $source -Destination (Join-Path $OutputDir $folder) -Recurse -Force
        Write-Host "  $folder copiado" -ForegroundColor Green
    }
    else {
        Write-Host "  Advertencia: No se encontro $folder" -ForegroundColor Yellow
    }
}

# Crear directorios adicionales
New-Item -ItemType Directory -Force -Path "$OutputDir\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$OutputDir\log" | Out-Null

# Limpiar
Write-Host ""
Write-Host "Limpiando archivos temporales..." -ForegroundColor Cyan
Remove-Item -Path ".\temp-postgres" -Recurse -Force

# Verificar
Write-Host ""
Write-Host "Verificando instalacion..." -ForegroundColor Cyan
$files = @("bin\postgres.exe", "bin\pg_ctl.exe", "bin\initdb.exe")
$allOk = $true

foreach ($file in $files) {
    $fullPath = Join-Path $OutputDir $file
    if (Test-Path $fullPath) {
        Write-Host "  OK: $file" -ForegroundColor Green
    }
    else {
        Write-Host "  FALTA: $file" -ForegroundColor Red
        $allOk = $false
    }
}

if ($allOk) {
    $size = (Get-ChildItem -Path $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host ""
    Write-Host "=== PostgreSQL Listo ===" -ForegroundColor Green
    Write-Host "Directorio: $OutputDir" -ForegroundColor Cyan
    Write-Host "Tamano: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Siguiente paso: npm run build:win" -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "Advertencia: Faltan algunos archivos" -ForegroundColor Yellow
}
