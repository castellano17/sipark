const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer configuración de la base de datos
function getDbConfig() {
  const configPath = path.join(process.env.APPDATA || process.env.HOME, '.sipark', 'db-config.json');
  
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config;
  }
  
  // Configuración por defecto
  return {
    host: 'localhost',
    port: 5432,
    database: 'sipark',
    user: 'postgres',
    password: 'postgres'
  };
}

async function migrateDatabase() {
  const config = getDbConfig();
  const pool = new Pool(config);

  try {
    console.log('Conectando a la base de datos...');
    
    // Verificar si la columna ya existe
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products_services' 
      AND column_name = 'image_path'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✓ La columna image_path ya existe en products_services');
    } else {
      console.log('Agregando columna image_path a products_services...');
      await pool.query(`
        ALTER TABLE products_services 
        ADD COLUMN image_path TEXT
      `);
      console.log('✓ Columna image_path agregada exitosamente');
    }

    console.log('\n✓ Migración completada exitosamente');
  } catch (error) {
    console.error('Error en la migración:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar migración
migrateDatabase()
  .then(() => {
    console.log('\nPuedes cerrar esta ventana.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError:', error);
    process.exit(1);
  });
