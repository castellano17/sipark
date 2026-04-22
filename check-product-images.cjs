const { pool, runAsync } = require('./src-electron/database-pg.cjs');
const path = require('path');
const fs = require('fs');

async function check() {
  try {
    console.log("🔍 Verificando imágenes de productos...\n");
    
    // 1. Verificar productos con image_path
    const products = await runAsync("SELECT id, name, image_path FROM products_services WHERE image_path IS NOT NULL");
    console.log(`📦 Productos con image_path en DB: ${products.rows.length}`);
    
    if (products.rows.length > 0) {
      console.log("\nProductos con imagen:");
      products.rows.forEach(p => {
        console.log(`  - ID: ${p.id}, Nombre: ${p.name}, Path: ${p.image_path}`);
      });
    }
    
    // 2. Verificar directorio de imágenes
    const appDataPath = process.env.APPDATA || process.env.HOME;
    const imagesDir = path.join(appDataPath, 'sipark', 'product-images');
    
    console.log(`\n📁 Directorio de imágenes: ${imagesDir}`);
    
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      console.log(`✅ Directorio existe con ${files.length} archivos:`);
      files.forEach(f => console.log(`  - ${f}`));
    } else {
      console.log("❌ El directorio NO existe");
    }
    
    // 3. Verificar todos los productos
    const allProducts = await runAsync("SELECT id, name, type, category FROM products_services LIMIT 10");
    console.log(`\n📋 Primeros 10 productos en DB:`);
    allProducts.rows.forEach(p => {
      console.log(`  - ID: ${p.id}, Nombre: ${p.name}, Tipo: ${p.type}, Categoría: ${p.category}`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

check();
