# 🚀 Instalación Rápida - Ludoteca POS

## Opción 1: Script Automático (Recomendado)

### Windows PowerShell

1. Abre PowerShell en la carpeta del proyecto
2. Ejecuta:
   ```powershell
   .\build-windows.ps1
   ```
3. Sigue las instrucciones en pantalla
4. El instalador se creará en la carpeta `release/`

**Nota:** Si PowerShell bloquea el script, ejecuta primero:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Opción 2: Comandos Manuales

### Paso 1: Instalar dependencias

```bash
npm install
```

### Paso 2: Compilar e instalar

```bash
npm run electron:build
```

### Paso 3: Instalar

El instalador estará en: `release/Ludoteca POS Setup 1.0.0.exe`

## ⚡ Compilación Rápida (Sin Instalador)

Para probar sin crear instalador:

```bash
npm run electron:build:dir
```

La aplicación estará en: `release/win-unpacked/Ludoteca POS.exe`

## 🔧 Requisitos

- Node.js 18+ (https://nodejs.org/)
- Python (para compilar módulos nativos)
- Visual Studio Build Tools (se instala automáticamente con `npm install --global windows-build-tools`)

## ❓ Problemas Comunes

### Error al instalar dependencias

```bash
npm install --global windows-build-tools
npm install --build-from-source
```

### Error con sqlite3 o bcrypt

```bash
npm rebuild sqlite3 --build-from-source
npm rebuild bcrypt --build-from-source
```

### La compilación tarda mucho

Es normal. La primera vez puede tardar 10-15 minutos.

## 📖 Documentación Completa

Para más detalles, consulta: [COMPILAR-WINDOWS.md](COMPILAR-WINDOWS.md)

## 🎯 Desarrollo

Para ejecutar en modo desarrollo:

```bash
npm run dev:electron
```

Esto inicia la aplicación con hot-reload para desarrollo.
