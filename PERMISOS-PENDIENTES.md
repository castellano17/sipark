# Control de Permisos - Implementación Pendiente

## ✅ Completado

- `src/hooks/usePermissions.ts` - Hook creado
- `src/components/Products.tsx` - Permisos aplicados
- `src/components/Categories.tsx` - Permisos aplicados
- `src/components/Sidebar.tsx` - Filtrado de menús por permisos

## 📋 Pendiente de Aplicar

Los siguientes componentes necesitan el mismo patrón de permisos:

### Suppliers.tsx

- Módulo: `inventory`
- Botón "Nuevo Proveedor": `disabled={!canCreate("inventory")}`
- Botón Editar: `{canEdit("inventory") && <Button...>}`
- Botón Eliminar: `{canDelete("inventory") && <Button...>}`

### Purchases.tsx

- Módulo: `inventory`
- Botón "Nueva Compra": `disabled={!canCreate("inventory")}`
- Botón Ver Detalles: `{canEdit("inventory") && <Button...>}`

### Inventory.tsx

- Módulo: `inventory`
- Botón "Ajustar Stock": `disabled={!canEdit("inventory")}`
- Botón "Historial de Ajustes": Siempre visible (solo lectura)

### SalesHistory.tsx

- Módulo: `pos`
- Botón Ver Detalles: `{canEdit("pos") && <Button...>}`

### CashManagement.tsx

- Módulo: `pos`
- Botón "Abrir Caja": `disabled={!canCreate("pos")}`
- Botón "Cerrar Caja": `disabled={!canEdit("pos")}`
- Botón "Agregar Movimiento": `disabled={!canCreate("pos")}`

### TimingDashboard.tsx (Operaciones)

- Módulo: `operations`
- Botón "Check-in": `disabled={!canCreate("operations")}`
- Botón "Check-out": `disabled={!canEdit("operations")}`

### Settings.tsx

- Módulo: `settings`
- Todos los campos de edición: `disabled={!canEdit("settings")}`

### Users.tsx

- Módulo: `users`
- Ya tiene control de acceso en el Sidebar (solo admin)

## Patrón de Implementación

```typescript
// 1. Importar el hook
import { usePermissions } from "../hooks/usePermissions";

// 2. Usar el hook en el componente
const { canCreate, canEdit, canDelete } = usePermissions();

// 3. Aplicar en botones
<Button disabled={!canCreate("module_name")}>Crear</Button>

{canEdit("module_name") && <Button>Editar</Button>}

{canDelete("module_name") && <Button>Eliminar</Button>}
```

## Mapeo de Módulos

- `dashboard` - Dashboard
- `operations` - Operaciones/Timing
- `pos` - Punto de Venta
- `clients` - Clientes
- `inventory` - Inventario (productos, categorías, proveedores, compras)
- `reports` - Reportes
- `settings` - Configuración
- `users` - Usuarios (solo admin)
