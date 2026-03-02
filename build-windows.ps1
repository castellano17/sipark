# Script de compilación para Windows
# Ejecutar con: .\build-windows.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Compilador Ludoteca POS - Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Node.js no está instalado" -ForegroundColor Red
    Write-Host "Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
Write-Host "Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm instalado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: npm no está disponible" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Paso 1: Instalando dependencias" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si node_modules existe
if (Test-Path "node_modules") {
    Write-Host "Dependencias ya instaladas. ¿Reinstalar? (S/N)" -ForegroundColor Yellow
    $reinstall = Read-Host
    if ($reinstall -eq "S" -or $reinstall -eq "s") {
        Write-Host "Eliminando node_modules..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force node_modules
        Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
        
        Write-Host "Instalando dependencias..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Error al instalar dependencias" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Error al instalar dependencias" -ForegroundColor Red
        Write-Host ""
        Write-Host "Intenta instalar Visual Studio Build Tools:" -ForegroundColor Yellow
        Write-Host "npm install --global windows-build-tools" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host "✓ Dependencias instaladas correctamente" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Paso 2: Verificando TypeScript" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verificando errores de TypeScript..." -ForegroundColor Yellow
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠ Advertencia: Hay errores de TypeScript" -ForegroundColor Yellow
    Write-Host "¿Continuar de todos modos? (S/N)" -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "S" -and $continue -ne "s") {
        Write-Host "Compilación cancelada" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Paso 3: Compilando aplicación" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Selecciona el tipo de compilación:" -ForegroundColor Yellow
Write-Host "1. Instalador completo (NSIS)" -ForegroundColor Cyan
Write-Host "2. Carpeta portable (sin instalador)" -ForegroundColor Cyan
Write-Host "3. Ambos" -ForegroundColor Cyan
Write-Host ""
$buildType = Read-Host "Opción (1-3)"

switch ($buildType) {
    "1" {
        Write-Host ""
        Write-Host "Creando instalador..." -ForegroundColor Yellow
        npm run electron:build
    }
    "2" {
        Write-Host ""
        Write-Host "Creando versión portable..." -ForegroundColor Yellow
        npm run electron:build:dir
    }
    "3" {
        Write-Host ""
        Write-Host "Creando instalador..." -ForegroundColor Yellow
        npm run electron:build
    }
    default {
        Write-Host "Opción inválida. Creando instalador por defecto..." -ForegroundColor Yellow
        npm run electron:build
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Error durante la compilación" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Ejecuta: npm rebuild sqlite3 --build-from-source" -ForegroundColor Cyan
    Write-Host "2. Ejecuta: npm rebuild bcrypt --build-from-source" -ForegroundColor Cyan
    Write-Host "3. Instala Visual Studio Build Tools" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Compilación exitosa" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Mostrar ubicación de los archivos
if (Test-Path "release") {
    Write-Host "Archivos generados en:" -ForegroundColor Yellow
    Write-Host ""
    
    Get-ChildItem -Path "release" -Filter "*.exe" | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  📦 $($_.Name) ($size MB)" -ForegroundColor Cyan
        Write-Host "     $($_.FullName)" -ForegroundColor Gray
    }
    
    if (Test-Path "release\win-unpacked") {
        Write-Host ""
        Write-Host "  📁 Versión portable:" -ForegroundColor Cyan
        Write-Host "     release\win-unpacked\Ludoteca POS.exe" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Siguiente paso" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para instalar:" -ForegroundColor Yellow
    Write-Host "1. Ve a la carpeta 'release'" -ForegroundColor White
    Write-Host "2. Ejecuta el instalador .exe" -ForegroundColor White
    Write-Host "3. Sigue el asistente de instalación" -ForegroundColor White
    Write-Host ""
    Write-Host "¿Abrir carpeta de release? (S/N)" -ForegroundColor Yellow
    $openFolder = Read-Host
    if ($openFolder -eq "S" -or $openFolder -eq "s") {
        Start-Process "release"
    }
} else {
    Write-Host "⚠ No se encontró la carpeta 'release'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
