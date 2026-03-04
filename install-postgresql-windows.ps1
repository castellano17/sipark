# Script de instalación automática de PostgreSQL para SIPARK
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALADOR DE POSTGRESQL PARA SIPARK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si ya está instalado
$pgInstalled = Test-Path "C:\Program Files\PostgreSQL\15\bin\psql.exe"

if ($pgInstalled) {
    Write-Host "✅ PostgreSQL ya está instalado" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ PostgreSQL NO está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, descarga e instala PostgreSQL desde:" -ForegroundColor Yellow
    Write-Host "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Durante la instalación:" -ForegroundColor Yellow
    Write-Host "  - Password: ludoteca2024" -ForegroundColor White
    Write-Host "  - Puerto: 5432" -ForegroundColor White
    Write-Host "  - NO instalar Stack Builder" -ForegroundColor White
    Write-Host ""
    Write-Host "Después de instalar, ejecuta este script de nuevo." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para abrir el navegador y descargar PostgreSQL"
    Start-Process "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads"
    exit
}

# Configurar PostgreSQL
Write-Host "🔧 Configurando PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

$password = "ludoteca2024"
$env:PGPASSWORD = $password

# Crear base de datos y usuario
Write-Host "📊 Creando base de datos..." -ForegroundColor Yellow

$commands = @"
CREATE DATABASE ludoteca_pos;
CREATE USER ludoteca_user WITH PASSWORD '$password';
GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;
ALTER DATABASE ludoteca_pos OWNER TO ludoteca_user;
"@

$commands | & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos creada exitosamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  La base de datos ya existe o hubo un error (esto es normal si ya se ejecutó antes)" -ForegroundColor Yellow
}

Write-Host ""

# Configurar acceso remoto
Write-Host "🌐 Configurando acceso remoto..." -ForegroundColor Yellow

$dataDir = "C:\Program Files\PostgreSQL\15\data"
$pgHbaPath = "$dataDir\pg_hba.conf"
$postgresqlConfPath = "$dataDir\postgresql.conf"

# Backup de archivos
Copy-Item $pgHbaPath "$pgHbaPath.backup" -Force -ErrorAction SilentlyContinue
Copy-Item $postgresqlConfPath "$postgresqlConfPath.backup" -Force -ErrorAction SilentlyContinue

# Configurar postgresql.conf
$postgresqlConf = Get-Content $postgresqlConfPath
if ($postgresqlConf -notmatch "listen_addresses = '\*'") {
    $postgresqlConf = $postgresqlConf -replace "#listen_addresses = 'localhost'", "listen_addresses = '*'"
    $postgresqlConf | Set-Content $postgresqlConfPath
    Write-Host "✅ postgresql.conf configurado" -ForegroundColor Green
} else {
    Write-Host "✅ postgresql.conf ya estaba configurado" -ForegroundColor Green
}

# Configurar pg_hba.conf
$pgHbaContent = Get-Content $pgHbaPath
$remoteAccess = "host    all    all    0.0.0.0/0    md5"
if ($pgHbaContent -notcontains $remoteAccess) {
    Add-Content $pgHbaPath "`n# Acceso remoto para SIPARK"
    Add-Content $pgHbaPath $remoteAccess
    Write-Host "✅ pg_hba.conf configurado" -ForegroundColor Green
} else {
    Write-Host "✅ pg_hba.conf ya estaba configurado" -ForegroundColor Green
}

Write-Host ""

# Configurar firewall
Write-Host "🔥 Configurando firewall..." -ForegroundColor Yellow

$firewallRule = Get-NetFirewallRule -DisplayName "PostgreSQL SIPARK" -ErrorAction SilentlyContinue

if (-not $firewallRule) {
    New-NetFirewallRule -DisplayName "PostgreSQL SIPARK" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow | Out-Null
    Write-Host "✅ Regla de firewall creada" -ForegroundColor Green
} else {
    Write-Host "✅ Regla de firewall ya existe" -ForegroundColor Green
}

Write-Host ""

# Reiniciar PostgreSQL
Write-Host "🔄 Reiniciando PostgreSQL..." -ForegroundColor Yellow

Restart-Service postgresql-x64-15 -ErrorAction SilentlyContinue

if ($?) {
    Write-Host "✅ PostgreSQL reiniciado" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se pudo reiniciar automáticamente. Reinicia manualmente desde Servicios" -ForegroundColor Yellow
}

Write-Host ""

# Obtener IP
Write-Host "📍 IP de este servidor:" -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"}).IPAddress
Write-Host "   $ip" -ForegroundColor Cyan
Write-Host ""

# Probar conexión
Write-Host "🧪 Probando conexión..." -ForegroundColor Yellow

$env:PGPASSWORD = $password
$testResult = & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U ludoteca_user -d ludoteca_pos -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ¡Conexión exitosa!" -ForegroundColor Green
} else {
    Write-Host "❌ Error en la conexión" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 IMPORTANTE:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Anota esta IP: $ip" -ForegroundColor White
Write-Host ""
Write-Host "2. En TODAS las PCs, edita el archivo db-config.json:" -ForegroundColor White
Write-Host "   {" -ForegroundColor Gray
Write-Host "     `"host`": `"$ip`"," -ForegroundColor Gray
Write-Host "     `"port`": 5432," -ForegroundColor Gray
Write-Host "     `"database`": `"ludoteca_pos`"," -ForegroundColor Gray
Write-Host "     `"user`": `"ludoteca_user`"," -ForegroundColor Gray
Write-Host "     `"password`": `"ludoteca2024`"" -ForegroundColor Gray
Write-Host "   }" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Si solo tienes UNA PC, usa `"localhost`" en lugar de la IP" -ForegroundColor White
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
