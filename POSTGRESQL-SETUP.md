# Configuración de PostgreSQL para Sistema Multi-Usuario

## 🎯 Objetivo

Migrar de SQLite (base de datos local) a PostgreSQL (base de datos cliente-servidor) para permitir que múltiples computadoras en la misma red accedan al sistema simultáneamente.

## 📋 Requisitos

- Una computadora que actuará como servidor (puede ser cualquier PC en la red)
- PostgreSQL 12 o superior instalado en el servidor
- Todas las computadoras conectadas a la misma red local

---

## 🖥️ PASO 1: Instalar PostgreSQL en el Servidor

### Windows

1. Descargar PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Durante la instalación:
   - Puerto: `5432` (por defecto)
   - Password del superusuario (postgres): **Anotar este password**
   - Instalar Stack Builder: NO (opcional)

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS

```bash
brew install postgresql@15
brew services start postgresql@15
```

---

## 🔧 PASO 2: Configurar PostgreSQL para Acceso Remoto

### 2.1 Editar postgresql.conf

**Ubicación del archivo:**

- Windows: `C:\Program Files\PostgreSQL\15\data\postgresql.conf`
- Linux: `/etc/postgresql/15/main/postgresql.conf`
- macOS: `/usr/local/var/postgres/postgresql.conf`

**Cambiar:**

```conf
# Buscar esta línea:
#listen_addresses = 'localhost'

# Cambiar a:
listen_addresses = '*'
```

### 2.2 Editar pg_hba.conf

**Ubicación del archivo:**

- Windows: `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`
- Linux: `/etc/postgresql/15/main/pg_hba.conf`
- macOS: `/usr/local/var/postgres/pg_hba.conf`

**Agregar al final del archivo:**

```conf
# Permitir conexiones desde la red local
# Cambiar 192.168.1.0/24 por tu rango de red
host    all             all             192.168.1.0/24          md5
```

### 2.3 Reiniciar PostgreSQL

**Windows:**

```cmd
# Buscar "Servicios" en el menú inicio
# Buscar "postgresql-x64-15"
# Click derecho -> Reiniciar
```

**Linux:**

```bash
sudo systemctl restart postgresql
```

**macOS:**

```bash
brew services restart postgresql@15
```

---

## 🗄️ PASO 3: Crear Base de Datos y Usuario

Abrir terminal/cmd y ejecutar:

```bash
# Conectar como superusuario
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE ludoteca_pos;
CREATE USER ludoteca_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;

# En PostgreSQL 15+, también ejecutar:
\c ludoteca_pos
GRANT ALL ON SCHEMA public TO ludoteca_user;

# Salir
\q
```

---

## 🔥 PASO 4: Configurar Firewall

### Windows

```cmd
# Abrir PowerShell como Administrador
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

### Linux (UFW)

```bash
sudo ufw allow 5432/tcp
sudo ufw reload
```

### macOS

```bash
# El firewall de macOS generalmente no bloquea conexiones locales
# Si tienes problemas, desactiva temporalmente el firewall para probar
```

---

## 📱 PASO 5: Configurar las Aplicaciones Cliente

### 5.1 Obtener IP del Servidor

**Windows:**

```cmd
ipconfig
# Buscar "Dirección IPv4" (ej: 192.168.1.100)
```

**Linux/macOS:**

```bash
ip addr show
# o
ifconfig
# Buscar inet (ej: 192.168.1.100)
```

### 5.2 Crear archivo de configuración

En cada computadora cliente, crear el archivo `db-config.json` en la raíz del proyecto:

```json
{
  "host": "192.168.1.100",
  "port": 5432,
  "database": "ludoteca_pos",
  "user": "ludoteca_user",
  "password": "tu_password_seguro",
  "max": 20,
  "idleTimeoutMillis": 30000,
  "connectionTimeoutMillis": 2000
}
```

**⚠️ IMPORTANTE:** Cambiar `192.168.1.100` por la IP real del servidor.

### 5.3 Instalar dependencia de PostgreSQL

```bash
npm install pg
```

### 5.4 Modificar el código para usar PostgreSQL

En `electron-main.ts` o `electron-main.js`, cambiar:

```javascript
// ANTES (SQLite):
const { initializeDatabase } = require("./src-electron/database.cjs");

// DESPUÉS (PostgreSQL):
const { initializeDatabase } = require("./src-electron/database-pg.cjs");
```

---

## ✅ PASO 6: Probar la Conexión

### 6.1 Desde el servidor

```bash
psql -U ludoteca_user -d ludoteca_pos -h localhost
# Ingresar password cuando lo pida
# Si conecta, escribir \q para salir
```

### 6.2 Desde un cliente

```bash
psql -U ludoteca_user -d ludoteca_pos -h 192.168.1.100
# Cambiar 192.168.1.100 por la IP del servidor
# Ingresar password cuando lo pida
```

### 6.3 Ejecutar la aplicación

```bash
npm run dev
```

Si todo está correcto, verás en la consola:

```
🔌 Conectando a PostgreSQL en 192.168.1.100:5432...
✅ Conexión a PostgreSQL establecida
✅ Base de datos PostgreSQL inicializada
```

---

## 🔄 PASO 7: Migrar Datos de SQLite a PostgreSQL (Opcional)

Si ya tienes datos en SQLite y quieres migrarlos:

### 7.1 Exportar datos de SQLite

```bash
# Instalar sqlite3 si no lo tienes
npm install -g sqlite3

# Exportar a SQL
sqlite3 sipark.db .dump > backup.sql
```

### 7.2 Adaptar el SQL para PostgreSQL

Editar `backup.sql` y hacer estos cambios:

1. Cambiar `INTEGER PRIMARY KEY AUTOINCREMENT` por `SERIAL PRIMARY KEY`
2. Cambiar `DATETIME` por `TIMESTAMP`
3. Cambiar `REAL` por `DECIMAL(10,2)`
4. Cambiar `BOOLEAN` valores de `0/1` a `FALSE/TRUE`

### 7.3 Importar a PostgreSQL

```bash
psql -U ludoteca_user -d ludoteca_pos -h localhost -f backup.sql
```

---

## 🛠️ Solución de Problemas

### Error: "Connection refused"

- Verificar que PostgreSQL esté corriendo
- Verificar que el firewall permita el puerto 5432
- Verificar la IP del servidor

### Error: "password authentication failed"

- Verificar usuario y password en `db-config.json`
- Verificar que el usuario tenga permisos en la base de datos

### Error: "no pg_hba.conf entry"

- Verificar que agregaste la línea correcta en `pg_hba.conf`
- Verificar que el rango de red sea correcto (192.168.1.0/24)
- Reiniciar PostgreSQL después de cambios

### La aplicación no conecta

1. Verificar que `db-config.json` existe y tiene la configuración correcta
2. Verificar que instalaste `pg`: `npm install pg`
3. Verificar que cambiaste el import en `electron-main.ts`
4. Ver logs en la consola de Electron

---

## 📊 Ventajas de PostgreSQL vs SQLite

| Característica     | SQLite          | PostgreSQL    |
| ------------------ | --------------- | ------------- |
| Multi-usuario      | ❌ No           | ✅ Sí         |
| Concurrencia       | ❌ Limitada     | ✅ Excelente  |
| Tamaño BD          | ✅ Pequeñas     | ✅ Grandes    |
| Backup en caliente | ❌ No           | ✅ Sí         |
| Transacciones      | ✅ Básicas      | ✅ Avanzadas  |
| Rendimiento        | ✅ Rápido local | ✅ Rápido red |
| Mantenimiento      | ✅ Ninguno      | ⚠️ Básico     |

---

## 🔐 Seguridad

### Recomendaciones:

1. **Usar passwords fuertes** para el usuario de PostgreSQL
2. **No compartir** el archivo `db-config.json` (agregarlo a `.gitignore`)
3. **Limitar acceso** solo a la red local (no exponer a internet)
4. **Hacer backups** regulares de la base de datos
5. **Actualizar** PostgreSQL regularmente

### Backup automático (Linux/macOS):

```bash
# Crear script de backup
nano /home/usuario/backup-ludoteca.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U ludoteca_user -h localhost ludoteca_pos > "$BACKUP_DIR/ludoteca_$DATE.sql"
# Mantener solo últimos 7 días
find $BACKUP_DIR -name "ludoteca_*.sql" -mtime +7 -delete
```

```bash
# Dar permisos
chmod +x /home/usuario/backup-ludoteca.sh

# Agregar a crontab (ejecutar diario a las 2 AM)
crontab -e
# Agregar: 0 2 * * * /home/usuario/backup-ludoteca.sh
```

---

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisar logs de PostgreSQL
2. Verificar conectividad de red: `ping 192.168.1.100`
3. Probar conexión con psql antes de usar la app
4. Revisar la consola de Electron para errores específicos

---

## ✨ Próximos Pasos

Una vez configurado PostgreSQL:

1. ✅ Todas las computadoras pueden usar el sistema simultáneamente
2. ✅ Los datos se sincronizan en tiempo real
3. ✅ Puedes hacer backups centralizados
4. ✅ Mejor rendimiento con múltiples usuarios
5. ✅ Escalabilidad para crecer el negocio

¡Listo! Tu sistema POS ahora es multi-usuario. 🎉
