# Migración: Agregar client_name a tabla sales

## Problema

Las ventas rápidas no mostraban el nombre "Venta Rápida" en el historial porque solo se guardaba el `client_id` (que era NULL para ventas rápidas).

## Solución

Agregar un campo `client_name` a la tabla `sales` para guardar el nombre del cliente directamente.

## Pasos para aplicar la migración

### 1. Ejecutar el script de migración

```bash
node add-client-name-to-sales.cjs
```

Este script:

- Agrega la columna `client_name` a la tabla `sales`
- Actualiza las ventas existentes con los nombres de los clientes desde la tabla `clients`

### 2. Actualizar la consulta getSales

Después de ejecutar la migración exitosamente, actualiza la función `getSales` en `src-electron/api.cjs`:

```javascript
async function getSales(limit = 100) {
  try {
    const sql = `
      SELECT 
        s.id,
        s.client_id,
        COALESCE(s.client_name, c.name) as client_name,
        s.total,
        s.timestamp,
        s.payment_method
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      ORDER BY s.timestamp DESC
      LIMIT ?
    `;
    const sales = await allAsync(sql, [limit]);
    console.log(`📊 Ventas encontradas: ${sales.length}`);
    return sales;
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    throw error;
  }
}
```

### 3. Reiniciar la aplicación

Después de la migración, reinicia la aplicación para que los cambios surtan efecto.

## Resultado

Ahora:

- Las ventas rápidas mostrarán "Venta Rápida" en el historial
- Las ventas con cliente registrado mostrarán el nombre del cliente
- El sistema guarda el nombre directamente en la venta (no depende del JOIN)
