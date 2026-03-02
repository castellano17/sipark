# 🍎 ➡️ 🪟 Compilar para Windows desde macOS

## 🚀 Método Rápido (Recomendado)

```bash
# 1. Dar permisos al script
chmod +x build-windows-from-mac.sh

# 2. Ejecutar
./build-windows-from-mac.sh
```

El instalador de Windows se generará en: `release/Ludoteca POS Setup 1.0.0.exe`

## 📋 Requisitos en tu Mac

1. **Node.js 18+**

   ```bash
   # Verificar
   node --version

   # Instalar si no lo tienes
   brew install node
   ```

2. **Wine (Opcional pero recomendado)**
   ```bash
   # Para firmar el instalador de Windows
   brew install --cask wine-stable
   ```

## 🔨 Compilación Manual

Si prefieres hacerlo paso a paso:

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar la aplicación
npm run build

# 3. Crear instalador de Windows
npx electron-builder --win --x64
```

## 📦 Resultado

Después de compilar, encontrarás en la carpeta `release/`:

- `Ludoteca POS Setup 1.0.0.exe` - Instalador para Windows (150-200 MB)

## 🚚 Transferir a Windows

### Opción 1: USB

1. Copia el archivo `.exe` a una memoria USB
2. Conecta la USB a la PC con Windows
3. Copia el archivo y ejecútalo

### Opción 2: Nube

```bash
# Subir a Dropbox, Google Drive, OneDrive, etc.
# Luego descarga desde Windows
```

### Opción 3: Red Local

```bash
# Si tu Mac y la PC Windows están en la misma red
# Comparte la carpeta 'release' desde tu Mac
```

### Opción 4: Email

```bash
# Si el archivo no es muy grande
# Envíalo por email a ti mismo
```

## ⚠️ Notas Importantes

### Cross-Compilation

Estás compilando para Windows desde macOS. Esto significa:

✅ **Funciona bien:**

- Crear el instalador .exe
- Empaquetar la aplicación
- Incluir todas las dependencias

⚠️ **Limitaciones:**

- No puedes probar el instalador en tu Mac
- Algunos módulos nativos pueden dar warnings (es normal)
- La firma digital requiere Wine

### 🔴 CRÍTICO: Módulos Nativos

Los módulos nativos (`better-sqlite3`, `bcrypt`) NO se pueden compilar para Windows desde Mac.

**Solución:** El instalador los incluye sin compilar. Al instalar en Windows:

1. El usuario DEBE tener instalado:
   - Visual Studio Build Tools
   - Python
2. Después de instalar, abrir PowerShell como administrador y ejecutar:
   ```powershell
   cd "C:\Program Files\Ludoteca POS\resources\app"
   npm rebuild better-sqlite3 --build-from-source
   npm rebuild bcrypt --build-from-source
   ```

**Alternativa:** Compilar directamente en Windows usando `build-windows-fixed.ps1`

## 🧪 Probar el Instalador

Para probar el instalador necesitas:

1. **Una PC con Windows** (física o virtual)
2. **Máquina Virtual** en tu Mac:
   - Parallels Desktop
   - VMware Fusion
   - VirtualBox (gratis)

### Instalar VirtualBox (Gratis)

```bash
# Instalar VirtualBox
brew install --cask virtualbox

# Descargar Windows 10/11 desde:
# https://www.microsoft.com/software-download/windows10
```

## 🔧 Solución de Problemas

### Error: "Cannot find module 'electron-builder'"

```bash
npm install --save-dev electron-builder
```

### Error: "wine: command not found"

```bash
# Wine es opcional, pero si lo necesitas:
brew install --cask wine-stable
```

### Error al compilar módulos nativos

```bash
# Es normal en cross-compilation
# El instalador funcionará en Windows
# Si quieres evitar los warnings:
npm install --ignore-scripts
npm run build
npx electron-builder --win --x64
```

### El instalador es muy grande

Es normal. Electron incluye:

- Chromium (~100 MB)
- Node.js (~30 MB)
- Tu aplicación (~20-50 MB)

### Compilación muy lenta

La primera vez tarda 10-15 minutos porque:

- Descarga dependencias de Windows
- Compila módulos nativos
- Crea el instalador NSIS

Compilaciones posteriores: 3-5 minutos

## 📊 Tiempo Estimado

- Primera compilación: **10-15 minutos**
- Compilaciones posteriores: **3-5 minutos**
- Tamaño del instalador: **150-200 MB**

## 🎯 Comandos Útiles

```bash
# Compilar solo para Windows 64-bit
npm run electron:build

# Compilar sin crear instalador (más rápido)
npx electron-builder --win --x64 --dir

# Ver logs detallados
DEBUG=electron-builder npm run electron:build

# Limpiar y recompilar
rm -rf release dist node_modules
npm install
npm run electron:build
```

## 🔄 Actualizar Versión

Para crear una nueva versión:

1. Edita `package.json`:

   ```json
   "version": "1.0.1"
   ```

2. Recompila:

   ```bash
   ./build-windows-from-mac.sh
   ```

3. El nuevo instalador será: `Ludoteca POS Setup 1.0.1.exe`

## 📝 Checklist Antes de Distribuir

- [ ] Probaste el instalador en Windows
- [ ] La aplicación abre correctamente
- [ ] La base de datos se crea automáticamente
- [ ] Todas las funciones principales funcionan
- [ ] No hay errores en la consola
- [ ] El instalador incluye todos los archivos necesarios

## 🆘 Soporte

Si el instalador no funciona en Windows:

1. **Verifica la versión de Windows**: Windows 10/11 (64-bit)
2. **Antivirus**: Puede bloquear la instalación
3. **Permisos**: Ejecuta como administrador
4. **Logs**: Revisa en `%APPDATA%\Ludoteca POS\logs\`

## 🎉 ¡Listo!

Una vez que tengas el archivo `.exe`, simplemente:

1. Cópialo a la PC con Windows
2. Doble clic para instalar
3. Sigue el asistente
4. ¡Disfruta tu aplicación!
