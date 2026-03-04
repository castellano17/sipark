const { getDatabase } = require("./database.cjs");

async function migrateDatabase() {
  const db = getDatabase();

  try {
    console.log("🔄 Ejecutando migraciones...");

    // Verificar columnas de clients
    const clientColumns = db.prepare("PRAGMA table_info(clients)").all();
    const clientColumnNames = clientColumns.map((col) => col.name);

    if (!clientColumnNames.includes("emergency_phone")) {
      db.prepare("ALTER TABLE clients ADD COLUMN emergency_phone TEXT").run();
      console.log("✅ Agregada columna emergency_phone a clients");
    }

    if (!clientColumnNames.includes("email")) {
      db.prepare("ALTER TABLE clients ADD COLUMN email TEXT").run();
      console.log("✅ Agregada columna email a clients");
    }

    if (!clientColumnNames.includes("child_name")) {
      db.prepare("ALTER TABLE clients ADD COLUMN child_name TEXT").run();
      console.log("✅ Agregada columna child_name a clients");
    }

    if (!clientColumnNames.includes("child_age")) {
      db.prepare("ALTER TABLE clients ADD COLUMN child_age INTEGER").run();
      console.log("✅ Agregada columna child_age a clients");
    }

    if (!clientColumnNames.includes("allergies")) {
      db.prepare("ALTER TABLE clients ADD COLUMN allergies TEXT").run();
      console.log("✅ Agregada columna allergies a clients");
    }

    if (!clientColumnNames.includes("special_notes")) {
      db.prepare("ALTER TABLE clients ADD COLUMN special_notes TEXT").run();
      console.log("✅ Agregada columna special_notes a clients");
    }

    // Verificar columnas de sales
    const salesColumns = db.prepare("PRAGMA table_info(sales)").all();
    const salesColumnNames = salesColumns.map((col) => col.name);

    if (!salesColumnNames.includes("subtotal")) {
      db.prepare(
        "ALTER TABLE sales ADD COLUMN subtotal REAL NOT NULL DEFAULT 0",
      ).run();
      console.log("✅ Agregada columna subtotal a sales");
    }

    if (!salesColumnNames.includes("discount")) {
      db.prepare("ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0").run();
      console.log("✅ Agregada columna discount a sales");
    }

    if (!salesColumnNames.includes("cash_box_id")) {
      db.prepare("ALTER TABLE sales ADD COLUMN cash_box_id INTEGER").run();
      console.log("✅ Agregada columna cash_box_id a sales");
    }

    // Verificar columnas de products_services
    const prodColumns = db
      .prepare("PRAGMA table_info(products_services)")
      .all();
    const prodColumnNames = prodColumns.map((col) => col.name);

    if (!prodColumnNames.includes("stock")) {
      db.prepare(
        "ALTER TABLE products_services ADD COLUMN stock INTEGER DEFAULT 0",
      ).run();
      console.log("✅ Agregada columna stock a products_services");
    }

    if (!prodColumnNames.includes("category")) {
      db.prepare(
        "ALTER TABLE products_services ADD COLUMN category TEXT",
      ).run();
      console.log("✅ Agregada columna category a products_services");
    }

    if (!prodColumnNames.includes("barcode")) {
      db.prepare("ALTER TABLE products_services ADD COLUMN barcode TEXT").run();
      console.log("✅ Agregada columna barcode a products_services");
    }

    if (!clientColumnNames.includes("emergency_phone")) {
      db.prepare("ALTER TABLE clients ADD COLUMN emergency_phone TEXT").run();
      console.log("✅ Agregada columna emergency_phone a clients");
    }

    if (!clientColumnNames.includes("email")) {
      db.prepare("ALTER TABLE clients ADD COLUMN email TEXT").run();
      console.log("✅ Agregada columna email a clients");
    }

    if (!clientColumnNames.includes("child_name")) {
      db.prepare("ALTER TABLE clients ADD COLUMN child_name TEXT").run();
      console.log("✅ Agregada columna child_name a clients");
    }

    if (!clientColumnNames.includes("child_age")) {
      db.prepare("ALTER TABLE clients ADD COLUMN child_age INTEGER").run();
      console.log("✅ Agregada columna child_age a clients");
    }

    if (!clientColumnNames.includes("allergies")) {
      db.prepare("ALTER TABLE clients ADD COLUMN allergies TEXT").run();
      console.log("✅ Agregada columna allergies a clients");
    }

    if (!clientColumnNames.includes("special_notes")) {
      db.prepare("ALTER TABLE clients ADD COLUMN special_notes TEXT").run();
      console.log("✅ Agregada columna special_notes a clients");
    }

    // Verificar columnas de active_sessions
    const sessionColumns = db
      .prepare("PRAGMA table_info(active_sessions)")
      .all();
    const sessionColumnNames = sessionColumns.map((col) => col.name);

    if (!sessionColumnNames.includes("duration_minutes")) {
      db.prepare(
        "ALTER TABLE active_sessions ADD COLUMN duration_minutes INTEGER",
      ).run();
      console.log("✅ Agregada columna duration_minutes a active_sessions");
    }

    if (!sessionColumnNames.includes("end_time")) {
      db.prepare("ALTER TABLE active_sessions ADD COLUMN end_time TEXT").run();
      console.log("✅ Agregada columna end_time a active_sessions");
    }

    if (!sessionColumnNames.includes("elapsed_minutes")) {
      db.prepare(
        "ALTER TABLE active_sessions ADD COLUMN elapsed_minutes INTEGER",
      ).run();
      console.log("✅ Agregada columna elapsed_minutes a active_sessions");
    }

    // Corregir timestamps de UTC a hora local
    const sales = db
      .prepare("SELECT id, timestamp FROM sales WHERE timestamp LIKE '%T%'")
      .all();

    if (sales && sales.length > 0) {
      console.log(`🔄 Corrigiendo ${sales.length} timestamps en sales...`);

      const updateStmt = db.prepare(
        "UPDATE sales SET timestamp = ? WHERE id = ?",
      );

      for (const sale of sales) {
        const utcDate = new Date(sale.timestamp);
        const year = utcDate.getFullYear();
        const month = String(utcDate.getMonth() + 1).padStart(2, "0");
        const day = String(utcDate.getDate()).padStart(2, "0");
        const hours = String(utcDate.getHours()).padStart(2, "0");
        const minutes = String(utcDate.getMinutes()).padStart(2, "0");
        const seconds = String(utcDate.getSeconds()).padStart(2, "0");
        const localTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        updateStmt.run(localTimestamp, sale.id);
      }

      console.log(`✅ ${sales.length} timestamps corregidos en sales`);
    }

    console.log("✅ Todas las migraciones completadas");
    return Promise.resolve();
  } catch (error) {
    console.error("❌ Error en migraciones:", error);
    return Promise.reject(error);
  }
}

module.exports = { migrateDatabase };
