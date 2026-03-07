# Guía Completa: Instalador de Windows con PostgreSQL Embebido

Esta guía explica cómo crear un instalador de Windows que incluye PostgreSQL embebido, eliminando la necesidad de instalaciones manuales.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- PowerShell 5.1+ (incluido en Windows 10/11)
- Conexión a Internet (para descargar PostgreSQL)
- 2 GB de espacio libre en disco

## 🚀 Pasos para Crear el Instalador

### 1. Preparar PostgreSQL Portable

Ejecuta el script para descargar y preparar PostgreSQL:

```powershell
.\prepare-windows-installer.ps1
```

Este script:

- Descarga PostgreSQL 16.2 portable (~50 MB)
- Extrae solo los archivos necesarios
- Crea la estructura de directorios
- Copia los scripts de instalación

**Resultado:** Carpeta `postgresql-portable` con ~150 MB

### 2. Compilar la Aplicación

```bash
npm run build
```

Esto genera la carpeta `dist` con los archivos de React compilados.

### 3. Crear el Instalador

```bash
npm run build:win
```

Este comando:

- Compila la aplicación con Vite
- Empaqueta con Electron Builder
- Incluye PostgreSQL portable
- Crea el instalador NSIS

**Resultado:** `release/SIPARK Setup 1.0.4.exe` (~200 MB)

## 📦 Contenido del Instalador

El instalador incluye:

```
SIPARK Setup.exe
├── Aplicación SIPARK
│   ├── Electron + React
│   ├── Node.js embebido
│   └── Dependencias (pg, etc.)
├── PostgreSQL Portable
│   ├── Binarios (bin/)
│   ├── Librerías (lib/)
│   └── Archivos compartidos (share/)
└── Scripts de Instalación
    ├── install-postgres-portable.ps1
    └── setup-database.ps1
```

## 🔧 Proceso de Instalación (Usuario Final)

Cuando el usuario ejecuta el instalador:

### Paso 1: Instalación de Archivos

- Copia archivos a `C:\Program Files\SIPARK\`
- Crea accesos directos en Escritorio y Menú Inicio

### Paso 2: Inicialización de PostgreSQL

El script `install-postgres-portable.ps1`:

- Inicializa el cluster de PostgreSQL
- Configura `postgresql.conf`
- Configura `pg_hba.conf` (autenticación local sin contraseña)

### Paso 3: Creación de Base de Datos

El script `setup-database.ps1`:

- Inicia el servidor PostgreSQL
- Crea el usuario `ludoteca_user`
- Crea la base de datos `ludoteca_pos`
- Otorga permisos
- Crea archivo `db-config.json`

### Paso 4: Primera Ejecución

Al abrir SIPARK:

- `postgres-manager.cjs` detecta PostgreSQL embebido
- Inicia el servidor automáticamente
- Conecta a la base de datos
- Crea las tablas
- Inserta datos iniciales

## 🎯 Ventajas de Esta Solución

### Para el Usuario

✅ **Instalación con un solo clic** - No requiere conocimientos técnicos
✅ **Sin dependencias externas** - Todo incluido en el instalador
✅ **Configuración automática** - Base de datos lista para usar
✅ **Portable** - PostgreSQL aislado, no afecta otras instalaciones
✅ **Desinstalación limpia** - Opción de conservar o eliminar datos

### Para el Desarrollador

✅ **Menos soporte** - Sin problemas de configuración de PostgreSQL
✅ **Consistencia** - Misma versión de PostgreSQL para todos
✅ **Control total** - Configuración optimizada para la aplicación
✅ **Actualizaciones fáciles** - Incluir nueva versión de PostgreSQL

## 📁 Estructura de Archivos en Producción

```
C:\Program Files\SIPARK\
├── SIPARK.exe                          # Aplicación principal
├── resources\
│   ├── app.asar                        # Código de la aplicación
│   ├── app.asar.unpacked\
│   │   ├── node_modules\pg\            # Driver PostgreSQL
│   │   └── db-config.json              # Configuración de BD
│   ├── postgresql\                     # PostgreSQL embebido
│   │   ├── bin\
│   │   │   ├── postgres.exe
│   │   │   ├── pg_ctl.exe
│   │   │   ├── psql.exe
│   │   │   └── initdb.exe
│   │   ├── lib\                        # Librerías
│   │   ├── share\                      # Archivos compartidos
│   │   └── data\                       # Datos de PostgreSQL
│   │       ├── postgresql.conf
│   │       ├── pg_hba.conf
│   │       ├── base\                   # Bases de datos
│   │       └── log\                    # Logs
│   └── installer-scripts\
│       ├── install-postgres-portable.ps1
│       └── setup-database.ps1
└── uninstall.exe
```

## 🔍 Verificación Post-Instalación

### Verificar PostgreSQL

```powershell
cd "C:\Program Files\SIPARK\resources\postgresql\bin"
.\pg_ctl.exe status -D "..\data"
```

### Verificar Base de Datos

```powershell
.\psql.exe -U ludoteca_user -d ludoteca_pos -c "\dt"
```

### Ver Logs

```powershell
Get-Content "C:\Program Files\SIPARK\resources\postgresql\data\log\postgres.log" -Tail 50
```

## 🐛 Solución de Problemas

### PostgreSQL no inicia

```powershell
# Ver logs
Get-Content "C:\Program Files\SIPARK\resources\postgresql\data\log\postgres.log"

# Reiniciar manualmente
cd "C:\Program Files\SIPARK\resources\postgresql\bin"
.\pg_ctl.exe restart -D "..\data"
```

### Error de permisos

- Ejecutar el instalador como Administrador
- Verificar que el usuario tenga permisos en `C:\Program Files\`

### Puerto 5432 ocupado

Si ya hay otro PostgreSQL:

1. Cambiar puerto en `postgresql.conf`
2. Actualizar `db-config.json`
3. Reiniciar PostgreSQL

## 📝 Notas Importantes

### Tamaño del Instalador

- Aplicación: ~50 MB
- PostgreSQL: ~150 MB
- **Total: ~200 MB**

### Requisitos del Sistema

- Windows 10/11 (64-bit)
- 4 GB RAM mínimo
- 500 MB espacio en disco
- .NET Framework 4.7.2+ (incluido en Windows 10+)

### Seguridad

- PostgreSQL configurado para conexiones locales únicamente
- Autenticación por trust en localhost
- Cambiar contraseña en producción si es necesario

### Actualizaciones

Para actualizar PostgreSQL:

1. Descargar nueva versión portable
2. Actualizar `prepare-windows-installer.ps1`
3. Recompilar instalador
4. El instalador detectará y migrará datos existentes

## 🔄 Proceso de Actualización de la Aplicación

Para actualizar SIPARK sin perder datos:

1. El nuevo instalador detecta instalación existente
2. Detiene PostgreSQL
3. Actualiza archivos de la aplicación
4. Mantiene carpeta `data` intacta
5. Reinicia PostgreSQL
6. Ejecuta migraciones de esquema si es necesario

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs en `C:\Program Files\SIPARK\resources\postgresql\data\log\`
2. Verificar que el puerto 5432 esté disponible
3. Ejecutar como Administrador
4. Contactar soporte técnico

---

**Última actualización:** Marzo 2026
**Versión de PostgreSQL:** 16.2
**Versión de SIPARK:** 1.0.4
