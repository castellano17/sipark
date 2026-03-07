# Script para preparar el instalador de Windows con PostgreSQL embebido
# IMPORTANTE: Este script se ejecuta UNA VEZ por el DESARROLLADOR antes de compilar
# El cliente NO necesita ejecutar nada, solo instalar el .exe resultante

param(
    [string]$PostgresVersion = "16.2-1",
    [string]$OutputDir = ".\postgresql-portable"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Preparando PostgreSQL para INCLUIR en el Instalador ===" -ForegroundColor Green
Write-Host "NOTA: Esto se hace UNA VEZ. El cliente NO descargara nada." -ForegroundColor Yellow
Write-Host ""

# URLs de descarga
$PostgresUrl = "https://get.enterprisedb.com/postgresql/postgresql-$PostgresVersion-windows-x64-binaries.zip"
$PostgresZip = Join-Path (Get-Location) "postgresql-portable.zip"
$TempDir = Join-Path (Get-Location) "temp-postgres"

# Crear directorio de salida
if (Test-Path $OutputDir) {
    Write-Host "Limpiando directorio existente..." -ForegroundColor Yellow
    Remove-Item -Path $OutputDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
Write-Host "Directorio creado: $OutputDir" -ForegroundColor Green

# Descargar PostgreSQL portable (SOLO EL DESARROLLADOR hace esto)
Write-Host ""
Write-Host "Descargando PostgreSQL $PostgresVersion..." -ForegroundColor Cyan
Write-Host "Esto se incluira en el instalador para que el cliente NO tenga que descargar" -ForegroundColor Yellow
Write-Host "URL: $PostgresUrl" -ForegroundColor Gray

try {
    if (Test-Path $PostgresZip) {
        Write-Host "Archivo ya existe, saltando descarga..." -ForegroundColor Yellow
    }
    else {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $PostgresUrl -OutFile $PostgresZip -UseBasicParsing
        Write-Host "PostgreSQL descargado (~50 MB)" -ForegroundColor Green
    }
}
catch {
    Write-Host "Error descargando PostgreSQL: $_" -ForegroundColor Red
    Write-Host "Por favor descarga manualmente desde:" -ForegroundColor Yellow
    Write-Host $PostgresUrl -ForegroundColor Cyan
    Write-Host "Y colocalo como: $PostgresZip" -ForegroundColor Yellow
    exit 1
}

# Verificar que el archivo existe
if (-not (Test-Path $PostgresZip)) {
    Write-Host "Error: No se encontro el archivo $PostgresZip" -ForegroundColor Red
    exit 1
}

Write-Host "Archivo ZIP encontrado: $PostgresZip" -ForegroundColor Green

# Extraer PostgreSQL
Write-Host ""
Write-Host "Extrayendo PostgreSQL (esto puede tardar 1-2 minutos)..." -ForegroundColor Cyan
Write-Host "Por favor espera..." -ForegroundColor Yellow

try {
    # Limpiar directorio temporal si existe
    if (Test-Path $TempDir) {
        Remove-Item -Path $TempDir -Recurse -Force
    }
    
    # Extraer con Add-Type (mas rapido que Expand-Archive)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($PostgresZip, $TempDir)
    
    Write-Host "Archivo extraido, buscando directorio pgsql..." -ForegroundColor Cyan
    
    # Buscar directorio pgsql
    $pgsqlDir = Get-ChildItem -Path $TempDir -Directory -Filter "pgsql" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if (-not $pgsqlDir) {
        # Intentar buscar sin filtro
        Write-Host "Buscando estructura alternativa..." -ForegroundColor Yellow
        $pgsqlDir = Get-ChildItem -Path $TempDir -Directory -Recurse | Where-Object { $_.Name -eq "pgsql" } | Select-Object -First 1
    }
    
    if ($pgsqlDir) {
        Write-Host "Directorio encontrado: $($pgsqlDir.FullName)" -ForegroundColor Green
        
        # Copiar binarios esenciales
        Write-Host "Copiando binarios..." -ForegroundColor Cyan
        $binSource = Join-Path $pgsqlDir.FullName "bin"
        if (Test-Path $binSource) {
            Copy-Item -Path $binSource -Destination "$OutputDir\bin" -Recurse -Force
            Write-Host "  Binarios copiados" -ForegroundColor Green
        }
        else {
            Write-Host "  Advertencia: No se encontro carpeta bin" -ForegroundColor Yellow
        }
        
        # Copiar librerias
        Write-Host "Copiando librerias..." -ForegroundColor Cyan
        $libSource = Join-Path $pgsqlDir.FullName "lib"
        if (Test-Path $libSource) {
            Copy-Item -Path $libSource -Destination "$OutputDir\lib" -Recurse -Force
            Write-Host "  Librerias copiadas" -ForegroundColor Green
        }
        else {
            Write-Host "  Advertencia: No se encontro carpeta lib" -ForegroundColor Yellow
        }
        
        # Copiar archivos compartidos
        Write-Host "Copiando archivos compartidos..." -ForegroundColor Cyan
        $shareSource = Join-Path $pgsqlDir.FullName "share"
        if (Test-Path $shareSource) {
            Copy-Item -Path $shareSource -Destination "$OutputDir\share" -Recurse -Force
            Write-Host "  Archivos compartidos copiados" -ForegroundColor Green
        }
        else {
            Write-Host "  Advertencia: No se encontro carpeta share" -ForegroundColor Yellow
        }
        
        Write-Host "PostgreSQL extraido correctamente" -ForegroundColor Green
    }
    else {
        Write-Host "No se encontro el directorio pgsql" -ForegroundColor Red
        Write-Host "Contenido de temp-postgres:" -ForegroundColor Yellow
        Get-ChildItem -Path $TempDir -Recurse -Depth 2 | Select-Object FullName | Format-Table
        exit 1
    }
    
    # Limpiar
    Write-Host "Limpiando archivos temporales..." -ForegroundColor Cyan
    Remove-Item -Path $TempDir -Recurse -Force
    Write-Host "Limpieza completada (ZIP conservado para futuras compilaciones)" -ForegroundColor Green
}
catch {
    Write-Host "Error extrayendo PostgreSQL: $_" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    
    # Limpiar en caso de error
    if (Test-Path $TempDir) {
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}

# Crear estructura de directorios
Write-Host ""
Write-Host "Creando estructura de directorios..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$OutputDir\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$OutputDir\log" | Out-Null
Write-Host "Estructura creada" -ForegroundColor Green

# Copiar scripts de instalacion
Write-Host ""
Write-Host "Copiando scripts de instalacion..." -ForegroundColor Cyan
if (Test-Path ".\installer-scripts") {
    if (Test-Path ".\installer-scripts\*.ps1") {
        Copy-Item -Path ".\installer-scripts\*.ps1" -Destination "$OutputDir\" -Force
        Write-Host "Scripts copiados" -ForegroundColor Green
    }
    else {
        Write-Host "Advertencia: No se encontraron scripts .ps1 en installer-scripts" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Advertencia: No existe el directorio installer-scripts" -ForegroundColor Yellow
}

# Verificar que se copiaron los archivos esenciales
Write-Host ""
Write-Host "Verificando archivos..." -ForegroundColor Cyan
$postgresExe = Join-Path $OutputDir "bin\postgres.exe"
$pgCtlExe = Join-Path $OutputDir "bin\pg_ctl.exe"
$initdbExe = Join-Path $OutputDir "bin\initdb.exe"

if ((Test-Path $postgresExe) -and (Test-Path $pgCtlExe) -and (Test-Path $initdbExe)) {
    Write-Host "Archivos esenciales verificados correctamente" -ForegroundColor Green
}
else {
    Write-Host "Advertencia: Algunos archivos esenciales no se encontraron" -ForegroundColor Yellow
    if (-not (Test-Path $postgresExe)) { Write-Host "  Falta: postgres.exe" -ForegroundColor Red }
    if (-not (Test-Path $pgCtlExe)) { Write-Host "  Falta: pg_ctl.exe" -ForegroundColor Red }
    if (-not (Test-Path $initdbExe)) { Write-Host "  Falta: initdb.exe" -ForegroundColor Red }
}

# Calcular tamano
$size = (Get-ChildItem -Path $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "=== PostgreSQL Preparado para Incluir ===" -ForegroundColor Green
Write-Host "Directorio: $OutputDir" -ForegroundColor Cyan
Write-Host "Tamano: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este contenido se incluira en el instalador" -ForegroundColor Green
Write-Host "El cliente NO necesitara descargar nada" -ForegroundColor Green
Write-Host "El instalador final sera de ~200 MB" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: npm run build:win" -ForegroundColor Yellow
