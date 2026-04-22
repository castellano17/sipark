const fs = require('fs');
const path = require('path');

// Crear una imagen de prueba simple (1x1 pixel rojo en PNG)
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

const appDataPath = process.env.APPDATA || process.env.HOME;
const imagesDir = path.join(appDataPath, 'sipark', 'product-images');

// Crear directorio si no existe
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('✅ Directorio creado:', imagesDir);
}

// Crear imágenes de prueba para los productos que tienen image_path
const productIds = [2, 3, 5];

productIds.forEach(id => {
  const fileName = `product-${id}.jpg`;
  const filePath = path.join(imagesDir, fileName);
  
  const buffer = Buffer.from(testImageBase64, 'base64');
  fs.writeFileSync(filePath, buffer);
  
  console.log(`✅ Imagen de prueba creada: ${fileName}`);
});

console.log('\n📁 Archivos en el directorio:');
const files = fs.readdirSync(imagesDir);
files.forEach(f => console.log(`  - ${f}`));

console.log('\n✅ Imágenes de prueba creadas exitosamente');
console.log('💡 Ahora puedes probar el POS y el modal de productos');
