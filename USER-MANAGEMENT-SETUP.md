# Sistema de Gestión de Usuarios - Configuración

## Estado Actual: ✅ COMPLETADO

El sistema de gestión de usuarios ha sido implementado completamente con las siguientes características:

### ✅ Componentes Implementados

1. **Base de Datos**
   - Tabla `users` con todos los campos requeridos
   - Tabla `user_permissions` para permisos granulares por módulo
   - Tabla `user_audit_log` para auditoría de cambios
   - Implementado en SQLite (`database.cjs`) y PostgreSQL (`database-pg.cjs`)

2. **Backend API** (`src-electron/users-api.cjs`)
   - ✅ Autenticación con bcrypt
   - ✅ CRUD completo de usuarios
   - ✅ Gestión de permisos por módulo
   - ✅ Cambio de contraseña
   - ✅ Log de auditoría
   - ✅ Creación automática del primer admin

3. **IPC Handlers** (`main.cjs`)
   - ✅ Todos los handlers agregados
   - ✅ Inicialización automática del primer admin al arrancar la app

4. **Preload** (`preload.cjs`)
   - ✅ Todas las funciones expuestas al frontend

5. **Frontend** (`src/components/Users.tsx`)
   - ✅ Interfaz completa de gestión de usuarios
   - ✅ Modal de crear/editar usuario
   - ✅ Modal de configuración de permisos
   - ✅ Modal de cambio de contraseña
   - ✅ Visor de log de auditoría
   - ✅ Badges de roles con colores

6. **Tipos TypeScript** (`src/types/index.ts`)
   - ✅ SystemUser, UserPermission, UserAuditLog, AuthResponse

### 📋 Próximos Pasos para Integración Completa

#### 1. Instalar Dependencias

```bash
npm install
```

(bcrypt ya está en package.json)

#### 2. Crear Componente de Login

Crear `src/components/Login.tsx`:

```tsx
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const result = await window.api.authenticateUser(username, password);
    if (result.success) {
      onLogin(result.user);
    } else {
      setError(result.message || "Error de autenticación");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold text-white mb-6">Ludoteca POS</h1>
        <Input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4"
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4"
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <Button onClick={handleLogin} className="w-full">
          Iniciar Sesión
        </Button>
      </div>
    </div>
  );
}
```

#### 3. Actualizar App.tsx

Agregar estado de autenticación:

```tsx
const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);

if (!currentUser) {
  return <Login onLogin={setCurrentUser} />;
}

return <MainLayout currentUser={currentUser} />;
```

#### 4. Agregar Módulo de Usuarios al Sidebar

En `src/components/Sidebar.tsx`, agregar:

```tsx
{
  currentUser?.role === "admin" && (
    <button onClick={() => onNavigate("users")}>
      <Users className="w-5 h-5" />
      Usuarios
    </button>
  );
}
```

#### 5. Agregar Control de Permisos

Crear hook `src/hooks/usePermissions.ts`:

```tsx
export function usePermissions(currentUser: SystemUser | null) {
  const checkPermission = async (module: string, action: string) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;

    return await window.api.checkPermission(currentUser.id, module, action);
  };

  return { checkPermission };
}
```

Usar en componentes:

```tsx
const { checkPermission } = usePermissions(currentUser);
const canCreate = await checkPermission("inventory", "create");
```

### 🔐 Credenciales del Primer Admin

Al iniciar la aplicación por primera vez, se crea automáticamente:

- **Usuario:** `admin`
- **Contraseña:** `admin123`

⚠️ **IMPORTANTE:** Cambiar esta contraseña inmediatamente después del primer login.

### 📊 Roles Disponibles

1. **admin** - Acceso completo + gestión de usuarios
2. **gerente** - Reportes y configuración (sin gestión de usuarios)
3. **cajero** - POS, ventas, caja
4. **monitor** - Operaciones, clientes (inventario solo lectura)

### 🔍 Módulos con Permisos

- dashboard
- operations
- pos
- clients
- inventory
- reports
- settings
- users (solo admin)

Cada módulo tiene 4 acciones: view, create, edit, delete

### 📝 Auditoría

Todos los cambios en usuarios se registran en `user_audit_log`:

- Creación de usuarios
- Actualización de datos
- Cambio de contraseña
- Desactivación de usuarios

Visible en el modal "Historial de Auditoría" dentro del módulo de usuarios.

### 🧪 Pruebas Recomendadas

1. Iniciar la app y verificar que se crea el admin
2. Login con admin/admin123
3. Crear un usuario de prueba con rol "cajero"
4. Configurar permisos específicos
5. Cerrar sesión y probar login con el nuevo usuario
6. Verificar que solo ve los módulos permitidos
7. Probar cambio de contraseña
8. Revisar log de auditoría

### 🐛 Solución de Problemas

**Error: bcrypt no encontrado**

```bash
npm install bcrypt
npm rebuild bcrypt
```

**Error: No se puede crear admin**

- Verificar que las tablas existan en la BD
- Revisar logs en la consola de Electron

**Error: Login no funciona**

- Verificar que los IPC handlers estén registrados
- Revisar que preload.cjs exponga las funciones
- Verificar en DevTools que window.api existe

### 📚 Archivos Relacionados

- `src-electron/database.cjs` - Esquema de tablas (SQLite)
- `src-electron/database-pg.cjs` - Esquema de tablas (PostgreSQL)
- `src-electron/users-api.cjs` - Lógica de negocio de usuarios
- `src-electron/api.cjs` - Exporta funciones de usuarios
- `main.cjs` - IPC handlers + inicialización de admin
- `preload.cjs` - Expone API al frontend
- `src/components/Users.tsx` - Interfaz de gestión
- `src/types/index.ts` - Tipos TypeScript
