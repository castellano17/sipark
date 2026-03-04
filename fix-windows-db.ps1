# Script para arreglar la base de datos en Windows
Write-Host "🔧 Arreglando base de datos..." -ForegroundColor Yellow

# Cerrar la aplicación si está abierta
Get-Process "Ludoteca POS" -ErrorAction SilentlyContinue | Stop-Process -Force

# Borrar la base de datos
$dbPath = "$env:APPDATA\ludoteca-pos\sipark.db"
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
    Write-Host "✅ Base de datos eliminada" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No se encontró base de datos" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Ahora abre la aplicación. Se creará una base de datos nueva." -ForegroundColor Green
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
