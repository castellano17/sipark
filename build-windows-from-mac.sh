#!/bin/bash

# Script para compilar instalador de Windows desde macOS
# Ejecutar con: ./build-windows-from-mac.sh

echo "========================================"
echo "  Compilar para Windows desde macOS"
echo "========================================"
echo ""

# Verificar Node.js
echo "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js instalado: $NODE_VERSION"
else
    echo "✗ Error: Node.js no está instalado"
    echo "Instala con: brew install node"
    exit 1
fi

echo ""
echo "========================================"
echo "  Paso 1: Limpiando compilaciones previas"
echo "========================================"
echo ""

echo "Limpiando carpetas de compilación..."
rm -rf release dist

echo ""
echo "========================================"
echo "  Paso 2: Instalando dependencias"
echo "========================================"
echo ""

echo "Instalando/actualizando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "✗ Error al instalar dependencias"
    exit 1
fi

echo ""
echo "========================================"
echo "  Paso 3: Compilando React"
echo "========================================"
echo ""

echo "Compilando aplicación React..."
npm run build

if [ $? -ne 0 ]; then
    echo "✗ Error al compilar la aplicación"
    exit 1
fi

echo ""
echo "========================================"
echo "  Paso 4: Empaquetando para Windows"
echo "========================================"
echo ""

echo "Creando instalador de Windows..."
echo "⚠️  NOTA: Los módulos nativos se compilarán en Windows al instalar"
echo ""

# Compilar para Windows desde Mac
# Los módulos nativos (better-sqlite3, bcrypt) se empaquetarán sin compilar
# y se recompilarán automáticamente en Windows durante la instalación
npx electron-builder --win --x64 --config electron-builder-win.json

if [ $? -ne 0 ]; then
    echo ""
    echo "✗ Error durante la compilación"
    echo ""
    echo "Posibles soluciones:"
    echo "1. Verifica que todas las dependencias estén instaladas"
    echo "2. Intenta: npm cache clean --force && npm install"
    echo "3. Revisa los logs arriba para errores específicos"
    exit 1
fi

echo ""
echo "========================================"
echo "  ✓ Compilación exitosa"
echo "========================================"
echo ""

# Mostrar archivos generados
if [ -d "release" ]; then
    echo "Instalador de Windows generado:"
    echo ""
    
    find release -name "*.exe" | while read -r file; do
        SIZE=$(du -h "$file" | cut -f1)
        echo "  📦 $(basename "$file") ($SIZE)"
        echo "     $file"
    done
    
    echo ""
    echo "========================================"
    echo "  ⚠️  IMPORTANTE"
    echo "========================================"
    echo ""
    echo "Este instalador fue compilado desde Mac."
    echo "Los módulos nativos (better-sqlite3, bcrypt) necesitan"
    echo "ser recompilados en Windows."
    echo ""
    echo "Al instalar en Windows, el usuario debe:"
    echo "1. Tener Visual Studio Build Tools instalado"
    echo "2. Tener Python instalado"
    echo "3. Ejecutar el instalador como administrador"
    echo ""
    echo "Si hay errores al iniciar la app en Windows:"
    echo "1. Abrir PowerShell como administrador"
    echo "2. Navegar a: C:\\Program Files\\Ludoteca POS\\resources\\app"
    echo "3. Ejecutar: npm rebuild better-sqlite3 --build-from-source"
    echo "4. Ejecutar: npm rebuild bcrypt --build-from-source"
    echo ""
    echo "========================================"
    echo "  Transferir a Windows"
    echo "========================================"
    echo ""
    echo "Puedes transferir el archivo .exe por:"
    echo "- USB"
    echo "- Email"
    echo "- Dropbox/Google Drive"
    echo "- Red local"
    echo ""
    
    read -p "¿Abrir carpeta de release? (s/n) " OPEN_FOLDER
    if [ "$OPEN_FOLDER" = "s" ] || [ "$OPEN_FOLDER" = "S" ]; then
        open release
    fi
else
    echo "⚠ No se encontró la carpeta 'release'"
fi

echo ""
