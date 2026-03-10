# Guía de Instalación SIPARK - Cliente

Esta guía explica cómo instalar SIPARK en la computadora del cliente.

## Requisitos Previos

Antes de instalar SIPARK, debes instalar PostgreSQL.

## Paso 1: Instalar PostgreSQL

1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador
3. Durante la instalación:
   - **Puerto**: Deja el puerto por defecto `5432`
   - **Contraseña del superusuario (postgres)**: Anota esta contraseña, la necesitarás
   - **Locale**: Deja el valor por defecto
4. Completa la instalación

## Paso 2: Configurar la Base de Datos

1. Descarga los archivos:
   - `setup-database.sql`
   - `setup-database.bat`

2. Coloca ambos archivos en la misma carpeta

3. Haz doble clic en `setup-database.bat`

4. Cuando te pida la contraseña, ingresa la contraseña del usuario `postgres` que configuraste en el Paso 1

5. Si todo sale bien, verás el mensaje: `✅ CONFIGURACIÓN COMPLETADA`

## Paso 3: Instalar SIPARK

1. Descarga el instalador de SIPARK: `SIPARK-Setup-1.0.4.exe`

2. Ejecuta el instalador

3. Sigue las instrucciones del instalador

4. Al finalizar, SIPARK se ejecutará automáticamente

## Verificación

Si SIPARK se conecta correctamente, verás la pantalla de inicio de sesión.

Si ves un error de conexión:

- Verifica que PostgreSQL esté corriendo (busca el servicio en Servicios de Windows)
- Verifica que ejecutaste el script `setup-database.bat` correctamente
- Verifica que el puerto 5432 no esté bloqueado por el firewall

## Credenciales por Defecto

- **Usuario**: admin
- **Contraseña**: admin123

**IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión.

## Solución de Problemas

### Error: "ECONNREFUSED ::1:5432"

Esto significa que PostgreSQL no está corriendo o no está configurado correctamente.

**Solución**:

1. Abre "Servicios" en Windows (busca "services.msc")
2. Busca el servicio "postgresql-x64-XX" (donde XX es la versión)
3. Si está detenido, haz clic derecho y selecciona "Iniciar"
4. Configura el servicio para que inicie automáticamente

### Error: "password authentication failed"

La contraseña del usuario `ludoteca_user` no es correcta.

**Solución**:

1. Ejecuta nuevamente `setup-database.bat`
2. O cambia la contraseña manualmente en PostgreSQL

### Error: "database ludoteca_pos does not exist"

La base de datos no fue creada correctamente.

**Solución**:

1. Ejecuta nuevamente `setup-database.bat`
2. Verifica que no haya errores durante la ejecución

## Soporte

Si tienes problemas con la instalación, contacta al soporte técnico.
