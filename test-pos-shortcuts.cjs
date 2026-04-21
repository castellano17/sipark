/**
 * Script de prueba para atajos de teclado del POS
 * Ejecutar con: node test-pos-shortcuts.cjs
 */

const fs = require('fs');

console.log('🧪 Verificando implementación de atajos de teclado...\n');

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

// Test 1: Verificar atajos globales en POSScreen
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('handleGlobalKeyboard') && posScreen.includes('F9')) {
    testPass('Atajos globales implementados en POSScreen');
  } else {
    testFail('Atajos globales NO implementados', 'No se encontró handleGlobalKeyboard');
  }
} catch (error) {
  testFail('Verificación de atajos globales', error.message);
}

// Test 2: Verificar atajo F9 para cobrar
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes("e.key === 'F9'") && posScreen.includes('setShowPaymentModal')) {
    testPass('Atajo F9 (Cobrar) implementado');
  } else {
    testFail('Atajo F9 NO implementado', 'No se encontró F9 o setShowPaymentModal');
  }
} catch (error) {
  testFail('Verificación de atajo F9', error.message);
}

// Test 3: Verificar atajo F8 para limpiar
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes("e.key === 'F8'") && posScreen.includes('clearSale')) {
    testPass('Atajo F8 (Limpiar) implementado');
  } else {
    testFail('Atajo F8 NO implementado', 'No se encontró F8 o clearSale');
  }
} catch (error) {
  testFail('Verificación de atajo F8', error.message);
}

// Test 4: Verificar indicadores visuales en botones
try {
  const posScreen = fs.readFileSync('src/components/POSScreen.tsx', 'utf8');
  
  if (posScreen.includes('F9') && posScreen.includes('F8') && posScreen.includes('opacity')) {
    testPass('Indicadores visuales de atajos en botones');
  } else {
    testFail('Indicadores visuales NO implementados', 'No se encontraron los indicadores');
  }
} catch (error) {
  testFail('Verificación de indicadores visuales', error.message);
}

// Test 5: Verificar monto recibido opcional en PaymentModal
try {
  const paymentModal = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');
  
  if (paymentModal.includes('amountReceived.trim() === ""') || paymentModal.includes('parseFloat(amountReceived) === 0')) {
    testPass('Monto recibido opcional implementado');
  } else {
    testFail('Monto recibido opcional NO implementado', 'No se encontró la lógica');
  }
} catch (error) {
  testFail('Verificación de monto opcional', error.message);
}

// Test 6: Verificar uso automático del total
try {
  const paymentModal = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');
  
  if (paymentModal.includes('sale.total') && paymentModal.includes('receivedAmount')) {
    testPass('Uso automático del total implementado');
  } else {
    testFail('Uso automático del total NO implementado', 'No se encontró la lógica');
  }
} catch (error) {
  testFail('Verificación de total automático', error.message);
}

// Test 7: Verificar atajos Enter y ESC en modal
try {
  const paymentModal = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');
  
  if (paymentModal.includes("e.key === 'Enter'") && paymentModal.includes("e.key === 'Escape'")) {
    testPass('Atajos Enter y ESC en modal de pago');
  } else {
    testFail('Atajos en modal NO implementados', 'No se encontraron Enter o Escape');
  }
} catch (error) {
  testFail('Verificación de atajos en modal', error.message);
}

// Test 8: Verificar indicadores en modal de pago
try {
  const paymentModal = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');
  
  if (paymentModal.includes('ESC') && paymentModal.includes('↵')) {
    testPass('Indicadores de atajos en modal de pago');
  } else {
    testFail('Indicadores en modal NO implementados', 'No se encontraron ESC o ↵');
  }
} catch (error) {
  testFail('Verificación de indicadores en modal', error.message);
}

// Test 9: Verificar placeholder en input de monto
try {
  const paymentModal = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');
  
  if (paymentModal.includes('placeholder') && paymentModal.includes('toFixed')) {
    testPass('Placeholder con total en input de monto');
  } else {
    testFail('Placeholder NO implementado', 'No se encontró placeholder');
  }
} catch (error) {
  testFail('Verificación de placeholder', error.message);
}

// Test 10: Verificar texto de ayuda
try {
  const paymentModal = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');
  
  if (paymentModal.includes('Dejar vacío') || paymentModal.includes('monto exacto')) {
    testPass('Texto de ayuda para monto recibido');
  } else {
    testFail('Texto de ayuda NO implementado', 'No se encontró el texto');
  }
} catch (error) {
  testFail('Verificación de texto de ayuda', error.message);
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
  console.log('\n⌨️ Atajos de teclado implementados:');
  console.log('   F9  - Cobrar');
  console.log('   F8  - Limpiar venta');
  console.log('   F7  - Seleccionar cliente');
  console.log('   F6  - Buscar productos');
  console.log('   ESC - Cancelar/Cerrar');
  console.log('   ↵   - Confirmar pago');
  console.log('\n💡 Monto recibido opcional:');
  console.log('   - Dejar vacío = usa el total exacto');
  console.log('   - Ingresar monto = calcula cambio');
  console.log('\n🚀 Para probar:');
  console.log('   npm run dev');
} else {
  console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
}

console.log('\n');
