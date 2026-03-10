# Script para restaurar seguridad de PostgreSQL
# Ejecutar como Administrador DESPUES de configurar

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTAURAR SEGURIDAD POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Buscar PostgreSQL
$pgVersion = 18
$pgData = "C:\Program Files\PostgreSQL\$pgVersion\data"
$pgHbaPath = "$pgData\pg_hba.conf"
$backupPath = "$pgHbaPath.backup"

if (-not (Test-Path $backupPath)) {
    Write-Host "[ERROR] No se encontro el backup" -ForegroundColor Red
    Write-Host "No se puede restaurar la configuracion original" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[OK] Backup encontrado" -ForegroundColor Green
Write-Host ""

# Restaurar el archivo original
Copy-Item $backupPath $pgHbaPath -Force
Write-Host "[OK] Archivo pg_hba.conf restaurado" -ForegroundColor Green
Write-Host ""

# Reiniciar servicio PostgreSQL
Write-Host "Reiniciando servicio PostgreSQL..." -ForegroundColor Yellow
$serviceName = "postgresql-x64-$pgVersion"

try {
    Restart-Service $serviceName -Force
    Write-Host "[OK] Servicio reiniciado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] No se pudo reiniciar automaticamente" -ForegroundColor Red
    Write-Host "Reinicia manualmente:" -ForegroundColor Yellow
    Write-Host "1. Abre Servicios (services.msc)" -ForegroundColor White
    Write-Host "2. Busca 'postgresql-x64-$pgVersion'" -ForegroundColor White
    Write-Host "3. Clic derecho -> Reiniciar" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] SEGURIDAD RESTAURADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PostgreSQL volvio a su configuracion de seguridad original" -ForegroundColor Green
Write-Host ""
pause
