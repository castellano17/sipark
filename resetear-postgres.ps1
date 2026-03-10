# Script para resetear acceso a PostgreSQL
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESETEAR ACCESO A POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Buscar PostgreSQL
$pgVersion = 18
$pgData = "C:\Program Files\PostgreSQL\$pgVersion\data"
$pgHbaPath = "$pgData\pg_hba.conf"

if (-not (Test-Path $pgHbaPath)) {
    Write-Host "[ERROR] No se encontro pg_hba.conf" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[OK] Archivo encontrado: $pgHbaPath" -ForegroundColor Green
Write-Host ""

# Hacer backup del archivo original
$backupPath = "$pgHbaPath.backup"
Copy-Item $pgHbaPath $backupPath -Force
Write-Host "[OK] Backup creado: $backupPath" -ForegroundColor Green
Write-Host ""

# Leer el archivo
$content = Get-Content $pgHbaPath

# Reemplazar scram-sha-256 y md5 con trust
$newContent = $content -replace 'scram-sha-256', 'trust' -replace 'md5', 'trust'

# Guardar el archivo modificado
$newContent | Set-Content $pgHbaPath -Encoding UTF8

Write-Host "[OK] Archivo pg_hba.conf modificado" -ForegroundColor Green
Write-Host "Todos los metodos de autenticacion cambiados a 'trust'" -ForegroundColor Yellow
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
    Write-Host ""
    Read-Host "Presiona Enter cuando hayas reiniciado el servicio"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] LISTO PARA CONFIGURAR" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
Write-Host ".\configurar-postgres-sipark.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Cuando pida la contrasena, solo presiona Enter (sin escribir nada)" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: Despues de configurar, ejecuta:" -ForegroundColor Red
Write-Host ".\restaurar-seguridad-postgres.ps1" -ForegroundColor White
Write-Host "para volver a activar la seguridad" -ForegroundColor Red
Write-Host ""
pause
