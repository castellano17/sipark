const { pool, runAsync } = require('./src-electron/database-pg.cjs');

async function fix() {
  try {
    console.log("🔧 Corrigiendo rutas de imágenes de productos...\n");
    
    // Obtener productos con image_path
    const products = await runAsync("SELECT id, name, image_path FROM products_services WHERE image_path IS NOT NULL");
    console.log(`📦 Productos con image_path: ${products.rows.length}\n`);
    
    for (const product of products.rows) {
      console.log(`Procesando: ${product.name} (ID: ${product.id})`);
      console.log(`  Ruta actual: ${product.image_path}`);
      
      // Extraer solo el nombre del archivo de la ruta
      let fileName = product.image_path;
      
      // Si la ruta contiene barras, extraer solo el nombre del archivo
      if (fileName.includes('/')) {
        fileName = fileName.split('/').pop();
      }
      if (fileName.includes('\\')) {
        fileName = fileName.split('\\').pop();
      }
      
      console.log(`  Nueva ruta: ${fileName}`);
      
      // Actualizar en la base de datos
      await runAsync(
        "UPDATE products_services SET image_path = $1 WHERE id = $2",
        [fileName, product.id]
      );
      
      console.log(`  ✅ Actualizado\n`);
    }
    
    console.log("✅ Migración completada");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

fix();
