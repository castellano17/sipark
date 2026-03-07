# Script para configurar PostgreSQL en Windows
# Ejecutar como Administrador

Write-Host "=== Configuración de PostgreSQL para SIPARK ===" -ForegroundColor Cyan
Write-Host ""

# Buscar la instalación de PostgreSQL
$pgPaths = @(
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files (x86)\PostgreSQL\15\bin",
    "C:\Program Files (x86)\PostgreSQL\16\bin"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path "$path\psql.exe") {
        $psqlPath = "$path\psql.exe"
        Write-Host "✓ PostgreSQL encontrado en: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "✗ PostgreSQL no encontrado. Por favor instálalo primero." -ForegroundColor Red
    Write-Host "  Ejecuta: .\install-postgresql-windows.ps1" -ForegroundColor Yellow
    exit 1
}

# Solicitar contraseña del usuario postgres
Write-Host ""
Write-Host "Ingresa la contraseña del usuario 'postgres' que configuraste al instalar PostgreSQL:" -ForegroundColor Yellow
$postgresPassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Crear archivo temporal con los comandos SQL
$sqlCommands = @"
-- Crear base de datos
CREATE DATABASE ludoteca_pos;

-- Crear usuario
CREATE USER ludoteca_user WITH PASSWORD 'ludoteca2024';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;

-- Conectar a la base de datos
\c ludoteca_pos

-- Dar permisos en el schema public
GRANT ALL ON SCHEMA public TO ludoteca_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ludoteca_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ludoteca_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ludoteca_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ludoteca_user;
"@

$tempSqlFile = "$env:TEMP\setup_sipark_db.sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host ""
Write-Host "Configurando base de datos..." -ForegroundColor Cyan

# Ejecutar comandos SQL
$env:PGPASSWORD = $plainPassword
& $psqlPath -U postgres -f $tempSqlFile 2>&1 | ForEach-Object {
    if ($_ -match "ERROR") {
        if ($_ -match "already exists") {
            Write-Host "⚠ Base de datos o usuario ya existe (esto es normal si ya lo configuraste antes)" -ForegroundColor Yellow
        } else {
            Write-Host "✗ Error: $_" -ForegroundColor Red
        }
    } elseif ($_ -match "CREATE|GRANT") {
        Write-Host "✓ $_" -ForegroundColor Green
    }
}

# Limpiar
Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "Verificando conexión..." -ForegroundColor Cyan

# Verificar que la base de datos funcione
$env:PGPASSWORD = "ludoteca2024"
$testResult = & $psqlPath -U ludoteca_user -d ludoteca_pos -c "SELECT 1;" 2>&1

if ($testResult -match "1 row") {
    Write-Host "✓ ¡Base de datos configurada correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credenciales de la base de datos:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Puerto: 5432" -ForegroundColor White
    Write-Host "  Base de datos: ludoteca_pos" -ForegroundColor White
    Write-Host "  Usuario: ludoteca_user" -ForegroundColor White
    Write-Host "  Contraseña: ludoteca2024" -ForegroundColor White
    Write-Host ""
    Write-Host "Siguiente paso: Crear el archivo db-config.json" -ForegroundColor Yellow
} else {
    Write-Host "✗ Error al verificar la conexión" -ForegroundColor Red
    Write-Host $testResult
}

$env:PGPASSWORD = $null

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
