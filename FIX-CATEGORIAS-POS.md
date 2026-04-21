# Fix: Sincronización de Categorías entre Productos y POS

## Problema Identificado

Cuando se creaba una categoría desde el módulo de Productos, esta no aparecía en los botones de filtro del POS. El problema tenía dos causas:

### Causa 1: Parámetro `type` no se pasaba correctamente

La cadena de llamadas era:
1. `Products.tsx` → llamaba a `window.api.createCategory(name, description, type)` ✅
2. `preload.cjs` → solo pasaba `{ name, description }` ❌
3. `main.cjs` → solo pasaba `data.name, data.description` a la API ❌
4. `api.cjs` → esperaba `(name, description, type)` pero recibía `undefined` para `type`

### Causa 2: Evento de sincronización implementado pero no funcionaba

El evento `categories-updated` estaba implementado correctamente en ambos componentes, pero como el `type` no se guardaba, las categorías se creaban con el tipo por defecto ("food") en lugar del tipo seleccionado.

## Solución Implementada

### 1. Actualizar `preload.cjs`

```javascript
// ANTES
createCategory: (name, description) =>
  ipcRenderer.invoke("api:createCategory", { name, description }),

// DESPUÉS
createCategory: (name, description, type) =>
  ipcRenderer.invoke("api:createCategory", { name, description, type }),
```

### 2. Actualizar `main.cjs`

```javascript
// ANTES
ipcMain.handle("api:createCategory", async (event, data) => {
  try {
    const result = await api.createCategory(data.name, data.description);
    return result;
  } catch (error) {
    throw error;
  }
});

// DESPUÉS
ipcMain.handle("api:createCategory", async (event, data) => {
  try {
    const result = await api.createCategory(data.name, data.description, data.type);
    return result;
  } catch (error) {
    throw error;
  }
});
```

## Flujo Correcto Ahora

1. Usuario crea categoría "Bebidas" con tipo "drink" en Products.tsx
2. Se llama a `window.api.createCategory("Bebidas", "", "drink")`
3. preload.cjs pasa `{ name: "Bebidas", description: "", type: "drink" }`
4. main.cjs recibe el objeto y pasa los 3 parámetros a la API
5. api.cjs guarda la categoría con `type = "drink"` en la base de datos
6. Products.tsx dispara el evento `categories-updated`
7. POSScreen.tsx escucha el evento y recarga las categorías
8. La categoría "Bebidas" aparece en los botones de filtro del POS con el emoji 🥤

## Verificación

Se creó un test automatizado (`test-category-sync.cjs`) que verifica:
- ✅ Las categorías se crean con el tipo correcto
- ✅ El tipo se guarda correctamente en la base de datos
- ✅ Las categorías aparecen en el POS (no están en la lista de ocultas)

**Resultado del test:** ✅ TODOS LOS TESTS PASARON

## Archivos Modificados

- `preload.cjs` - Agregado parámetro `type` a `createCategory` y `updateCategory`
- `main.cjs` - Agregado parámetro `data.type` al handler de `api:createCategory`

## Notas Adicionales

- El sistema de eventos `categories-updated` ya estaba correctamente implementado
- Solo se ocultan 3 categorías del sistema en el POS: "Paquetes", "Membresía", "Tiempo"
- Todas las categorías creadas por el usuario ahora aparecen correctamente en el POS
- El tipo de categoría determina el emoji que se muestra en el botón del POS
