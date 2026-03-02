# 🔄 Guía Rápida de Migración a PostgreSQL

## ¿Por qué migrar?

**SQLite (actual):**

- ✅ Simple y sin configuración
- ❌ Solo 1 usuario a la vez
- ❌ Base de datos en cada computadora
- ❌ No hay sincronización entre PCs

**PostgreSQL (nuevo):**

- ✅ Múltiples usuarios simultáneos
- ✅ Base de datos centralizada
- ✅ Sincronización en tiempo real
- ✅ Mejor para negocios en crecimiento

---

## 🚀 Pasos Rápidos (Resumen)

### En el Servidor (1 computadora)

1. **Instalar PostgreSQL**
   - Windows: Descargar de postgresql.org
   - Linux: `sudo apt install postgresql`
   - macOS: `brew install postgresql`

2. **Configurar acceso remoto**

   ```bash
   # Editar postgresql.conf
   listen_addresses = '*'

   # Editar pg_hba.conf (agregar al final)
   host all all 192.168.1.0/24 md5

   # Reiniciar PostgreSQL
   ```

3. **Crear base de datos**

   ```bash
   psql -U postgres
   CREATE DATABASE ludoteca_pos;
   CREATE USER ludoteca_user WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;
   ```

4. **Abrir firewall**

   ```bash
   # Windows
   New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow

   # Linux
   sudo ufw allow 5432/tcp
   ```

### En Cada Cliente (todas las PCs)

1. **Instalar dependencia**

   ```bash
   npm install pg
   ```

2. **Crear archivo de configuración**

   Crear `db-config.json` en la raíz del proyecto:

   ```json
   {
     "host": "192.168.1.100",
     "port": 5432,
     "database": "ludoteca_pos",
     "user": "ludoteca_user",
     "password": "tu_password"
   }
   ```

   ⚠️ Cambiar `192.168.1.100` por la IP del servidor

3. **Cambiar el código**

   En `electron-main.ts` o `electron-main.js`:

   ```javascript
   // CAMBIAR ESTA LÍNEA:
   const { initializeDatabase } = require("./src-electron/database.cjs");

   // POR ESTA:
   const { initializeDatabase } = require("./src-electron/database-pg.cjs");
   ```

4. **Ejecutar**
   ```bash
   npm run dev
   ```

---

## 📋 Checklist de Migración

### Servidor

- [ ] PostgreSQL instalado
- [ ] Base de datos creada
- [ ] Usuario creado con permisos
- [ ] `postgresql.conf` configurado
- [ ] `pg_hba.conf` configurado
- [ ] PostgreSQL reiniciado
- [ ] Firewall configurado
- [ ] IP del servidor anotada

### Clientes

- [ ] `pg` instalado (`npm install pg`)
- [ ] `db-config.json` creado con IP correcta
- [ ] Código modificado para usar `database-pg.cjs`
- [ ] Aplicación probada y funcionando

---

## 🧪 Probar la Conexión

### Desde el servidor:

```bash
psql -U ludoteca_user -d ludoteca_pos -h localhost
```

### Desde un cliente:

```bash
psql -U ludoteca_user -d ludoteca_pos -h 192.168.1.100
```

Si conecta correctamente, verás el prompt de PostgreSQL:

```
ludoteca_pos=>
```

Escribe `\q` para salir.

---

## ⚠️ Problemas Comunes

### "Connection refused"

- ✅ Verificar que PostgreSQL esté corriendo
- ✅ Verificar firewall
- ✅ Verificar IP del servidor

### "password authentication failed"

- ✅ Verificar usuario y password en `db-config.json`
- ✅ Verificar permisos del usuario en PostgreSQL

### "no pg_hba.conf entry"

- ✅ Verificar que agregaste la línea en `pg_hba.conf`
- ✅ Reiniciar PostgreSQL

### La app no conecta

- ✅ Verificar que `db-config.json` existe
- ✅ Verificar que instalaste `pg`
- ✅ Verificar que cambiaste el import en `electron-main.ts`

---

## 📚 Documentación Completa

Para instrucciones detalladas, ver: **POSTGRESQL-SETUP.md**

---

## 💡 Consejos

1. **Empezar con el servidor**: Configura primero el servidor completamente antes de configurar los clientes
2. **Probar con psql**: Antes de usar la app, prueba la conexión con `psql`
3. **Usar IPs fijas**: Configura IP fija en el servidor para evitar cambios
4. **Hacer backups**: Configura backups automáticos de la base de datos
5. **Documentar**: Anota la IP del servidor y el password en un lugar seguro

---

## 🎯 Resultado Final

Después de la migración:

- ✅ Múltiples PCs pueden usar el sistema al mismo tiempo
- ✅ Todos ven los mismos datos en tiempo real
- ✅ Las ventas se sincronizan automáticamente
- ✅ El inventario se actualiza para todos
- ✅ Sistema listo para crecer

---

## 🆘 ¿Necesitas Ayuda?

1. Lee **POSTGRESQL-SETUP.md** para instrucciones detalladas
2. Revisa los logs de PostgreSQL
3. Verifica la conectividad de red
4. Prueba la conexión con `psql` antes de usar la app

¡Éxito con la migración! 🚀
