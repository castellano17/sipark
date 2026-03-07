# Script para arreglar el problema de autenticacion de PostgreSQL
# Ejecutar como Administrador

Write-Host "=== Arreglando autenticacion de PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Buscar PostgreSQL
$pgPath = "C:\Program Files\PostgreSQL\15"
if (-not (Test-Path $pgPath)) {
    Write-Host "ERROR: PostgreSQL no encontrado en $pgPath" -ForegroundColor Red
    exit 1
}

Write-Host "1. Deteniendo servicio de PostgreSQL..." -ForegroundColor Yellow
Stop-Service postgresql-x64-15 -ErrorAction SilentlyContinue

Write-Host "2. Modificando archivo de configuracion..." -ForegroundColor Yellow

# Backup del archivo original
$hbaFile = "$pgPath\data\pg_hba.conf"
Copy-Item $hbaFile "$hbaFile.backup" -Force

# Leer el archivo
$content = Get-Content $hbaFile

# Modificar las lineas de autenticacion
$newContent = @()
foreach ($line in $content) {
    if ($line -match "^host\s+all\s+all\s+127\.0\.0\.1/32") {
        $newContent += "host    all             all             127.0.0.1/32            md5"
    }
    elseif ($line -match "^host\s+all\s+all\s+::1/128") {
        $newContent += "host    all             all             ::1/128                 md5"
    }
    else {
        $newContent += $line
    }
}

# Guardar el archivo modificado
$newContent | Out-File -FilePath $hbaFile -Encoding UTF8

Write-Host "3. Iniciando servicio de PostgreSQL..." -ForegroundColor Yellow
Start-Service postgresql-x64-15

Write-Host "4. Esperando que el servicio inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "5. Probando conexion..." -ForegroundColor Yellow

$env:PGPASSWORD = "ludoteca2024"
$testResult = & "$pgPath\bin\psql.exe" -h 127.0.0.1 -U ludoteca_user -d ludoteca_pos -c "SELECT 1;" 2>&1

if ($testResult -match "1") {
    Write-Host ""
    Write-Host "OK TODO FUNCIONA CORRECTAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credenciales:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Puerto: 5432" -ForegroundColor White
    Write-Host "  Base de datos: ludoteca_pos" -ForegroundColor White
    Write-Host "  Usuario: ludoteca_user" -ForegroundColor White
    Write-Host "  Contrasena: ludoteca2024" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERROR: Aun hay problemas de conexion" -ForegroundColor Red
    Write-Host "Resultado: $testResult" -ForegroundColor Yellow
}

$env:PGPASSWORD = $null

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
