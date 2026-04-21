# Prueba de Funcionalidad: Imágenes en Productos

## ✅ Cambios Implementados

### 1. Base de Datos
- ✅ Agregada columna `image_path` a la tabla `products_services`
- ✅ Migración automática al iniciar la aplicación

### 2. Backend (Electron)
- ✅ Funciones para guardar imágenes: `saveProductImage()`
- ✅ Funciones para obtener imágenes: `getProductImage()`
- ✅ Funciones para eliminar imágenes: `deleteProductImage()`
- ✅ Directorio de almacenamiento: `userData/sipark-data/product-images/`
- ✅ Soporte para formatos: PNG, JPG, JPEG, GIF, WEBP
- ✅ Límite de tamaño: 5MB por imagen

### 3. API
- ✅ Actualizado `createProductService()` para incluir `imagePath`
- ✅ Actualizado `updateProductService()` para incluir `imagePath`
- ✅ Handlers IPC registrados en `main.cjs`
- ✅ Funciones expuestas en `preload.cjs`

### 4. Frontend (React)
- ✅ Instalada librería `react-dropzone` para drag & drop moderno
- ✅ Componente de carga de imágenes con preview
- ✅ Interfaz drag & drop intuitiva
- ✅ Validación de tamaño (máx 5MB)
- ✅ Validación de formatos (imágenes solamente)
- ✅ Botón para eliminar imagen
- ✅ Carga de imagen existente al editar producto

## 🧪 Pasos para Probar

### Prueba 1: Crear Producto con Imagen
1. Inicia la aplicación
2. Ve a "Productos y Servicios"
3. Haz clic en "Nuevo Producto"
4. Completa los campos requeridos (Nombre, Precio)
5. En la sección "Imagen del Producto":
   - **Opción A**: Arrastra una imagen desde tu explorador de archivos
   - **Opción B**: Haz clic en el área y selecciona una imagen
6. Verifica que aparezca el preview de la imagen
7. Haz clic en "Crear"
8. ✅ Verifica que el producto se creó correctamente

### Prueba 2: Editar Producto y Cambiar Imagen
1. Selecciona un producto existente con imagen
2. Haz clic en el botón de editar (ícono de lápiz)
3. Verifica que la imagen actual se muestre
4. Haz clic en "Eliminar" para quitar la imagen actual
5. Arrastra una nueva imagen
6. Haz clic en "Actualizar"
7. ✅ Verifica que la imagen se actualizó

### Prueba 3: Crear Producto sin Imagen
1. Crea un nuevo producto
2. NO agregues ninguna imagen
3. Haz clic en "Crear"
4. ✅ Verifica que el producto se creó sin problemas

### Prueba 4: Validación de Tamaño
1. Intenta subir una imagen mayor a 5MB
2. ✅ Verifica que aparezca el mensaje: "La imagen no debe superar 5MB"

### Prueba 5: Validación de Formato
1. Intenta arrastrar un archivo que NO sea imagen (PDF, TXT, etc.)
2. ✅ Verifica que el sistema solo acepte imágenes

### Prueba 6: Eliminar Imagen de Producto Existente
1. Edita un producto que tiene imagen
2. Haz clic en "Eliminar" (botón con X en la esquina de la imagen)
3. Haz clic en "Actualizar" sin agregar nueva imagen
4. ✅ Verifica que el producto ya no tiene imagen

## 📁 Ubicación de las Imágenes

Las imágenes se guardan en:
```
Windows: C:\Users\[Usuario]\AppData\Roaming\sipark\sipark-data\product-images\
Mac: ~/Library/Application Support/sipark/sipark-data/product-images/
Linux: ~/.config/sipark/sipark-data/product-images/
```

Formato de nombre: `product-[ID].[extensión]`
Ejemplo: `product-15.jpg`, `product-23.png`

## 🎨 Características de la UI

### Área de Drag & Drop
- Borde punteado gris cuando está inactiva
- Borde azul y fondo azul claro cuando arrastras sobre ella
- Ícono de upload centrado
- Texto instructivo claro

### Preview de Imagen
- Imagen a tamaño completo (altura 192px)
- Bordes redondeados
- Botón "Eliminar" en la esquina superior derecha
- Hover effect en el botón

### Validaciones Visuales
- Notificación de error si el archivo es muy grande
- Solo acepta formatos de imagen válidos
- Feedback visual durante drag & drop

## 🔧 Próximos Pasos (Opcional)

Si quieres mejorar aún más la funcionalidad:

1. **Mostrar imágenes en el POS**: Agregar las imágenes en la vista de productos del POS
2. **Optimización de imágenes**: Comprimir automáticamente las imágenes grandes
3. **Múltiples imágenes**: Permitir varias imágenes por producto
4. **Galería**: Vista de galería en el listado de productos
5. **Crop/Edición**: Herramienta para recortar imágenes antes de guardar

## ❓ Solución de Problemas

### La imagen no se guarda
- Verifica que la aplicación tenga permisos de escritura
- Revisa la consola de desarrollador (F12) para ver errores
- Verifica que el directorio `product-images` se haya creado

### La imagen no se muestra al editar
- Verifica que el archivo exista en el directorio de imágenes
- Revisa que el `image_path` esté guardado en la base de datos
- Verifica la consola para errores de lectura

### Error de base de datos
- Si ves errores relacionados con la columna `image_path`, reinicia la aplicación
- La migración se ejecuta automáticamente al iniciar

## 📝 Notas Técnicas

- Las imágenes se guardan en formato Base64 durante la transferencia
- Se convierten a archivos binarios en el servidor
- La ruta se guarda en la base de datos como TEXT
- El sistema es compatible con PostgreSQL
- La migración es segura y no afecta datos existentes
