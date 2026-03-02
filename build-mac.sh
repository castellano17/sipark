#!/bin/bash

# Script de compilación para macOS
# Ejecutar con: ./build-mac.sh

echo "========================================"
echo "  Compilador Ludoteca POS - macOS"
echo "========================================"
echo ""

# Verificar Node.js
echo "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js instalado: $NODE_VERSION"
else
    echo "✗ Error: Node.js no está instalado"
    echo "Descarga Node.js desde: https://nodejs.org/"
    exit 1
fi

# Verificar npm
echo "Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm instalado: $NPM_VERSION"
else
    echo "✗ Error: npm no está disponible"
    exit 1
fi

echo ""
echo "========================================"
echo "  Paso 1: Instalando dependencias"
echo "========================================"
echo ""

# Verificar si node_modules existe
if [ -d "node_modules" ]; then
    echo "Dependencias ya instaladas. ¿Reinstalar? (s/n)"
    read -r REINSTALL
    if [ "$REINSTALL" = "s" ] || [ "$REINSTALL" = "S" ]; then
        echo "Eliminando node_modules..."
        rm -rf node_modules package-lock.json
        
        echo "Instalando dependencias..."
        npm install
        if [ $? -ne 0 ]; then
            echo "✗ Error al instalar dependencias"
            exit 1
        fi
    fi
else
    echo "Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "✗ Error al instalar dependencias"
        exit 1
    fi
fi

echo "✓ Dependencias instaladas correctamente"
echo ""

echo "========================================"
echo "  Paso 2: Verificando TypeScript"
echo "========================================"
echo ""

echo "Verificando errores de TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠ Advertencia: Hay errores de TypeScript"
    echo "¿Continuar de todos modos? (s/n)"
    read -r CONTINUE
    if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
        echo "Compilación cancelada"
        exit 1
    fi
fi

echo ""
echo "========================================"
echo "  Paso 3: Compilando aplicación"
echo "========================================"
echo ""

echo "Selecciona el tipo de compilación:"
echo "1. Aplicación .app para macOS"
echo "2. Instalador .dmg"
echo "3. Carpeta portable (sin instalador)"
echo "4. Todas las opciones"
echo ""
read -p "Opción (1-4): " BUILD_TYPE

case $BUILD_TYPE in
    1)
        echo ""
        echo "Creando aplicación .app..."
        npm run build && npx electron-builder --mac --dir
        ;;
    2)
        echo ""
        echo "Creando instalador .dmg..."
        npm run build && npx electron-builder --mac
        ;;
    3)
        echo ""
        echo "Creando versión portable..."
        npm run build && npx electron-builder --mac --dir
        ;;
    4)
        echo ""
        echo "Creando todas las versiones..."
        npm run build && npx electron-builder --mac
        ;;
    *)
        echo "Opción inválida. Creando instalador .dmg por defecto..."
        npm run build && npx electron-builder --mac
        ;;
esac

if [ $? -ne 0 ]; then
    echo ""
    echo "✗ Error durante la compilación"
    echo ""
    echo "Posibles soluciones:"
    echo "1. Ejecuta: npm rebuild sqlite3 --build-from-source"
    echo "2. Ejecuta: npm rebuild bcrypt --build-from-source"
    echo "3. Instala Xcode Command Line Tools: xcode-select --install"
    exit 1
fi

echo ""
echo "========================================"
echo "  ✓ Compilación exitosa"
echo "========================================"
echo ""

# Mostrar ubicación de los archivos
if [ -d "release" ]; then
    echo "Archivos generados en:"
    echo ""
    
    find release -name "*.dmg" -o -name "*.app" | while read -r file; do
        SIZE=$(du -h "$file" | cut -f1)
        echo "  📦 $(basename "$file") ($SIZE)"
        echo "     $file"
    done
    
    echo ""
    echo "========================================"
    echo "  Siguiente paso"
    echo "========================================"
    echo ""
    echo "Para instalar:"
    echo "1. Ve a la carpeta 'release'"
    echo "2. Abre el archivo .dmg"
    echo "3. Arrastra la aplicación a la carpeta Aplicaciones"
    echo ""
    read -p "¿Abrir carpeta de release? (s/n) " OPEN_FOLDER
    if [ "$OPEN_FOLDER" = "s" ] || [ "$OPEN_FOLDER" = "S" ]; then
        open release
    fi
else
    echo "⚠ No se encontró la carpeta 'release'"
fi

echo ""
echo "Presiona Enter para salir..."
read
