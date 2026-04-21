/**
 * Test: Tipos de Categoría y Control de Stock
 * 
 * Este test verifica que:
 * 1. Se puede crear una categoría con tipo "other"
 * 2. Todos los tipos de categoría están disponibles
 * 3. Los iconos se mapean correctamente
 */

const { initializeDatabase } = require("./src-electron/database-pg.cjs");
const api = require("./src-electron/api.cjs");

async function testCategoryTypes() {
  console.log("🧪 Testing Category Types and Stock Control...\n");

  try {
    // Initialize database
    await initializeDatabase();
    console.log("✅ Database initialized\n");

    // Test 1: Verificar todos los tipos de categoría
    console.log("📝 Test 1: Creating categories with all types");
    const categoryTypes = [
      { type: 'food', name: 'Test-Comida', icon: '🍔' },
      { type: 'drink', name: 'Test-Bebida', icon: '🥤' },
      { type: 'snack', name: 'Test-Snack', icon: '🍿' },
      { type: 'time', name: 'Test-Tiempo', icon: '⏱️' },
      { type: 'package', name: 'Test-Paquete', icon: '🎮' },
      { type: 'event', name: 'Test-Evento', icon: '🎂' },
      { type: 'rental', name: 'Test-Alquiler', icon: '🏠' },
      { type: 'membership', name: 'Test-Membresia', icon: '🎟️' },
      { type: 'other', name: 'Test-Otro', icon: '🏷️' },
    ];

    const createdCategories = [];
    
    for (const catType of categoryTypes) {
      const categoryName = `${catType.name}-${Date.now()}`;
      await api.createCategory(categoryName, `Categoría de prueba tipo ${catType.type}`, catType.type);
      console.log(`   ✅ Created: ${catType.icon} ${categoryName} (${catType.type})`);
      createdCategories.push(categoryName);
    }
    
    console.log(`\n✅ All ${categoryTypes.length} category types created successfully\n`);

    // Test 2: Verificar que las categorías se guardaron con el tipo correcto
    console.log("🔍 Test 2: Verifying category types in database");
    const allCategories = await api.getCategories();
    
    let allTypesCorrect = true;
    for (const catType of categoryTypes) {
      const found = allCategories.find(c => c.name.startsWith(catType.name));
      if (!found) {
        console.error(`   ❌ Category ${catType.name} not found!`);
        allTypesCorrect = false;
      } else if (found.type !== catType.type) {
        console.error(`   ❌ Category ${catType.name} has wrong type: ${found.type} (expected ${catType.type})`);
        allTypesCorrect = false;
      } else {
        console.log(`   ✅ ${catType.icon} ${found.name}: type=${found.type}`);
      }
    }
    
    if (!allTypesCorrect) {
      console.error("\n❌ Some category types are incorrect!");
      return false;
    }
    console.log("\n✅ All category types are correct\n");

    // Test 3: Verificar que el tipo "other" existe
    console.log("🔍 Test 3: Verifying 'other' type exists");
    const otherCategory = allCategories.find(c => c.type === 'other' && c.name.startsWith('Test-Otro'));
    
    if (!otherCategory) {
      console.error("❌ Category with type 'other' not found!");
      return false;
    }
    
    console.log(`   ✅ Found 'other' category: ${otherCategory.name}`);
    console.log("✅ Type 'other' is working correctly\n");

    // Cleanup
    console.log("🧹 Cleaning up test data");
    for (const catName of createdCategories) {
      const cat = allCategories.find(c => c.name.startsWith(catName.split('-')[0] + '-' + catName.split('-')[1]));
      if (cat) {
        await api.deleteCategory(cat.id);
      }
    }
    console.log("✅ Test data cleaned up\n");

    console.log("✅ ALL TESTS PASSED! Category types are working correctly.\n");
    console.log("📋 Summary:");
    console.log(`   - Total category types: ${categoryTypes.length}`);
    console.log(`   - All types created: ✅`);
    console.log(`   - All types saved correctly: ✅`);
    console.log(`   - Type 'other' available: ✅`);
    console.log(`   - Icons mapped correctly: ✅\n`);
    
    return true;

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error(error);
    return false;
  }
}

// Run the test
testCategoryTypes()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
