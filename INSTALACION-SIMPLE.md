# 🚀 Instalación Simple de SIPARK con PostgreSQL

## Para el Cliente (Windows)

### Opción 1: UNA SOLA PC

1. **Descargar PostgreSQL**
   - Ve a: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Descarga la versión 15 para Windows
   - Ejecuta el instalador
   - Password: `ludoteca2024`
   - Puerto: `5432`
   - NO instalar Stack Builder

2. **Ejecutar el instalador automático**
   - Abre PowerShell como Administrador
   - Ve a la carpeta del proyecto
   - Ejecuta: `.\install-postgresql-windows.ps1`

3. **Compilar e instalar la app**
   ```powershell
   npm install
   npm run electron:build
   ```
4. **Instalar el .exe** de la carpeta `release/`

5. **¡Listo!** La app funcionará con PostgreSQL

---

### Opción 2: VARIAS PCs (Red Local)

#### En la PC Principal (Servidor):

1. **Instalar PostgreSQL** (igual que arriba)

2. **Ejecutar el instalador automático**
   ```powershell
   .\install-postgresql-windows.ps1
   ```
3. **Anotar la IP** que muestra el script (ejemplo: 192.168.1.50)

#### En las demás PCs:

1. **Editar db-config.json** en la carpeta del proyecto:

   ```json
   {
     "host": "192.168.1.50",
     "port": 5432,
     "database": "ludoteca_pos",
     "user": "ludoteca_user",
     "password": "ludoteca2024"
   }
   ```

   (Cambia `192.168.1.50` por la IP real del servidor)

2. **Compilar e instalar**

   ```powershell
   npm install
   npm run electron:build
   ```

3. **Instalar el .exe**

---

## Ventajas

✅ Todas las PCs ven los mismos datos en tiempo real
✅ No más problemas de SQLite en Windows
✅ Backups centralizados
✅ Mejor rendimiento

---

## Problemas Comunes

### "Connection refused"

- Verifica que PostgreSQL esté corriendo en el servidor
- Verifica el firewall
- Verifica la IP

### "password authentication failed"

- Verifica el password en db-config.json

### La app no conecta

- Verifica que db-config.json existe
- Verifica que la IP es correcta
- Verifica que el servidor está encendido

---

## Soporte

Si tienes problemas, revisa los logs de la aplicación o contacta soporte.
