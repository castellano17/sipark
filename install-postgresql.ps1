# Script de configuración de PostgreSQL para Ludoteca POS (Windows)
# Ejecutar como Administrador en PowerShell

Write-Host "🚀 Configuración de PostgreSQL para Ludoteca POS" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "   Click derecho en PowerShell -> Ejecutar como Administrador" -ForegroundColor Yellow
    pause
    exit
}

# Obtener IP del servidor
$ServerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object -First 1).IPAddress
Write-Host "📡 IP del servidor detectada: $ServerIP" -ForegroundColor Cyan
Write-Host ""

# Verificar si PostgreSQL está instalado
$pgPath = "C:\Program Files\PostgreSQL"
if (-not (Test-Path $pgPath)) {
    Write-Host "❌ PostgreSQL no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instala PostgreSQL primero:" -ForegroundColor Yellow
    Write-Host "1. Descargar de: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Ejecutar el instalador" -ForegroundColor Yellow
    Write-Host "3. Anotar el password del usuario 'postgres'" -ForegroundColor Yellow
    Write-Host "4. Volver a ejecutar este script" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

# Detectar versión de PostgreSQL
$pgVersion = Get-ChildItem $pgPath | Select-Object -First 1 -ExpandProperty Name
$pgBin = "$pgPath\$pgVersion\bin"
$pgData = "$pgPath\$pgVersion\data"

Write-Host "✅ PostgreSQL $pgVersion encontrado" -ForegroundColor Green
Write-Host ""

# Solicitar datos
$dbName = Read-Host "Nombre de la base de datos [ludoteca_pos]"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "ludoteca_pos" }

$dbUser = Read-Host "Usuario de la base de datos [ludoteca_user]"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "ludoteca_user" }

$dbPassword = Read-Host "Password para el usuario" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

if ([string]::IsNullOrWhiteSpace($dbPasswordPlain)) {
    # Generar password aleatorio
    $dbPasswordPlain = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 12 | ForEach-Object {[char]$_})
    Write-Host "🔐 Password generado: $dbPasswordPlain" -ForegroundColor Yellow
}

$networkRange = Read-Host "Rango de red local [192.168.1.0/24]"
if ([string]::IsNullOrWhiteSpace($networkRange)) { $networkRange = "192.168.1.0/24" }

Write-Host ""
Write-Host "📋 Configuración:" -ForegroundColor Cyan
Write-Host "  - Base de datos: $dbName"
Write-Host "  - Usuario: $dbUser"
Write-Host "  - Password: $dbPasswordPlain"
Write-Host "  - Red permitida: $networkRange"
Write-Host ""
$confirm = Read-Host "¿Continuar? (s/n)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Configuración cancelada" -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "🔧 Configurando PostgreSQL..." -ForegroundColor Cyan

# Backup de archivos
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "$pgData\postgresql.conf" "$pgData\postgresql.conf.backup_$timestamp"
Copy-Item "$pgData\pg_hba.conf" "$pgData\pg_hba.conf.backup_$timestamp"

# Configurar listen_addresses
$postgresqlConf = Get-Content "$pgData\postgresql.conf"
$postgresqlConf = $postgresqlConf -replace "#listen_addresses = 'localhost'", "listen_addresses = '*'"
$postgresqlConf | Set-Content "$pgData\postgresql.conf"

# Agregar regla de acceso remoto
Add-Content "$pgData\pg_hba.conf" "`n# Ludoteca POS - Acceso desde red local"
Add-Content "$pgData\pg_hba.conf" "host    all             all             $networkRange            md5"

Write-Host ""
Write-Host "🗄️ Creando base de datos y usuario..." -ForegroundColor Cyan

# Crear script SQL temporal
$sqlScript = @"
CREATE DATABASE $dbName;
CREATE USER $dbUser WITH PASSWORD '$dbPasswordPlain';
GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;
\c $dbName
GRANT ALL ON SCHEMA public TO $dbUser;
"@

$sqlScript | Out-File -FilePath "$env:TEMP\ludoteca_setup.sql" -Encoding UTF8

# Ejecutar script SQL
$env:PGPASSWORD = Read-Host "Ingresa el password del usuario 'postgres'" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD))
$env:PGPASSWORD = $pgPasswordPlain

& "$pgBin\psql.exe" -U postgres -f "$env:TEMP\ludoteca_setup.sql"

Remove-Item "$env:TEMP\ludoteca_setup.sql"

Write-Host ""
Write-Host "🔥 Configurando firewall..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "PostgreSQL Ludoteca POS" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow | Out-Null

Write-Host ""
Write-Host "🔄 Reiniciando servicio PostgreSQL..." -ForegroundColor Cyan
Restart-Service -Name "postgresql-x64-$pgVersion"

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Información importante:" -ForegroundColor Cyan
Write-Host "=========================="
Write-Host ""
Write-Host "IP del servidor: $ServerIP"
Write-Host "Puerto: 5432"
Write-Host "Base de datos: $dbName"
Write-Host "Usuario: $dbUser"
Write-Host "Password: $dbPasswordPlain"
Write-Host ""
Write-Host "🔧 Próximos pasos:" -ForegroundColor Cyan
Write-Host "=================="
Write-Host ""
Write-Host "1. En cada computadora cliente, crear el archivo db-config.json:"
Write-Host ""
Write-Host "   {"
Write-Host "     `"host`": `"$ServerIP`","
Write-Host "     `"port`": 5432,"
Write-Host "     `"database`": `"$dbName`","
Write-Host "     `"user`": `"$dbUser`","
Write-Host "     `"password`": `"$dbPasswordPlain`""
Write-Host "   }"
Write-Host ""
Write-Host "2. Instalar dependencia: npm install pg"
Write-Host ""
Write-Host "3. Modificar electron-main.ts para usar database-pg.cjs"
Write-Host ""
Write-Host "4. Ejecutar: npm run dev"
Write-Host ""
Write-Host "🧪 Probar conexión desde cliente:" -ForegroundColor Cyan
Write-Host "================================="
Write-Host ""
Write-Host "   psql -U $dbUser -d $dbName -h $ServerIP"
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Guarda esta información en un lugar seguro!" -ForegroundColor Yellow
Write-Host ""

# Guardar configuración en archivo
$configFile = "$env:USERPROFILE\Desktop\ludoteca-db-config.txt"
@"
Configuración de PostgreSQL - Ludoteca POS
==========================================

Fecha: $(Get-Date)
IP del servidor: $ServerIP
Puerto: 5432
Base de datos: $dbName
Usuario: $dbUser
Password: $dbPasswordPlain
Red permitida: $networkRange

Archivos de configuración:
- postgresql.conf: $pgData\postgresql.conf
- pg_hba.conf: $pgData\pg_hba.conf

Backups:
- $pgData\postgresql.conf.backup_$timestamp
- $pgData\pg_hba.conf.backup_$timestamp
"@ | Out-File -FilePath $configFile

Write-Host "💾 Configuración guardada en: $configFile" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 ¡Listo! PostgreSQL está configurado y listo para usar." -ForegroundColor Green
Write-Host ""
pause
