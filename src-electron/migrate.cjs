const { getDatabase } = require("./database-pg.cjs");

// NOTA: Las migraciones ya no son necesarias con PostgreSQL
// Las tablas se crean automáticamente en database-pg.cjs

async function migrateDatabase() {
  const db = getDatabase();

  try {

    // Verificar columnas de clients
    const clientColumns = db.prepare("PRAGMA table_info(clients)").all();
    const clientColumnNames = clientColumns.map((col) => col.name);

    if (!clientColumnNames.includes("child_name")) {
      db.prepare("ALTER TABLE clients ADD COLUMN child_name TEXT").run();
    }

    if (!clientColumnNames.includes("child_age")) {
      db.prepare("ALTER TABLE clients ADD COLUMN child_age INTEGER").run();
    }

    if (!clientColumnNames.includes("allergies")) {
      db.prepare("ALTER TABLE clients ADD COLUMN allergies TEXT").run();
    }

    if (!clientColumnNames.includes("special_notes")) {
      db.prepare("ALTER TABLE clients ADD COLUMN special_notes TEXT").run();
    }

    // Verificar columnas de sales
    const salesColumns = db.prepare("PRAGMA table_info(sales)").all();
    const salesColumnNames = salesColumns.map((col) => col.name);

    if (!salesColumnNames.includes("subtotal")) {
      db.prepare(
        "ALTER TABLE sales ADD COLUMN subtotal REAL NOT NULL DEFAULT 0",
      ).run();
    }

    if (!salesColumnNames.includes("discount")) {
      db.prepare("ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0").run();
    }

    if (!salesColumnNames.includes("cash_box_id")) {
      db.prepare("ALTER TABLE sales ADD COLUMN cash_box_id INTEGER").run();
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
    }

    if (!prodColumnNames.includes("category")) {
      db.prepare(
        "ALTER TABLE products_services ADD COLUMN category TEXT",
      ).run();
    }

    if (!prodColumnNames.includes("barcode")) {
      db.prepare("ALTER TABLE products_services ADD COLUMN barcode TEXT").run();
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
    }

    if (!sessionColumnNames.includes("end_time")) {
      db.prepare("ALTER TABLE active_sessions ADD COLUMN end_time TEXT").run();
    }

    if (!sessionColumnNames.includes("elapsed_minutes")) {
      db.prepare(
        "ALTER TABLE active_sessions ADD COLUMN elapsed_minutes INTEGER",
      ).run();
    }

    // Corregir timestamps de UTC a hora local
    const sales = db
      .prepare("SELECT id, timestamp FROM sales WHERE timestamp LIKE '%T%'")
      .all();

    if (sales && sales.length > 0) {

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

    }

    return Promise.resolve();
  } catch (error) {
    console.error("❌ Error en migraciones:", error);
    return Promise.reject(error);
  }
}

module.exports = { migrateDatabase };
