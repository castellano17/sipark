# Script de compilación limpia para Windows
Write-Host "=== Compilación limpia de SIPARK ===" -ForegroundColor Cyan

# 1. Limpiar todo
Write-Host "1. Limpiando archivos antiguos..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# 2. Verificar que database.cjs NO exista
Write-Host "2. Verificando archivos de base de datos..." -ForegroundColor Yellow
if (Test-Path src-electron\database.cjs) {
    Write-Host "ERROR: database.cjs todavia existe. Eliminando..." -ForegroundColor Red
    Remove-Item src-electron\database.cjs -Force
}

$dbFiles = Get-ChildItem src-electron\database*.cjs
Write-Host "Archivos de base de datos encontrados:" -ForegroundColor Cyan
$dbFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }

# 3. Instalar dependencias limpias
Write-Host "3. Instalando dependencias..." -ForegroundColor Yellow
npm install

# 4. Verificar que SQLite NO esté instalado
Write-Host "4. Verificando que SQLite no este instalado..." -ForegroundColor Yellow
$sqlite3 = npm list sqlite3 2>&1 | Select-String "sqlite3"
$betterSqlite = npm list better-sqlite3 2>&1 | Select-String "better-sqlite3"

if ($sqlite3 -or $betterSqlite) {
    Write-Host "ERROR: SQLite todavia esta instalado. Desinstalando..." -ForegroundColor Red
    npm uninstall sqlite3 better-sqlite3
}

# 5. Compilar React
Write-Host "5. Compilando React..." -ForegroundColor Yellow
npm run build

# 6. Compilar Electron
Write-Host "6. Compilando instalador de Windows..." -ForegroundColor Yellow
npx electron-builder --win --x64

Write-Host ""
Write-Host "OK Compilacion completada!" -ForegroundColor Green
Write-Host "Instalador: dist\SIPARK Setup 1.0.4.exe" -ForegroundColor Cyan
