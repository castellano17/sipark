# Solución: Clientes Duplicados

## Problema Identificado

Los clientes se estaban duplicando porque la función `createClient` en el backend **no validaba si ya existía un cliente** con el mismo nombre y teléfono antes de insertarlo.

### Causas:

1. **Falta de validación**: La función `createClient` insertaba directamente sin verificar duplicados
2. **Inconsistencia**: La función `startSession` SÍ validaba duplicados, pero `createClient` no
3. **Múltiples clics**: Si el usuario hacía clic varias veces en "Guardar", se creaban múltiples registros

## Solución Implementada

### 1. Validación en el Backend (`src-electron/api.cjs`)

Se agregó validación antes de insertar un nuevo cliente:

```javascript
// Verificar si ya existe un cliente con el mismo nombre y teléfono
const existingClient = await getAsync(
  "SELECT id FROM clients WHERE name = ? AND phone = ?",
  [name, phone],
);

if (existingClient) {
  throw new Error("Ya existe un cliente con ese nombre y teléfono");
}
```

### 2. Manejo de Errores en el Frontend (`src/components/Clients.tsx`)

Se mejoró el manejo de errores para mostrar un mensaje específico:

```typescript
catch (err: any) {
  if (err?.message?.includes("Ya existe un cliente")) {
    error("Ya existe un cliente con ese nombre y teléfono");
  } else {
    error("Error guardando cliente");
  }
}
```

## Limpiar Duplicados Existentes

Para eliminar los clientes duplicados que ya existen en tu base de datos:

### Opción 1: Script Automático (Recomendado)

```bash
node fix-duplicates.cjs
```

Este script:

- Busca clientes duplicados (mismo nombre y teléfono)
- Mantiene el registro más antiguo (menor ID)
- Elimina los duplicados
- Muestra un reporte de lo que se eliminó

### Opción 2: SQL Manual

Si prefieres hacerlo manualmente, puedes ejecutar el archivo `fix-duplicate-clients.sql` en tu base de datos.

## Prevención Futura

Con los cambios implementados:

✅ No se podrán crear clientes duplicados desde el formulario
✅ El usuario verá un mensaje claro si intenta crear un duplicado
✅ La validación es consistente en todo el sistema

## Notas Importantes

- La validación se basa en **nombre + teléfono**
- Si necesitas dos clientes con el mismo nombre pero diferente teléfono, funcionará correctamente
- Si necesitas el mismo teléfono para diferentes personas, deberás usar nombres diferentes
