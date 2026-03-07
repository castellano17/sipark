# Script completo para compilar SIPARK con PostgreSQL embebido
# Ejecuta todos los pasos necesarios automáticamente

param(
    [switch]$SkipPostgres,
    [switch]$SkipBuild,
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║     SIPARK - Compilación Completa para Windows            ║" -ForegroundColor Cyan
Write-Host "║     Con PostgreSQL Embebido                               ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Paso 1: Preparar PostgreSQL Portable
if (-not $SkipPostgres) {
    Write-Host "═══ PASO 1/3: Preparando PostgreSQL Portable ═══" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path ".\postgresql-portable") {
        Write-Host "PostgreSQL portable ya existe. ¿Descargar nuevamente? (S/N)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -eq "S" -or $response -eq "s") {
            Remove-Item -Path ".\postgresql-portable" -Recurse -Force
            .\prepare-windows-installer.ps1
        } else {
            Write-Host "✓ Usando PostgreSQL existente" -ForegroundColor Green
        }
    } else {
        .\prepare-windows-installer.ps1
    }
    
    Write-Host ""
} else {
    Write-Host "⊘ Saltando preparación de PostgreSQL" -ForegroundColor Yellow
}

# Paso 2: Compilar Aplicación
if (-not $SkipBuild) {
    Write-Host "═══ PASO 2/3: Compilando Aplicación ═══" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Instalando dependencias..." -ForegroundColor Cyan
    npm install
    
    Write-Host ""
    Write-Host "Compilando frontend con Vite..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Error compilando aplicación" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Aplicación compilada correctamente" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⊘ Saltando compilación de aplicación" -ForegroundColor Yellow
}

# Paso 3: Crear Instalador
if (-not $SkipInstaller) {
    Write-Host "═══ PASO 3/3: Creando Instalador ═══" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Empaquetando con Electron Builder..." -ForegroundColor Cyan
    npm run build:win
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Error creando instalador" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Instalador creado correctamente" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⊘ Saltando creación de instalador" -ForegroundColor Yellow
}

# Resumen
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║     ✓ COMPILACIÓN COMPLETADA EXITOSAMENTE                 ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Información del instalador
$installerPath = Get-ChildItem -Path ".\release" -Filter "*.exe" -Recurse | Select-Object -First 1

if ($installerPath) {
    $installerSize = [math]::Round($installerPath.Length / 1MB, 2)
    
    Write-Host "📦 Instalador creado:" -ForegroundColor Cyan
    Write-Host "   Ruta: $($installerPath.FullName)" -ForegroundColor White
    Write-Host "   Tamaño: $installerSize MB" -ForegroundColor White
    Write-Host ""
}

Write-Host "⏱️  Tiempo total: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Probar el instalador en una máquina Windows limpia" -ForegroundColor White
Write-Host "   2. Verificar que PostgreSQL se inicie automáticamente" -ForegroundColor White
Write-Host "   3. Confirmar que la base de datos se cree correctamente" -ForegroundColor White
Write-Host "   4. Distribuir el instalador a los usuarios" -ForegroundColor White
Write-Host ""

Write-Host "💡 Tip: Ejecuta con -SkipPostgres para compilaciones rápidas" -ForegroundColor Gray
Write-Host ""
