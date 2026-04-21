/**
 * Script de prueba para la funcionalidad de imágenes en productos
 * Ejecutar con: node test-product-images.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando pruebas de funcionalidad de imágenes en productos...\n');

let testsPassed = 0;
let testsFailed = 0;

function testPass(name) {
  console.log(`✅ ${name}`);
  testsPassed++;
}

function testFail(name, error) {
  console.log(`❌ ${name}`);
  console.log(`   Error: ${error}`);
  testsFailed++;
}

// Test 1: Verificar que react-dropzone está instalado
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.dependencies['react-dropzone']) {
    testPass('react-dropzone está instalado');
  } else {
    testFail('react-dropzone NO está instalado', 'Falta en package.json');
  }
} catch (error) {
  testFail('Verificación de react-dropzone', error.message);
}

// Test 2: Verificar que file-handler.cjs tiene las nuevas funciones
try {
  const fileHandler = fs.readFileSync('src-electron/file-handler.cjs', 'utf8');
  
  if (fileHandler.includes('saveProductImage')) {
    testPass('Función saveProductImage existe en file-handler.cjs');
  } else {
    testFail('Función saveProductImage NO existe', 'No se encontró en file-handler.cjs');
  }
  
  if (fileHandler.includes('getProductImage')) {
    testPass('Función getProductImage existe en file-handler.cjs');
  } else {
    testFail('Función getProductImage NO existe', 'No se encontró en file-handler.cjs');
  }
  
  if (fileHandler.includes('deleteProductImage')) {
    testPass('Función deleteProductImage existe en file-handler.cjs');
  } else {
    testFail('Función deleteProductImage NO existe', 'No se encontró en file-handler.cjs');
  }
  
  if (fileHandler.includes('getProductImagesPath')) {
    testPass('Función getProductImagesPath existe en file-handler.cjs');
  } else {
    testFail('Función getProductImagesPath NO existe', 'No se encontró en file-handler.cjs');
  }
} catch (error) {
  testFail('Verificación de file-handler.cjs', error.message);
}

// Test 3: Verificar que database-pg.cjs tiene la columna image_path
try {
  const database = fs.readFileSync('src-electron/database-pg.cjs', 'utf8');
  
  if (database.includes('image_path TEXT')) {
    testPass('Columna image_path definida en CREATE TABLE');
  } else {
    testFail('Columna image_path NO definida', 'No se encontró en CREATE TABLE');
  }
  
  if (database.includes("column_name='image_path'")) {
    testPass('Migración de image_path existe');
  } else {
    testFail('Migración de image_path NO existe', 'No se encontró la migración');
  }
} catch (error) {
  testFail('Verificación de database-pg.cjs', error.message);
}

// Test 4: Verificar que api.cjs tiene el parámetro imagePath
try {
  const api = fs.readFileSync('src-electron/api.cjs', 'utf8');
  
  if (api.includes('imagePath = null') && api.includes('image_path')) {
    testPass('Parámetro imagePath agregado en createProductService');
  } else {
    testFail('Parámetro imagePath NO agregado', 'No se encontró en createProductService');
  }
  
  if (api.match(/updateProductService[\s\S]*?imagePath/)) {
    testPass('Parámetro imagePath agregado en updateProductService');
  } else {
    testFail('Parámetro imagePath NO agregado', 'No se encontró en updateProductService');
  }
} catch (error) {
  testFail('Verificación de api.cjs', error.message);
}

// Test 5: Verificar que main.cjs tiene los handlers de imágenes
try {
  const main = fs.readFileSync('main.cjs', 'utf8');
  
  if (main.includes('api:saveProductImage')) {
    testPass('Handler api:saveProductImage registrado en main.cjs');
  } else {
    testFail('Handler api:saveProductImage NO registrado', 'No se encontró en main.cjs');
  }
  
  if (main.includes('api:getProductImage')) {
    testPass('Handler api:getProductImage registrado en main.cjs');
  } else {
    testFail('Handler api:getProductImage NO registrado', 'No se encontró en main.cjs');
  }
  
  if (main.includes('api:deleteProductImage')) {
    testPass('Handler api:deleteProductImage registrado en main.cjs');
  } else {
    testFail('Handler api:deleteProductImage NO registrado', 'No se encontró en main.cjs');
  }
} catch (error) {
  testFail('Verificación de main.cjs', error.message);
}

// Test 6: Verificar que preload.cjs expone las funciones
try {
  const preload = fs.readFileSync('preload.cjs', 'utf8');
  
  if (preload.includes('saveProductImage:')) {
    testPass('Función saveProductImage expuesta en preload.cjs');
  } else {
    testFail('Función saveProductImage NO expuesta', 'No se encontró en preload.cjs');
  }
  
  if (preload.includes('getProductImage:')) {
    testPass('Función getProductImage expuesta en preload.cjs');
  } else {
    testFail('Función getProductImage NO expuesta', 'No se encontró en preload.cjs');
  }
  
  if (preload.includes('deleteProductImage:')) {
    testPass('Función deleteProductImage expuesta en preload.cjs');
  } else {
    testFail('Función deleteProductImage NO expuesta', 'No se encontró en preload.cjs');
  }
} catch (error) {
  testFail('Verificación de preload.cjs', error.message);
}

// Test 7: Verificar que Products.tsx tiene react-dropzone
try {
  const products = fs.readFileSync('src/components/Products.tsx', 'utf8');
  
  if (products.includes('react-dropzone')) {
    testPass('react-dropzone importado en Products.tsx');
  } else {
    testFail('react-dropzone NO importado', 'No se encontró el import');
  }
  
  if (products.includes('useDropzone')) {
    testPass('Hook useDropzone utilizado en Products.tsx');
  } else {
    testFail('Hook useDropzone NO utilizado', 'No se encontró useDropzone');
  }
  
  if (products.includes('getRootProps') && products.includes('getInputProps')) {
    testPass('Props de dropzone configurados correctamente');
  } else {
    testFail('Props de dropzone NO configurados', 'Faltan getRootProps o getInputProps');
  }
  
  if (products.includes('image_path')) {
    testPass('Campo image_path agregado a la interfaz Product');
  } else {
    testFail('Campo image_path NO agregado', 'No se encontró en la interfaz');
  }
  
  if (products.includes('saveProductImage') && products.includes('getProductImage')) {
    testPass('Funciones de API de imágenes utilizadas en Products.tsx');
  } else {
    testFail('Funciones de API NO utilizadas', 'No se encontraron las llamadas');
  }
} catch (error) {
  testFail('Verificación de Products.tsx', error.message);
}

// Test 8: Verificar que los iconos necesarios están importados
try {
  const products = fs.readFileSync('src/components/Products.tsx', 'utf8');
  
  if (products.includes('Upload') && products.includes('X') && products.includes('Image as ImageIcon')) {
    testPass('Iconos de Lucide importados correctamente');
  } else {
    testFail('Iconos NO importados', 'Faltan Upload, X o ImageIcon');
  }
} catch (error) {
  testFail('Verificación de iconos', error.message);
}

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE PRUEBAS');
console.log('='.repeat(50));
console.log(`✅ Pruebas exitosas: ${testsPassed}`);
console.log(`❌ Pruebas fallidas: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);
console.log(`🎯 Tasa de éxito: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! La funcionalidad está lista para usar.');
  console.log('\n📝 Siguiente paso: Ejecuta la aplicación y prueba manualmente:');
  console.log('   npm run dev');
} else {
  console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
}

console.log('\n');
