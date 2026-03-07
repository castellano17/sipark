# 🚀 Compilar Instalador Completo de SIPARK para Windows

## ⚡ Inicio Rápido (2 comandos)

```powershell
# 1. Preparar PostgreSQL (solo primera vez)
.\prepare-windows-installer.ps1

# 2. Compilar instalador completo
.\build-windows-complete.ps1
```

**Resultado:** `release/SIPARK Setup 1.0.4.exe` (~200 MB)

---

## 📋 Requisitos

- Windows 10/11
- Node.js 18+
- PowerShell 5.1+
- Conexión a internet (solo para descargar PostgreSQL la primera vez)
- 2 GB de espacio libre

---

## 🎯 Proceso Completo

### Paso 1: Preparar PostgreSQL (Primera Vez)

```powershell
.\prepare-windows-installer.ps1
```

**¿Qué hace?**

- Descarga PostgreSQL 16.2 portable (~50 MB)
- Extrae solo los archivos necesarios
- Crea carpeta `postgresql-portable` (~150 MB)
- Copia scripts de instalación

**Tiempo:** ~5 minutos (depende de tu internet)

**Solo lo haces UNA VEZ.** PostgreSQL queda guardado localmente.

### Paso 2: Compilar Instalador

```powershell
.\build-windows-complete.ps1
```

**¿Qué hace?**

1. Instala dependencias npm
2. Compila frontend con Vite
3. Empaqueta con Electron Builder
4. Incluye PostgreSQL portable
5. Crea instalador NSIS

**Tiempo:** ~3-5 minutos

**Resultado:** `release/SIPARK Setup 1.0.4.exe` (~200 MB)

---

## 🔄 Compilaciones Posteriores

Si ya descargaste PostgreSQL, puedes compilar más rápido:

```powershell
# Compilación rápida (sin re-descargar PostgreSQL)
.\build-windows-complete.ps1 -SkipPostgres

# Solo recompilar app (sin crear instalador)
npm run build

# Solo crear instalador (sin recompilar app)
npm run build:win
```

---

## 📦 Contenido del Instalador

El archivo `.exe` resultante incluye:

```
SIPARK Setup 1.0.4.exe (200 MB)
├── Aplicación SIPARK (50 MB)
│   ├── Frontend React compilado
│   ├── Backend Electron
│   ├── Node.js embebido
│   └── Dependencias (pg, xlsx, etc.)
│
├── PostgreSQL 16.2 (150 MB)
│   ├── Binarios (postgres.exe, pg_ctl.exe, etc.)
│   ├── Librerías
│   └── Archivos de configuración
│
└── Scripts de Instalación
    ├── Inicialización de PostgreSQL
    └── Creación de base de datos
```

---

## ✅ Verificación

### Verificar que PostgreSQL está incluido

```powershell
# Verificar carpeta local
dir postgresql-portable\bin\postgres.exe

# Verificar en el build
dir release\win-unpacked\resources\postgresql\bin\postgres.exe
```

### Verificar tamaño del instalador

```powershell
dir release\*.exe
```

**Debe ser ~200 MB.** Si es mucho menos, PostgreSQL no está incluido.

---

## 🎁 Distribuir al Cliente

1. Sube `SIPARK Setup 1.0.4.exe` a tu servidor/drive
2. Comparte el link con el cliente
3. El cliente descarga y ejecuta
4. ¡Listo! No necesita hacer nada más

**El cliente NO necesita:**

- ❌ Instalar PostgreSQL
- ❌ Instalar Node.js
- ❌ Configurar nada
- ❌ Tener conocimientos técnicos

---

## 🐛 Solución de Problemas

### Error: "postgresql-portable not found"

```powershell
# Ejecutar primero
.\prepare-windows-installer.ps1
```

### El instalador es muy pequeño (<100 MB)

PostgreSQL no está incluido. Verificar:

```powershell
# Debe existir
dir postgresql-portable\

# Recompilar
npm run build:win
```

### Error al descargar PostgreSQL

Descargar manualmente desde:
https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64-binaries.zip

Guardar como `postgresql-portable.zip` y ejecutar el script.

### Error de permisos

Ejecutar PowerShell como Administrador:

```powershell
# Permitir ejecución de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📊 Tiempos Estimados

| Tarea               | Primera Vez | Posteriores     |
| ------------------- | ----------- | --------------- |
| Preparar PostgreSQL | 5 min       | 0 min (ya está) |
| Compilar aplicación | 3 min       | 3 min           |
| Crear instalador    | 2 min       | 2 min           |
| **Total**           | **~10 min** | **~5 min**      |

---

## 🎓 Comandos de Referencia

```powershell
# Preparar PostgreSQL (primera vez)
.\prepare-windows-installer.ps1

# Compilar todo
.\build-windows-complete.ps1

# Compilar sin PostgreSQL (más rápido)
.\build-windows-complete.ps1 -SkipPostgres

# Solo compilar app
npm run build

# Solo crear instalador
npm run build:win

# Limpiar y recompilar
Remove-Item -Recurse -Force dist, release
npm run build:win
```

---

## 📝 Notas

1. **PostgreSQL se descarga UNA VEZ** - Queda guardado en `postgresql-portable/`
2. **El instalador incluye TODO** - Cliente no descarga nada
3. **Tamaño final: ~200 MB** - Normal para incluir PostgreSQL
4. **Instalación automática** - PostgreSQL se configura solo
5. **Primera ejecución** - Base de datos se crea automáticamente

---

## 🆘 Ayuda

Si tienes problemas:

1. Verificar que `postgresql-portable/` existe
2. Verificar que `dist/` existe (después de `npm run build`)
3. Revisar logs en la consola
4. Ejecutar como Administrador
5. Verificar espacio en disco (necesitas ~2 GB)

---

**¡Listo para compilar!** 🎉

Ejecuta:

```powershell
.\prepare-windows-installer.ps1
.\build-windows-complete.ps1
```

Y tendrás tu instalador completo en `release/SIPARK Setup 1.0.4.exe`
