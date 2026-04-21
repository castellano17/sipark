/**
 * Script de prueba para verificar imágenes en el POS
 * Ejecutar con: node test-pos-images.cjs
 */

const fs = require('fs');

console.log('🧪 Verificando implementación de imágenes en el POS...\n');

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

// Test 1: Verificar que POSScreen.tsx tiene el estado de imágenes
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('productImages') && posScreen.includes('setProductImages')) {
    testPass('Estado productImages agregado en POSScreen');
  } else {
    testFail('Estado productImages NO encontrado', 'No se encontró en POSScreen.tsx');
  }
} catch (error) {
  testFail('Verificación de estado productImages', error.message);
}

// Test 2: Verificar que se cargan las imágenes en loadProducts
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('getProductImage') && posScreen.includes('setProductImages')) {
    testPass('Carga de imágenes implementada en loadProducts');
  } else {
    testFail('Carga de imágenes NO implementada', 'No se encontró getProductImage');
  }
} catch (error) {
  testFail('Verificación de carga de imágenes', error.message);
}

// Test 3: Verificar que se muestra la imagen en las tarjetas
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('productImages[product.id]') && posScreen.includes('<img')) {
    testPass('Renderizado de imágenes en tarjetas de productos');
  } else {
    testFail('Renderizado de imágenes NO implementado', 'No se encontró productImages[product.id]');
  }
} catch (error) {
  testFail('Verificación de renderizado de imágenes', error.message);
}

// Test 4: Verificar que hay placeholder para productos sin imagen
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('Package') && posScreen.includes('from-gray-100 to-gray-200')) {
    testPass('Placeholder para productos sin imagen implementado');
  } else {
    testFail('Placeholder NO implementado', 'No se encontró el componente Package o el degradado');
  }
} catch (error) {
  testFail('Verificación de placeholder', error.message);
}

// Test 5: Verificar que Package está importado
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.match(/import.*Package.*from.*lucide-react/)) {
    testPass('Ícono Package importado correctamente');
  } else {
    testFail('Ícono Package NO importado', 'No se encontró en los imports');
  }
} catch (error) {
  testFail('Verificación de import Package', error.message);
}

// Test 6: Verificar que las imágenes tienen estilos correctos
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('object-cover') && posScreen.includes('h-32')) {
    testPass('Estilos de imagen configurados correctamente');
  } else {
    testFail('Estilos de imagen NO configurados', 'Faltan object-cover o h-32');
  }
} catch (error) {
  testFail('Verificación de estilos', error.message);
}

// Test 7: Verificar que hay efecto hover mejorado
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('hover:shadow-lg')) {
    testPass('Efecto hover mejorado implementado');
  } else {
    testFail('Efecto hover NO mejorado', 'No se encontró hover:shadow-lg');
  }
} catch (error) {
  testFail('Verificación de efecto hover', error.message);
}

// Test 8: Verificar que las tarjetas tienen overflow hidden
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('overflow-hidden')) {
    testPass('Overflow hidden configurado en tarjetas');
  } else {
    testFail('Overflow hidden NO configurado', 'No se encontró overflow-hidden');
  }
} catch (error) {
  testFail('Verificación de overflow', error.message);
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
  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
  console.log('\n📝 Las imágenes ahora se muestran en el POS.');
  console.log('\n🚀 Para probar:');
  console.log('   1. npm run dev');
  console.log('   2. Agrega imágenes a algunos productos');
  console.log('   3. Ve al POS y verás las imágenes');
} else {
  console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
}

console.log('\n');
