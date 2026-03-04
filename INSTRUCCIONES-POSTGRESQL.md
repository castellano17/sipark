# 🚀 Instalación de PostgreSQL para SIPARK

## ⚠️ IMPORTANTE: Hacer SOLO en la PC que será el servidor

### Windows (PC Servidor)

1. **Descargar PostgreSQL**
   - Ve a: https://www.postgresql.org/download/windows/
   - Descarga el instalador (versión 15 o superior)
   - Ejecuta el instalador

2. **Durante la instalación:**
   - Password para postgres: `ludoteca2024` (ANÓTALO)
   - Puerto: `5432` (dejar por defecto)
   - Instalar Stack Builder: NO (no es necesario)

3. **Crear la base de datos**

   Abre PowerShell como Administrador y ejecuta:

   ```powershell
   # Ir a la carpeta de PostgreSQL
   cd "C:\Program Files\PostgreSQL\15\bin"

   # Conectar a PostgreSQL (pedirá password: ludoteca2024)
   .\psql.exe -U postgres
   ```

   Dentro de psql, ejecuta estos comandos:

   ```sql
   CREATE DATABASE ludoteca_pos;
   CREATE USER ludoteca_user WITH PASSWORD 'ludoteca2024';
   GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;
   \q
   ```

4. **Configurar acceso remoto**

   Edita estos archivos (están en `C:\Program Files\PostgreSQL\15\data\`):

   **postgresql.conf** - Busca y cambia:

   ```
   listen_addresses = '*'
   ```

   **pg_hba.conf** - Agrega al final:

   ```
   host    all    all    0.0.0.0/0    md5
   ```

5. **Abrir firewall**

   ```powershell
   New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
   ```

6. **Reiniciar PostgreSQL**
   - Abre "Servicios" (services.msc)
   - Busca "postgresql-x64-15"
   - Click derecho > Reiniciar

7. **Anotar la IP del servidor**
   ```powershell
   ipconfig
   ```
   Anota la "Dirección IPv4" (ejemplo: 192.168.1.100)

---

## 📱 Configuración en TODAS las PCs (incluida la del servidor)

1. **Editar db-config.json**

   En la carpeta del proyecto, edita `db-config.json`:

   ```json
   {
     "host": "192.168.1.100",
     "port": 5432,
     "database": "ludoteca_pos",
     "user": "ludoteca_user",
     "password": "ludoteca2024"
   }
   ```

   ⚠️ Cambia `192.168.1.100` por la IP real del servidor

2. **Compilar e instalar**

   ```powershell
   npm install
   npm run electron:build
   ```

3. **Instalar el .exe**

---

## ✅ Verificar que funciona

En cualquier PC, abre PowerShell y ejecuta:

```powershell
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -h 192.168.1.100 -U ludoteca_user -d ludoteca_pos
```

Si pide password y conecta, ¡funciona! Escribe `\q` para salir.

---

## 🆘 Problemas comunes

### "Connection refused"

- Verifica que PostgreSQL esté corriendo en el servidor
- Verifica el firewall
- Verifica la IP del servidor

### "password authentication failed"

- Verifica el password en db-config.json
- Verifica que el usuario existe en PostgreSQL

### La app no conecta

- Verifica que db-config.json existe en la carpeta del proyecto
- Verifica que la IP es correcta
- Verifica que el servidor está encendido

---

## 📊 Ventajas de PostgreSQL

✅ Todas las PCs ven los mismos datos en tiempo real
✅ No más problemas de compilación de SQLite
✅ Backups centralizados
✅ Mejor rendimiento con múltiples usuarios
✅ Datos seguros en un solo lugar

---

¿Necesitas ayuda? Revisa los logs de la aplicación o contacta soporte.
