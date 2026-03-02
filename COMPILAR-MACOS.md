# 🍎 Guía para Compilar en macOS

## 🚀 Instalación Rápida

### Opción 1: Script Automático (Recomendado)

```bash
# Dar permisos de ejecución al script
chmod +x build-mac.sh

# Ejecutar el script
./build-mac.sh
```

### Opción 2: Comandos Manuales

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar para macOS
npm run electron:build:mac

# 3. El instalador estará en:
# release/Ludoteca POS-1.0.0.dmg
```

## 📋 Requisitos Previos

### 1. Node.js (versión 18 o superior)

```bash
# Verificar si está instalado
node --version

# Si no está instalado, descarga desde:
# https://nodejs.org/
# O instala con Homebrew:
brew install node
```

### 2. Xcode Command Line Tools

```bash
# Instalar
xcode-select --install

# Verificar instalación
xcode-select -p
```

### 3. Python (para compilar módulos nativos)

```bash
# Verificar si está instalado
python3 --version

# macOS ya incluye Python, pero si necesitas instalarlo:
brew install python3
```

## 🔨 Compilación

### Para Desarrollo (con hot-reload)

```bash
npm run dev:electron
```

### Para Producción

#### Crear instalador .dmg

```bash
npm run electron:build:mac
```

Esto genera:

- `release/Ludoteca POS-1.0.0.dmg` - Instalador para distribución
- `release/Ludoteca POS-1.0.0-arm64.dmg` - Para Mac con Apple Silicon (M1/M2/M3)
- `release/Ludoteca POS-1.0.0-x64.dmg` - Para Mac con Intel

#### Crear solo la aplicación .app (sin instalador)

```bash
npm run build && npx electron-builder --mac --dir
```

Esto genera:

- `release/mac/Ludoteca POS.app` - Aplicación lista para usar

## 📦 Instalación

### Instalar en tu Mac

1. Abre el archivo `.dmg` generado
2. Arrastra `Ludoteca POS.app` a la carpeta `Aplicaciones`
3. Abre la aplicación desde Launchpad o Aplicaciones

### Primera ejecución

Si macOS bloquea la aplicación por seguridad:

1. Ve a `Preferencias del Sistema` > `Seguridad y Privacidad`
2. Haz clic en "Abrir de todas formas"

O desde Terminal:

```bash
xattr -cr "/Applications/Ludoteca POS.app"
```

## 🔧 Solución de Problemas

### Error: "node-gyp" no encontrado

```bash
npm install -g node-gyp
npm install --build-from-source
```

### Error al compilar sqlite3

```bash
npm rebuild sqlite3 --build-from-source
```

### Error al compilar bcrypt

```bash
npm rebuild bcrypt --build-from-source
```

### Error: "xcode-select" no encontrado

```bash
xcode-select --install
```

### La aplicación no abre después de instalar

```bash
# Remover atributos de cuarentena
xattr -cr "/Applications/Ludoteca POS.app"

# O desde la carpeta del proyecto
xattr -cr "release/mac/Ludoteca POS.app"
```

### Error de permisos

```bash
# Dar permisos al script
chmod +x build-mac.sh

# Si hay problemas con node_modules
sudo chown -R $(whoami) node_modules
```

## 🎯 Compilar para Windows desde Mac

Puedes compilar para Windows desde macOS:

```bash
npm run electron:build
```

Esto requiere:

- Wine (para firmar el instalador): `brew install wine-stable`

## 📊 Tamaños Aproximados

- Instalador .dmg: ~150-200 MB
- Aplicación .app: ~180-220 MB
- Primera compilación: 10-15 minutos
- Compilaciones posteriores: 3-5 minutos

## 🗂️ Estructura de Archivos Generados

```
release/
├── Ludoteca POS-1.0.0.dmg          # Instalador universal
├── Ludoteca POS-1.0.0-arm64.dmg    # Para Apple Silicon
├── Ludoteca POS-1.0.0-x64.dmg      # Para Intel
└── mac/
    └── Ludoteca POS.app            # Aplicación sin empaquetar
```

## 🔐 Firma de Código (Opcional)

Para distribución profesional, firma la aplicación:

1. Obtén un certificado de desarrollador de Apple
2. Configura en `package.json`:

```json
"mac": {
  "identity": "Tu Nombre (XXXXXXXXXX)",
  "hardenedRuntime": true,
  "gatekeeperAssess": false,
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.plist"
}
```

3. Notariza la aplicación:

```bash
npx electron-builder --mac --publish never
xcrun notarytool submit "release/Ludoteca POS-1.0.0.dmg" \
  --apple-id "tu@email.com" \
  --password "app-specific-password" \
  --team-id "XXXXXXXXXX"
```

## 🌐 Compilación Universal (Intel + Apple Silicon)

Por defecto, el proyecto está configurado para crear builds universales que funcionan en ambas arquitecturas.

Para compilar solo para una arquitectura específica:

```bash
# Solo Apple Silicon (M1/M2/M3)
npx electron-builder --mac --arm64

# Solo Intel
npx electron-builder --mac --x64
```

## 📝 Comandos Útiles

```bash
# Ver versión de Node.js
node --version

# Ver versión de npm
npm --version

# Limpiar caché de npm
npm cache clean --force

# Reinstalar todas las dependencias
rm -rf node_modules package-lock.json
npm install

# Verificar errores de TypeScript
npm run type-check

# Compilar solo el frontend
npm run build

# Ver logs de compilación detallados
DEBUG=electron-builder npm run electron:build:mac
```

## 🗄️ Base de Datos

### SQLite (por defecto)

La base de datos se crea automáticamente en:

- Desarrollo: `./pos.db`
- Producción: `~/Library/Application Support/Ludoteca POS/pos.db`

### PostgreSQL (opcional)

Para usar PostgreSQL, crea `db-config.json`:

```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "ludoteca_pos",
  "user": "postgres",
  "password": "tu_password"
}
```

## 🆘 Soporte

Si encuentras problemas:

1. Verifica que Xcode Command Line Tools esté instalado
2. Asegúrate de tener Node.js 18 o superior
3. Revisa los logs de compilación
4. Intenta limpiar y reinstalar dependencias
5. Verifica permisos de archivos y carpetas

## 📚 Recursos Adicionales

- [Electron Builder - macOS](https://www.electron.build/configuration/mac)
- [Apple Developer - Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Node.js Downloads](https://nodejs.org/)
