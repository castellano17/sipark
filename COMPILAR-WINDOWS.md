# Guía para Compilar e Instalar en Windows

## ⚠️ IMPORTANTE: Solución al Error "no es una aplicación Win32 válida"

Este error ocurre porque los módulos nativos (better-sqlite3, bcrypt) no están compilados correctamente para Windows. Usa el script corregido.

## Requisitos Previos

1. **Node.js** (versión 18 o superior)
   - Descarga desde: https://nodejs.org/
   - Verifica: `node --version`

2. **Python** (para compilar módulos nativos)
   - Descarga desde: https://www.python.org/downloads/
   - Durante la instalación, marca "Add Python to PATH"

3. **Visual Studio Build Tools** (OBLIGATORIO para módulos nativos)
   - Descarga: https://visualstudio.microsoft.com/downloads/
   - Instalar "Build Tools for Visual Studio"
   - Seleccionar "Desktop development with C++"

## Compilación (MÉTODO CORREGIDO)

### Opción 1: Script Automático (RECOMENDADO)

Abre PowerShell **como administrador** y ejecuta:

```powershell
.\build-windows-fixed.ps1
```

Este script:

- ✅ Limpia compilaciones anteriores
- ✅ Reinstala módulos nativos correctamente
- ✅ Recompila better-sqlite3 y bcrypt para Windows
- ✅ Compila React
- ✅ Empaqueta la aplicación

### Opción 2: Paso a Paso (si el script falla)

```powershell
# 1. Limpiar
Remove-Item -Recurse -Force release, dist -ErrorAction SilentlyContinue

# 2. Limpiar módulos nativos problemáticos
Remove-Item -Recurse -Force node_modules\better-sqlite3 -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\bcrypt -ErrorAction SilentlyContinue

# 3. Reinstalar dependencias
npm install --force

# 4. CRÍTICO: Recompilar módulos nativos para Windows
npm rebuild better-sqlite3 --build-from-source
npm rebuild bcrypt --build-from-source

# 5. Compilar React
npm run build

# 6. Empaquetar con configuración corregida
npx electron-builder --win --x64 --config electron-builder-win.json
```

## Solución de Problemas Comunes

### ❌ Error: "no es una aplicación Win32 válida"

**Causa:** Módulos nativos compilados para arquitectura incorrecta

**Solución:**

```powershell
npm rebuild better-sqlite3 --build-from-source
npm rebuild bcrypt --build-from-source
```

### ❌ Error: "node-gyp" no encontrado

**Causa:** Falta Python o Visual Studio Build Tools

**Solución:**

1. Instalar Python (marcar "Add to PATH")
2. Instalar Visual Studio Build Tools
3. Reiniciar PowerShell

### ❌ Error: "MSBuild.exe" no encontrado

**Causa:** Visual Studio Build Tools no instalado correctamente

**Solución:**

1. Reinstalar Visual Studio Build Tools
2. Asegurarse de seleccionar "Desktop development with C++"

### ❌ Error: SyntaxError en database.cjs

**Causa:** Error de sintaxis ya corregido

**Solución:** El archivo ya está corregido, solo recompila

## Verificar Instalación

El instalador se generará en:

```
release/Ludoteca POS Setup 1.0.0.exe
```

Ejecuta el instalador y verifica que la aplicación inicie correctamente.

## Notas Importantes

1. **Primera compilación**: Puede tardar 10-15 minutos
2. **Tamaño**: El instalador pesará ~150-200 MB
3. **Antivirus**: Puede marcar el instalador como sospechoso (es normal)
4. **Permisos**: Ejecutar PowerShell como administrador

## Comandos Útiles

```powershell
# Ver versión de Node.js
node --version

# Ver versión de npm
npm --version

# Limpiar caché
npm cache clean --force

# Reinstalar todo desde cero
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## ¿Por qué estos cambios?

Los módulos nativos (better-sqlite3, bcrypt) contienen código C++ que debe compilarse específicamente para:

- Sistema operativo (Windows)
- Arquitectura (x64)
- Versión de Node.js

El error anterior ocurría porque estos módulos no se recompilaban correctamente. La nueva configuración:

- Activa `npmRebuild: true`
- Activa `buildDependenciesFromSource: true`
- Desempaqueta módulos nativos del ASAR
- Recompila explícitamente cada módulo nativo

## Soporte

Si sigues teniendo problemas:

1. Verifica que Visual Studio Build Tools esté instalado
2. Ejecuta PowerShell como administrador
3. Revisa los logs de compilación para errores específicos
