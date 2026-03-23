const { pool, runAsync } = require('./src-electron/database-pg.cjs');

async function check() {
  try {
    console.log("🔍 Investigando tablas de Mesero...");
    
    // 1. Listar tablas que empiecen con 'waiter'
    const tables = await runAsync("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'waiter%'");
    console.log("Tablas encontradas:", JSON.stringify(tables, null, 2));

    if (tables.length === 0) {
      console.log("❌ ERROR: Las tablas de mesero NO EXISTEN en la base de datos.");
    } else {
      // 2. Revisar columnas de waiter_orders
      for (const table of tables) {
        const columns = await runAsync(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${table.table_name}'`);
        console.log(`Columnas de ${table.table_name}:`, JSON.stringify(columns, null, 2));
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error en el diagnóstico:", err);
    process.exit(1);
  }
}

check();
