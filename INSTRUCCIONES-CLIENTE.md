# Instrucciones para Configurar PostgreSQL en el Cliente

## Pasos para ejecutar el script de configuración:

### 1. Descargar el archivo

- Descarga el archivo `configurar-postgres-sipark.ps1`
- Guárdalo en el escritorio o en una carpeta fácil de encontrar

### 2. Abrir PowerShell como Administrador

- Presiona la tecla Windows
- Escribe "PowerShell"
- Haz clic derecho en "Windows PowerShell"
- Selecciona "Ejecutar como administrador"
- Clic en "Sí" cuando pregunte si quieres permitir cambios

### 3. Permitir ejecución de scripts (solo la primera vez)

En PowerShell, escribe:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Presiona Enter y luego escribe `S` y Enter para confirmar

### 4. Navegar a la carpeta donde guardaste el archivo

Si lo guardaste en el escritorio, escribe:

```powershell
cd Desktop
```

Si lo guardaste en otra carpeta, por ejemplo en Descargas:

```powershell
cd Downloads
```

### 5. Ejecutar el script

Escribe:

```powershell
.\configurar-postgres-sipark.ps1
```

Presiona Enter

### 6. Seguir las instrucciones del script

- Te pedirá la contraseña del usuario `postgres` (la que pusiste cuando instalaste PostgreSQL)
- El script creará automáticamente:
  - Usuario: `ludoteca_user`
  - Contraseña: `ludoteca2024`
  - Base de datos: `ludoteca_pos`

### 7. Si hay error de autenticación

El script te dirá si necesitas modificar el archivo `pg_hba.conf` y te ofrecerá abrirlo automáticamente.

Si necesitas editarlo manualmente:

1. Busca las líneas que dicen `scram-sha-256`
2. Cámbiala a `md5`
3. Guarda el archivo
4. Reinicia el servicio PostgreSQL
5. Ejecuta el script nuevamente

### 8. Ejecutar SIPARK

Una vez que el script diga "✅ CONFIGURACIÓN COMPLETADA", ya puedes ejecutar SIPARK.

---

## Método Alternativo (Copiar y Pegar en PowerShell)

Si prefieres copiar y pegar directamente en PowerShell:

1. Abre PowerShell como Administrador
2. Copia TODO el contenido del archivo `configurar-postgres-sipark.ps1`
3. Pega en PowerShell (clic derecho)
4. Presiona Enter
5. Sigue las instrucciones

---

## Solución de Problemas

### Error: "no se puede cargar el archivo porque la ejecución de scripts está deshabilitada"

Ejecuta:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "No se encontró PostgreSQL instalado"

Instala PostgreSQL desde: https://www.postgresql.org/download/windows/

### Error: "password authentication failed"

- Verifica que la contraseña del usuario `postgres` sea correcta
- El script te ayudará a modificar `pg_hba.conf` si es necesario

---

## Contacto

Si tienes problemas, contacta al soporte técnico.
