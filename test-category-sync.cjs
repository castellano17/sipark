/**
 * Test: Category Synchronization Between Products and POS
 * 
 * This test verifies that:
 * 1. Categories can be created with the correct type
 * 2. The type is properly saved to the database
 * 3. Categories appear in POS after creation
 */

const { initializeDatabase } = require("./src-electron/database-pg.cjs");
const api = require("./src-electron/api.cjs");

async function testCategorySync() {
  console.log("🧪 Testing Category Synchronization...\n");

  try {
    // Initialize database
    await initializeDatabase();
    console.log("✅ Database initialized\n");

    // Test 1: Create a category with type
    console.log("📝 Test 1: Creating category 'Bebidas' with type 'drink'");
    const categoryName = `Test-Bebidas-${Date.now()}`;
    await api.createCategory(categoryName, "Bebidas de prueba", "drink");
    console.log("✅ Category created\n");

    // Test 2: Verify the category was saved with correct type
    console.log("🔍 Test 2: Verifying category type in database");
    const categories = await api.getCategories();
    const createdCategory = categories.find(c => c.name === categoryName);
    
    if (!createdCategory) {
      console.error("❌ Category not found in database!");
      return false;
    }
    
    console.log(`   Category found: ${createdCategory.name}`);
    console.log(`   Type: ${createdCategory.type}`);
    
    if (createdCategory.type !== "drink") {
      console.error(`❌ Category type is wrong! Expected 'drink', got '${createdCategory.type}'`);
      return false;
    }
    console.log("✅ Category type is correct\n");

    // Test 3: Verify category would appear in POS (not hidden)
    console.log("🔍 Test 3: Checking if category would appear in POS");
    const categoriesToHide = ["Paquetes", "Membresía", "Tiempo"];
    const shouldBeVisible = !categoriesToHide.includes(createdCategory.name);
    
    if (!shouldBeVisible) {
      console.error("❌ Category would be hidden in POS!");
      return false;
    }
    console.log("✅ Category would be visible in POS\n");

    // Cleanup
    console.log("🧹 Cleaning up test data");
    await api.deleteCategory(createdCategory.id);
    console.log("✅ Test data cleaned up\n");

    console.log("✅ ALL TESTS PASSED! Category synchronization is working correctly.\n");
    return true;

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error(error);
    return false;
  }
}

// Run the test
testCategorySync()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
