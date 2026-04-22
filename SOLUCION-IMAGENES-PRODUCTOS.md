# Solución: Imágenes de Productos no se Muestran en POS y Modal

## Problemas Encontrados

1. **Directorio de imágenes no existía**: El sistema esperaba encontrar las imágenes en `C:\Users\Esmir\AppData\Roaming\sipark\product-images` pero el directorio no estaba creado.

2. **Rutas incorrectas en la base de datos**: Los productos tenían rutas absolutas o relativas incorrectas (ej: `/product-images/product-2.jpg`) en lugar de solo el nombre del archivo.

3. **Función saveProductImage retornaba ruta completa**: La función guardaba la ruta completa del sistema en la base de datos en lugar del nombre del archivo.

4. **Archivos de imagen no existían**: No había archivos físicos de imagen en el directorio.

## Cambios Realizados

### 1. Corrección en `src-electron/file-handler.cjs`

La función `saveProductImage` ahora retorna solo el nombre del archivo:

```javascript
// Antes:
return filePath; // Retornaba: C:\Users\...\product-2.jpg

// Ahora:
return fileName; // Retorna: product-2.jpg
```

### 2. Mejora en `getProductImage`

Se agregó mejor manejo de errores con console.error para debugging.

### 3. Actualización de tipos en `src/types/window.d.ts`

Se corrigieron las definiciones de TypeScript para `createProductService` y `updateProductService` para incluir el parámetro `imagePath` como obligatorio (no opcional).

### 4. Migración de datos

Se ejecutó el script `fix-product-images-paths.cjs` que corrigió las rutas en la base de datos:
- Coca Cola: `/product-images/product-2.jpg` → `product-2.jpg`
- Hamburguesa: `/product-images/product-3.jpg` → `product-3.jpg`
- Producto ID 5: `/product-images/product-5.jpg` → `product-5.jpg`

### 5. Creación de imágenes de prueba

Se crearon imágenes de prueba para los productos existentes usando el script `test-upload-image.cjs`.

## Cómo Probar

1. **Reinicia la aplicación** para que los cambios en el backend surtan efecto.

2. **Verifica el POS**:
   - Abre el POS
   - Deberías ver las imágenes de los productos que tienen `image_path` en la base de datos
   - Los productos sin imagen mostrarán solo el nombre

3. **Verifica el Modal de Productos**:
   - Ve a Productos y Servicios
   - Edita un producto existente
   - Si tiene imagen, debería mostrarse
   - Puedes subir una nueva imagen arrastrándola o haciendo clic

4. **Sube nuevas imágenes**:
   - Crea o edita un producto
   - Arrastra una imagen (PNG, JPG, GIF, WEBP, máx 5MB)
   - Guarda el producto
   - La imagen se guardará en `AppData/Roaming/sipark/product-images/`

## Estructura de Archivos

```
C:\Users\Esmir\AppData\Roaming\sipark\
└── product-images\
    ├── product-2.jpg
    ├── product-3.jpg
    └── product-5.jpg
```

## Scripts de Utilidad Creados

1. **check-product-images.cjs**: Verifica el estado de las imágenes en la base de datos y el sistema de archivos.

2. **fix-product-images-paths.cjs**: Migra las rutas incorrectas en la base de datos.

3. **test-upload-image.cjs**: Crea imágenes de prueba para testing.

## Notas Importantes

- Las imágenes se guardan con el formato: `product-{id}.{extension}`
- El sistema busca automáticamente entre las extensiones: png, jpg, jpeg, gif, webp
- Las imágenes se almacenan en Base64 en memoria pero como archivos binarios en disco
- El tamaño máximo por imagen es 5MB

## Si las Imágenes Aún No se Muestran

1. Verifica que el directorio existe:
   ```powershell
   ls "$env:APPDATA\sipark\product-images"
   ```

2. Verifica las rutas en la base de datos:
   ```powershell
   node check-product-images.cjs
   ```

3. Revisa la consola del navegador (F12) para ver errores de carga de imágenes.

4. Asegúrate de que la aplicación se reinició después de los cambios en el backend.

## Próximos Pasos

Para agregar imágenes a productos existentes:
1. Ve a Productos y Servicios
2. Edita el producto
3. Arrastra una imagen en la zona de carga
4. Guarda

Las imágenes aparecerán automáticamente en el POS y en el modal de productos.
