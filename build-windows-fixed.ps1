# Script de compilación para Windows - VERSIÓN CORREGIDA
# Este script maneja correctamente los módulos nativos

Write-Host "🚀 Iniciando compilación para Windows..." -ForegroundColor Green

# 1. Limpiar compilaciones anteriores
Write-Host "`n📦 Limpiando archivos anteriores..." -ForegroundColor Yellow
if (Test-Path "release") {
    Remove-Item -Recurse -Force "release"
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# 2. Limpiar node_modules de módulos nativos problemáticos
Write-Host "`n🧹 Limpiando módulos nativos..." -ForegroundColor Yellow
$nativeModules = @("better-sqlite3", "bcrypt", "sqlite3")
foreach ($module in $nativeModules) {
    $modulePath = "node_modules\$module"
    if (Test-Path $modulePath) {
        Write-Host "  Eliminando $module..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $modulePath
    }
}

# 3. Reinstalar dependencias con rebuild
Write-Host "`n📥 Reinstalando módulos nativos para Windows..." -ForegroundColor Yellow
npm install --force

# 4. Rebuild explícito de módulos nativos
Write-Host "`n🔨 Recompilando módulos nativos..." -ForegroundColor Yellow
npm rebuild better-sqlite3 --build-from-source
npm rebuild bcrypt --build-from-source

# 5. Compilar el frontend
Write-Host "`n⚛️  Compilando React..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando React" -ForegroundColor Red
    exit 1
}

# 6. Compilar Electron
Write-Host "`n📦 Empaquetando aplicación Electron..." -ForegroundColor Yellow
npx electron-builder --win --x64 --config electron-builder-win.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡Compilación exitosa!" -ForegroundColor Green
    Write-Host "📁 Instalador en: release\" -ForegroundColor Cyan
    
    # Mostrar archivos generados
    if (Test-Path "release") {
        Write-Host "`n📋 Archivos generados:" -ForegroundColor Cyan
        Get-ChildItem "release" | ForEach-Object {
            Write-Host "  - $($_.Name)" -ForegroundColor White
        }
    }
} else {
    Write-Host "`n❌ Error en la compilación" -ForegroundColor Red
    exit 1
}
