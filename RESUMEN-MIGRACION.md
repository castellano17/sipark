# 📊 Resumen: Migración SQLite → PostgreSQL

## ✅ Archivos Creados

1. **`src-electron/database-pg.cjs`** - Nuevo módulo de base de datos para PostgreSQL
2. **`db-config.example.json`** - Ejemplo de configuración de conexión
3. **`POSTGRESQL-SETUP.md`** - Guía completa paso a paso
4. **`MIGRACION-POSTGRESQL.md`** - Guía rápida de migración
5. **`install-postgresql.sh`** - Script automático para Linux
6. **`install-postgresql.ps1`** - Script automático para Windows
7. **`RESUMEN-MIGRACION.md`** - Este archivo

## 🔧 Cambios Realizados

### package.json

- ✅ Agregada dependencia `pg` (PostgreSQL client)

### .gitignore

- ✅ Agregado `db-config.json` (contiene passwords)
- ✅ Agregado `*.db` y `*.db-journal`

### README.md

- ✅ Actualizado con información de PostgreSQL
- ✅ Enlaces a guías de migración

## 🎯 Diferencias Clave: SQLite vs PostgreSQL

| Aspecto            | SQLite (Actual) | PostgreSQL (Nuevo)    |
| ------------------ | --------------- | --------------------- |
| **Archivo**        | `database.cjs`  | `database-pg.cjs`     |
| **Conexión**       | Archivo local   | Cliente-Servidor      |
| **Usuarios**       | 1 a la vez      | Múltiples simultáneos |
| **Configuración**  | Ninguna         | `db-config.json`      |
| **Instalación**    | Incluida        | Requiere servidor     |
| **Sincronización** | No              | Tiempo real           |

## 🚀 Cómo Usar

### Opción 1: Seguir usando SQLite (actual)

**No hacer nada.** El sistema sigue funcionando como antes.

### Opción 2: Migrar a PostgreSQL

#### Paso 1: Servidor

```bash
# Linux
sudo ./install-postgresql.sh

# Windows (PowerShell como Admin)
.\install-postgresql.ps1
```

#### Paso 2: Clientes

```bash
# 1. Instalar dependencia
npm install pg

# 2. Crear db-config.json con la IP del servidor
{
  "host": "192.168.1.100",
  "port": 5432,
  "database": "ludoteca_pos",
  "user": "ludoteca_user",
  "password": "tu_password"
}

# 3. Cambiar en electron-main.ts:
# DE:  require("./src-electron/database.cjs")
# A:   require("./src-electron/database-pg.cjs")

# 4. Ejecutar
npm run dev
```

## 📝 Notas Importantes

### Compatibilidad

- ✅ El código de la aplicación NO cambia
- ✅ Las funciones `runAsync`, `getAsync`, `allAsync` son idénticas
- ✅ Solo cambia el módulo de conexión

### Tipos de Datos

PostgreSQL usa tipos diferentes pero compatibles:

- `INTEGER` → `SERIAL` (auto-increment)
- `REAL` → `DECIMAL(10,2)` (más preciso)
- `DATETIME` → `TIMESTAMP`
- `BOOLEAN` → `BOOLEAN` (nativo)

### Índices

PostgreSQL incluye índices automáticos para:

- Timestamps de ventas
- Clientes en ventas
- Códigos de barras
- Tipos de productos
- Estados de sesiones y cajas

## 🔐 Seguridad

### Archivo db-config.json

⚠️ **NUNCA subir a Git** (ya está en .gitignore)

Contiene:

- IP del servidor
- Usuario
- **Password en texto plano**

### Recomendaciones

1. Usar passwords fuertes
2. Limitar acceso solo a red local
3. No exponer a internet
4. Hacer backups regulares

## 📊 Rendimiento

### SQLite

- ✅ Muy rápido para 1 usuario
- ❌ Bloqueos con múltiples accesos
- ❌ No hay concurrencia real

### PostgreSQL

- ✅ Optimizado para múltiples usuarios
- ✅ Transacciones ACID completas
- ✅ Índices automáticos
- ✅ Pool de conexiones (20 conexiones)

## 🔄 Migración de Datos

Si ya tienes datos en SQLite:

```bash
# 1. Exportar SQLite
sqlite3 sipark.db .dump > backup.sql

# 2. Adaptar SQL (cambiar tipos de datos)
# Ver POSTGRESQL-SETUP.md sección "Migrar Datos"

# 3. Importar a PostgreSQL
psql -U ludoteca_user -d ludoteca_pos -h localhost -f backup.sql
```

## 🆘 Solución de Problemas

### Error: "Connection refused"

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql  # Linux
# o buscar servicio en Windows

# Verificar firewall
sudo ufw status  # Linux
Get-NetFirewallRule -DisplayName "PostgreSQL*"  # Windows
```

### Error: "password authentication failed"

- Verificar usuario y password en `db-config.json`
- Verificar permisos: `GRANT ALL PRIVILEGES ON DATABASE...`

### Error: "no pg_hba.conf entry"

- Verificar que agregaste la línea en `pg_hba.conf`
- Verificar el rango de red (192.168.1.0/24)
- Reiniciar PostgreSQL

## 📚 Recursos

- **Guía Rápida**: [MIGRACION-POSTGRESQL.md](MIGRACION-POSTGRESQL.md)
- **Guía Completa**: [POSTGRESQL-SETUP.md](POSTGRESQL-SETUP.md)
- **Documentación PostgreSQL**: https://www.postgresql.org/docs/
- **Cliente pg (Node.js)**: https://node-postgres.com/

## ✨ Beneficios de la Migración

1. **Escalabilidad**: Soporta crecimiento del negocio
2. **Confiabilidad**: Base de datos empresarial probada
3. **Concurrencia**: Múltiples usuarios sin conflictos
4. **Backups**: Centralizados y automatizables
5. **Auditoría**: Logs completos de todas las operaciones
6. **Rendimiento**: Optimizado para cargas de trabajo reales

## 🎉 Conclusión

La migración a PostgreSQL es **opcional** pero **recomendada** si:

- ✅ Tienes más de 1 computadora
- ✅ Necesitas acceso simultáneo
- ✅ Quieres sincronización en tiempo real
- ✅ Planeas crecer el negocio

El sistema funciona perfectamente con SQLite para uso de 1 usuario.

---

**¿Dudas?** Consulta las guías detalladas o los scripts de instalación automática.
