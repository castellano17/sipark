# Instalador Todo Incluido - Sin Descargas para el Cliente

## 🎯 Objetivo

Crear un instalador `.exe` de ~200 MB que incluya:

- ✅ Aplicación SIPARK completa
- ✅ Node.js embebido (incluido por Electron)
- ✅ PostgreSQL 16.2 portable
- ✅ Todas las dependencias

**El cliente solo ejecuta el .exe y listo. NO descarga nada.**

---

## 👨‍💻 Para el Desarrollador (TÚ)

### Paso 1: Preparar PostgreSQL (UNA SOLA VEZ)

```powershell
.\prepare-windows-installer.ps1
```

Esto descarga PostgreSQL y lo prepara para incluir en el instalador.
**Solo lo haces TÚ una vez. El cliente NO hace esto.**

### Paso 2: Compilar Todo

```powershell
.\build-windows-complete.ps1
```

O manualmente:

```powershell
npm install
npm run build
npm run build:win
```

### Resultado

Se crea: `release/SIPARK Setup 1.0.4.exe` (~200 MB)

Este archivo incluye TODO:

- Aplicación
- Node.js
- PostgreSQL
- Scripts de configuración

---

## 👤 Para el Cliente (Usuario Final)

### Instalación

1. **Descargar** `SIPARK Setup 1.0.4.exe` (200 MB)
2. **Ejecutar** el instalador
3. **Siguiente, Siguiente, Instalar**
4. **Listo!**

### ¿Qué hace el instalador automáticamente?

1. ✅ Copia archivos a `C:\Program Files\SIPARK\`
2. ✅ Inicializa PostgreSQL
3. ✅ Crea la base de datos `ludoteca_pos`
4. ✅ Crea el usuario `ludoteca_user`
5. ✅ Configura todo automáticamente
6. ✅ Crea accesos directos

### Primera Ejecución

Al abrir SIPARK:

1. ✅ PostgreSQL se inicia automáticamente
2. ✅ Se crean las tablas
3. ✅ Se insertan datos iniciales
4. ✅ Listo para usar

**El usuario NO necesita:**

- ❌ Instalar PostgreSQL
- ❌ Instalar Node.js
- ❌ Configurar nada
- ❌ Descargar nada adicional
- ❌ Tener internet

---

## 📦 Contenido del Instalador

```
SIPARK Setup 1.0.4.exe (200 MB)
│
├── Aplicación SIPARK (50 MB)
│   ├── Electron + React compilado
│   ├── Node.js embebido
│   └── Dependencias (pg, xlsx, etc.)
│
├── PostgreSQL 16.2 Portable (150 MB)
│   ├── bin/ (postgres.exe, pg_ctl.exe, etc.)
│   ├── lib/ (librerías)
│   └── share/ (archivos de configuración)
│
└── Scripts de Configuración
    ├── install-postgres-portable.ps1
    └── setup-database.ps1
```

---

## 🔧 Proceso de Instalación Automática

### Durante la Instalación

```
1. Usuario ejecuta SIPARK Setup.exe
   ↓
2. Instalador copia archivos a C:\Program Files\SIPARK\
   ↓
3. Ejecuta install-postgres-portable.ps1
   - Inicializa cluster de PostgreSQL
   - Configura postgresql.conf
   - Configura pg_hba.conf
   ↓
4. Ejecuta setup-database.ps1
   - Inicia servidor PostgreSQL
   - Crea usuario ludoteca_user
   - Crea base de datos ludoteca_pos
   - Otorga permisos
   ↓
5. Crea accesos directos
   ↓
6. ✅ Instalación completa
```

### Primera Ejecución de SIPARK

```
1. Usuario abre SIPARK
   ↓
2. postgres-manager.cjs detecta PostgreSQL embebido
   ↓
3. Inicia PostgreSQL automáticamente
   ↓
4. database-pg.cjs conecta a la base de datos
   ↓
5. Crea todas las tablas (si no existen)
   ↓
6. seed.cjs inserta datos iniciales
   ↓
7. ✅ Aplicación lista para usar
```

---

## 📁 Estructura en el Cliente

```
C:\Program Files\SIPARK\
│
├── SIPARK.exe                    # Aplicación principal
├── resources\
│   ├── app.asar                  # Código empaquetado
│   ├── app.asar.unpacked\
│   │   ├── node_modules\         # Dependencias
│   │   ├── src-electron\         # Backend
│   │   └── db-config.json        # Config de BD
│   │
│   ├── postgresql\               # PostgreSQL embebido
│   │   ├── bin\
│   │   │   ├── postgres.exe      # Servidor
│   │   │   ├── pg_ctl.exe        # Control
│   │   │   ├── psql.exe          # Cliente
│   │   │   └── initdb.exe        # Inicialización
│   │   ├── lib\                  # Librerías
│   │   ├── share\                # Archivos compartidos
│   │   └── data\                 # DATOS DE POSTGRESQL
│   │       ├── base\             # Bases de datos
│   │       ├── global\           # Datos globales
│   │       ├── pg_wal\           # Write-Ahead Log
│   │       ├── postgresql.conf   # Configuración
│   │       ├── pg_hba.conf       # Autenticación
│   │       └── log\              # Logs
│   │
│   └── installer-scripts\
│       ├── install-postgres-portable.ps1
│       └── setup-database.ps1
│
├── locales\                      # Electron locales
├── swiftshader\                  # Renderizado
└── uninstall.exe                 # Desinstalador
```

---

## ✅ Ventajas de Esta Solución

### Para el Cliente

- 🚀 **Instalación en 2 minutos** - Solo ejecutar el .exe
- 💾 **Sin internet necesario** - Todo incluido
- 🔧 **Cero configuración** - Todo automático
- 🎯 **Funciona de inmediato** - Abrir y usar
- 🔒 **Aislado** - No afecta otras instalaciones de PostgreSQL

### Para Ti (Desarrollador)

- 😊 **Menos soporte** - Sin problemas de configuración
- 📦 **Un solo archivo** - Fácil de distribuir
- 🎯 **Consistente** - Misma versión para todos
- 🔄 **Actualizaciones fáciles** - Reemplazar el .exe

---

## 🚀 Comandos Rápidos

### Compilar Instalador Completo

```powershell
# Primera vez (descargar PostgreSQL)
.\prepare-windows-installer.ps1

# Compilar instalador
.\build-windows-complete.ps1
```

### Compilación Rápida (PostgreSQL ya descargado)

```powershell
.\build-windows-complete.ps1 -SkipPostgres
```

### Solo Crear Instalador (sin recompilar app)

```powershell
npm run build:win
```

---

## 📊 Tamaños

| Componente                 | Tamaño      |
| -------------------------- | ----------- |
| Aplicación SIPARK          | ~50 MB      |
| PostgreSQL Portable        | ~150 MB     |
| **Instalador Total**       | **~200 MB** |
| Instalado en disco         | ~250 MB     |
| Con datos (después de uso) | ~300-500 MB |

---

## 🔍 Verificación

### Verificar que PostgreSQL está incluido

```powershell
# Antes de compilar
dir postgresql-portable\bin\postgres.exe

# Después de compilar
dir release\win-unpacked\resources\postgresql\bin\postgres.exe
```

### Verificar tamaño del instalador

```powershell
dir release\*.exe
```

Debe ser ~200 MB. Si es mucho menos, PostgreSQL no está incluido.

---

## 🐛 Solución de Problemas

### El instalador es muy pequeño (<100 MB)

**Problema:** PostgreSQL no está incluido
**Solución:**

```powershell
.\prepare-windows-installer.ps1
npm run build:win
```

### Error al compilar: "postgresql-portable not found"

**Problema:** No ejecutaste prepare-windows-installer.ps1
**Solución:**

```powershell
.\prepare-windows-installer.ps1
```

### El cliente dice "PostgreSQL no está instalado"

**Problema:** Los archivos no se copiaron correctamente
**Solución:** Verificar `extraResources` en package.json

---

## 📝 Notas Importantes

1. **PostgreSQL se descarga UNA VEZ** por el desarrollador
2. **El instalador incluye TODO** - Cliente no descarga nada
3. **Node.js viene con Electron** - No se instala por separado
4. **PostgreSQL es portable** - No se instala como servicio (opcional)
5. **Datos se guardan en** `C:\Program Files\SIPARK\resources\postgresql\data\`

---

## 🎓 Resumen

**Desarrollador:**

1. Ejecuta `prepare-windows-installer.ps1` (una vez)
2. Ejecuta `build-windows-complete.ps1`
3. Distribuye `SIPARK Setup.exe` (200 MB)

**Cliente:**

1. Descarga `SIPARK Setup.exe`
2. Ejecuta el instalador
3. Abre SIPARK
4. ¡Listo!

**Sin internet, sin configuración, sin problemas.**

---

**Última actualización:** Marzo 2026
**Versión:** 1.0.4
