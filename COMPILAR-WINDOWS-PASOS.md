# Guía: Compilar SIPARK en Windows (Desarrollado en Mac)

## Problema Identificado

Cuando desarrollas en Mac y quieres compilar para Windows, hay problemas con:

- Módulos nativos (`better-sqlite3`, `pg-native`) que necesitan compilarse para cada plataforma
- Cross-compilation desde Mac a Windows NO funciona bien con módulos nativos
- PostgreSQL usa JavaScript puro por defecto, pero intenta cargar `pg-native` (opcional) que causa errores

## Solución Implementada

### 1. Cambios en el Código (Ya aplicados)

✅ **package.json actualizado:**

- Eliminado `prepare-sqlite3` (ya no usamos SQLite)
- Agregado `postinstall: "electron-builder install-app-deps"` para recompilar módulos nativos
- Agregado `node_modules/pg/**/*` a `asarUnpack` para desempaquetar PostgreSQL

✅ **.npmrc creado:**

- Configurado `optional=false` para NO instalar `pg-native` (módulo nativo problemático)

✅ **database-pg.cjs corregido:**

- Función `convertSqliteToPostgres()` ahora convierte correctamente `julianday()` a sintaxis PostgreSQL

### 2. Requisitos en Windows

Antes de compilar, necesitas:

1. **Node.js 18+** instalado
2. **npm** (viene con Node.js)
3. **PostgreSQL 15+** instalado y configurado
4. **Visual Studio Build Tools** (para compilar módulos nativos)

### 3. Instalar Visual Studio Build Tools en Windows

Abre PowerShell como Administrador y ejecuta:

```powershell
# Opción 1: Instalar solo las Build Tools (recomendado, más ligero)
winget install Microsoft.VisualStudio.2022.BuildTools

# Opción 2: Si ya tienes Visual Studio, instala el componente
# Ve a Visual Studio Installer > Modify > Individual Components
# Busca y marca: "MSVC v143 - VS 2022 C++ x64/x86 build tools"
```

### 4. Instalar PostgreSQL en Windows

Ejecuta el script PowerShell incluido:

```powershell
# Desde PowerShell como Administrador en la carpeta del proyecto
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install-postgresql-windows.ps1
```

O instala manualmente desde: https://www.postgresql.org/download/windows/

### 5. Configurar PostgreSQL

Después de instalar PostgreSQL, crea la base de datos:

```powershell
# Abre PowerShell y navega a la carpeta de PostgreSQL
cd "C:\Program Files\PostgreSQL\15\bin"

# Conéctate a PostgreSQL (te pedirá la contraseña que pusiste al instalar)
.\psql -U postgres

# Dentro de psql, ejecuta:
CREATE DATABASE ludoteca_pos;
CREATE USER ludoteca_user WITH PASSWORD 'ludoteca2024';
GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;
\q
```

### 6. Clonar el Repositorio en Windows

```powershell
# Clona el repo
git clone https://github.com/castellano17/sipark.git
cd sipark

# Verifica que estés en la rama main
git branch
```

### 7. Instalar Dependencias en Windows

**IMPORTANTE:** Usa `npm`, NO uses `pnpm` (causa problemas con symlinks en electron-builder)

```powershell
# Elimina node_modules si existe
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Instala con npm (esto ejecutará postinstall automáticamente)
npm install

# Verifica que NO se haya instalado pg-native
npm list pg-native
# Debe decir: (empty) o "not found"
```

### 8. Crear Archivo de Configuración

Crea `db-config.json` en la raíz del proyecto:

```json
{
  "host": "localhost",
  "port": 5432,
  "database": "ludoteca_pos",
  "user": "ludoteca_user",
  "password": "ludoteca2024",
  "max": 20,
  "idleTimeoutMillis": 30000,
  "connectionTimeoutMillis": 2000
}
```

### 9. Probar Localmente (Opcional)

```powershell
# Prueba que la app funcione antes de compilar
npm run dev:electron
```

### 10. Compilar para Windows

```powershell
# Compila el instalador de Windows
npm run build:win

# El instalador se generará en: dist\SIPARK Setup 1.0.4.exe
```

### 11. Probar el Instalador

1. Ve a la carpeta `dist`
2. Ejecuta `SIPARK Setup 1.0.4.exe`
3. Instala la aplicación
4. Abre SIPARK desde el menú de inicio
5. Verifica que se conecte a PostgreSQL correctamente

## Solución de Problemas Comunes

### Error: "pg-native module not found"

**Causa:** Se instaló `pg-native` por error

**Solución:**

```powershell
npm uninstall pg-native
Remove-Item -Recurse -Force node_modules
npm install
```

### Error: "Python not found" o "MSBuild not found"

**Causa:** Faltan Visual Studio Build Tools

**Solución:**

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
# Reinicia PowerShell después de instalar
```

### Error: "Cannot connect to PostgreSQL"

**Causa:** PostgreSQL no está corriendo o la configuración es incorrecta

**Solución:**

```powershell
# Verifica que PostgreSQL esté corriendo
Get-Service -Name postgresql*

# Si no está corriendo, inícialo
Start-Service postgresql-x64-15

# Verifica la conexión
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql -U ludoteca_user -d ludoteca_pos
# Si pide contraseña, usa: ludoteca2024
```

### Error: "electron-builder failed"

**Causa:** Problemas con módulos nativos o caché

**Solución:**

```powershell
# Limpia todo y reinstala
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist
npm cache clean --force
npm install
npm run build:win
```

## Diferencias entre Mac y Windows

| Aspecto         | Mac (Desarrollo)         | Windows (Producción)            |
| --------------- | ------------------------ | ------------------------------- |
| PostgreSQL      | localhost:5432           | localhost:5432                  |
| Instalación     | Homebrew o Postgres.app  | Instalador oficial o script PS1 |
| Compilación     | `npm run build:mac`      | `npm run build:win`             |
| Build Tools     | Xcode Command Line Tools | Visual Studio Build Tools       |
| Package Manager | npm o pnpm               | npm (NO pnpm)                   |

## Notas Importantes

1. **NO uses cross-compilation:** Siempre compila en la plataforma destino (Windows para .exe, Mac para .dmg)
2. **NO uses pnpm en Windows:** Causa problemas con symlinks en electron-builder
3. **pg-native NO es necesario:** PostgreSQL funciona perfectamente con JavaScript puro
4. **Recompila módulos nativos:** El `postinstall` script lo hace automáticamente
5. **PostgreSQL debe estar instalado:** La app necesita conectarse a PostgreSQL local

## Flujo de Trabajo Recomendado

1. **Desarrolla en Mac** con PostgreSQL local
2. **Haz commit y push** de los cambios
3. **En Windows:** `git pull` para obtener cambios
4. **En Windows:** `npm install` (recompila módulos nativos)
5. **En Windows:** `npm run build:win` (genera instalador)
6. **Prueba el instalador** en Windows
7. **Distribuye** el instalador a los clientes

## Recursos Adicionales

- [Documentación de electron-builder](https://www.electron.build/)
- [PostgreSQL para Windows](https://www.postgresql.org/download/windows/)
- [Node.js para Windows](https://nodejs.org/)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
