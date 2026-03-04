const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");

let db = null;

function initializeDatabase() {
  try {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "sipark.db");

    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma("foreign_keys = ON");

    createTables();
    migrateMembershipTables();

    console.log("✅ Base de datos inicializada:", dbPath);
    return Promise.resolve(db);
  } catch (error) {
    console.error("❌ Error inicializando BD:", error);
    return Promise.reject(error);
  }
}

function createTables() {
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_name TEXT,
        phone TEXT,
        emergency_phone TEXT,
        email TEXT,
        child_name TEXT,
        child_age INTEGER,
        allergies TEXT,
        special_notes TEXT,
        photo_path TEXT,
        is_member BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS active_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        elapsed_minutes INTEGER,
        package_id INTEGER,
        duration_minutes INTEGER,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )`,
      `CREATE TABLE IF NOT EXISTS products_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        barcode TEXT UNIQUE,
        stock INTEGER DEFAULT 0,
        duration_minutes INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        client_name TEXT,
        total REAL NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        payment_method TEXT,
        cash_box_id INTEGER,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(id)
      )`,
      `CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (product_id) REFERENCES products_services(id)
      )`,
      `CREATE TABLE IF NOT EXISTS cash_boxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opening_amount REAL NOT NULL,
        closing_amount REAL,
        expected_amount REAL,
        difference REAL,
        opened_at DATETIME NOT NULL,
        closed_at DATETIME,
        opened_by TEXT,
        closed_by TEXT,
        status TEXT DEFAULT 'open',
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS cash_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cash_box_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(id)
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        invoice_number TEXT NOT NULL,
        invoice_date DATE NOT NULL,
        total_amount REAL NOT NULL,
        total_items INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      )`,
      `CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
        FOREIGN KEY (product_id) REFERENCES products_services(id)
      )`,
      `CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        adjustment_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        reason TEXT NOT NULL,
        notes TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products_services(id)
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        photo_path TEXT,
        role TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS user_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        module TEXT NOT NULL,
        can_view BOOLEAN DEFAULT 0,
        can_create BOOLEAN DEFAULT 0,
        can_edit BOOLEAN DEFAULT 0,
        can_delete BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS user_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        target_user_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (target_user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        old_price REAL NOT NULL,
        new_price REAL NOT NULL,
        changed_by TEXT,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products_services(id)
      )`,
      `CREATE TABLE IF NOT EXISTS sales_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        user_id INTEGER,
        reason TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        duration_days INTEGER NOT NULL,
        benefits TEXT,
        membership_type TEXT DEFAULT 'standard',
        max_sessions_per_day INTEGER,
        discount_percentage REAL DEFAULT 0,
        priority_level INTEGER DEFAULT 0,
        auto_renew BOOLEAN DEFAULT 0,
        grace_period_days INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS client_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        membership_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT DEFAULT 'active',
        payment_amount REAL NOT NULL,
        payment_method TEXT,
        invoice_number TEXT,
        auto_renew BOOLEAN DEFAULT 0,
        renewed_from_id INTEGER,
        cancelled_at DATETIME,
        cancelled_by INTEGER,
        cancellation_reason TEXT,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (membership_id) REFERENCES memberships(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (renewed_from_id) REFERENCES client_memberships(id),
        FOREIGN KEY (cancelled_by) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS membership_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_membership_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        usage_date DATE NOT NULL,
        usage_type TEXT NOT NULL,
        session_id INTEGER,
        sale_id INTEGER,
        discount_applied REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_membership_id) REFERENCES client_memberships(id),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (session_id) REFERENCES active_sessions(id),
        FOREIGN KEY (sale_id) REFERENCES sales(id)
      )`,
      `CREATE TABLE IF NOT EXISTS membership_renewals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        old_membership_id INTEGER NOT NULL,
        new_membership_id INTEGER NOT NULL,
        renewal_date DATE NOT NULL,
        old_end_date DATE NOT NULL,
        new_end_date DATE NOT NULL,
        payment_amount REAL NOT NULL,
        payment_method TEXT,
        discount_applied REAL DEFAULT 0,
        notes TEXT,
        processed_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (old_membership_id) REFERENCES client_memberships(id),
        FOREIGN KEY (new_membership_id) REFERENCES client_memberships(id),
        FOREIGN KEY (processed_by) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS client_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        visit_date DATE NOT NULL,
        check_in_time DATETIME NOT NULL,
        check_out_time DATETIME,
        duration_minutes INTEGER,
        amount_paid REAL DEFAULT 0,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS package_features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS package_feature_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS package_included_features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id INTEGER NOT NULL,
        feature_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (package_id) REFERENCES products_services(id) ON DELETE CASCADE,
        FOREIGN KEY (feature_id) REFERENCES package_features(id) ON DELETE CASCADE,
        UNIQUE(package_id, feature_id)
      )`,
      `CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        event_date DATE NOT NULL,
        event_time TEXT NOT NULL,
        package_id INTEGER NOT NULL,
        package_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        deposit_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'unpaid',
        sale_id INTEGER,
        final_sale_id INTEGER,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (package_id) REFERENCES products_services(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (final_sale_id) REFERENCES sales(id)
      )`,
      `CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_number TEXT NOT NULL UNIQUE,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        client_address TEXT,
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        total REAL NOT NULL,
        valid_until DATE,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS quotation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER NOT NULL,
        product_id INTEGER,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products_services(id)
      )`,
    ];

    tables.forEach((sql) => {
      db.exec(sql);
    });
  } catch (error) {
    console.error("Error creando tablas:", error);
    throw error;
  }
}

function getDatabase() {
  if (!db) {
    throw new Error("Base de datos no inicializada");
  }
  return db;
}

function runAsync(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return Promise.resolve({
      lastID: result.lastInsertRowid,
      changes: result.changes,
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

function getAsync(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return Promise.resolve(row);
  } catch (err) {
    return Promise.reject(err);
  }
}

function allAsync(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return Promise.resolve(rows || []);
  } catch (err) {
    return Promise.reject(err);
  }
}

// Función de migración para agregar columnas a tablas existentes
function migrateMembershipTables() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("🔄 Verificando migraciones de membresías...");

      const migrations = [
        // Memberships table
        "ALTER TABLE memberships ADD COLUMN membership_type TEXT DEFAULT 'standard'",
        "ALTER TABLE memberships ADD COLUMN max_sessions_per_day INTEGER",
        "ALTER TABLE memberships ADD COLUMN discount_percentage REAL DEFAULT 0",
        "ALTER TABLE memberships ADD COLUMN priority_level INTEGER DEFAULT 0",
        "ALTER TABLE memberships ADD COLUMN auto_renew BOOLEAN DEFAULT 0",
        "ALTER TABLE memberships ADD COLUMN grace_period_days INTEGER DEFAULT 0",
        // Client memberships table
        "ALTER TABLE client_memberships ADD COLUMN payment_method TEXT",
        "ALTER TABLE client_memberships ADD COLUMN invoice_number TEXT",
        "ALTER TABLE client_memberships ADD COLUMN auto_renew BOOLEAN DEFAULT 0",
        "ALTER TABLE client_memberships ADD COLUMN renewed_from_id INTEGER",
        "ALTER TABLE client_memberships ADD COLUMN cancelled_at DATETIME",
        "ALTER TABLE client_memberships ADD COLUMN cancelled_by INTEGER",
        "ALTER TABLE client_memberships ADD COLUMN cancellation_reason TEXT",
        // Reservations table
        "ALTER TABLE reservations ADD COLUMN payment_status TEXT DEFAULT 'unpaid'",
        "ALTER TABLE reservations ADD COLUMN sale_id INTEGER",
        "ALTER TABLE reservations ADD COLUMN final_sale_id INTEGER",
        "ALTER TABLE reservations ADD COLUMN completed_at DATETIME",
        // Sales table
        "ALTER TABLE sales ADD COLUMN client_name TEXT",
      ];

      for (const sql of migrations) {
        try {
          await runAsync(sql);
        } catch (err) {
          // Ignorar si la columna ya existe
          if (!err.message.includes("duplicate column name")) {
            console.error("Error en migración:", err.message);
          }
        }
      }

      // Migración especial para sale_items.product_id (hacerlo nullable)
      try {
        console.log("🔄 Migrando sale_items para permitir product_id NULL...");

        // Verificar si necesitamos migrar
        const tableInfo = await allAsync("PRAGMA table_info(sale_items)");
        const productIdColumn = tableInfo.find(
          (col) => col.name === "product_id",
        );

        if (productIdColumn && productIdColumn.notnull === 1) {
          // Necesitamos recrear la tabla para cambiar la constraint
          await runAsync("BEGIN TRANSACTION");

          // Crear tabla temporal con la nueva estructura
          await runAsync(`
            CREATE TABLE sale_items_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              sale_id INTEGER NOT NULL,
              product_id INTEGER,
              product_name TEXT NOT NULL,
              quantity INTEGER NOT NULL,
              unit_price REAL NOT NULL,
              subtotal REAL NOT NULL,
              FOREIGN KEY (sale_id) REFERENCES sales(id),
              FOREIGN KEY (product_id) REFERENCES products_services(id)
            )
          `);

          // Copiar datos existentes
          await runAsync(`
            INSERT INTO sale_items_new (id, sale_id, product_id, product_name, quantity, unit_price, subtotal)
            SELECT id, sale_id, product_id, product_name, quantity, unit_price, subtotal
            FROM sale_items
          `);

          // Eliminar tabla vieja
          await runAsync("DROP TABLE sale_items");

          // Renombrar tabla nueva
          await runAsync("ALTER TABLE sale_items_new RENAME TO sale_items");

          await runAsync("COMMIT");
          console.log("✅ Migración de sale_items completada");
        } else {
          console.log("✅ sale_items ya permite product_id NULL");
        }
      } catch (err) {
        await runAsync("ROLLBACK").catch(() => {});
        console.error("❌ Error migrando sale_items:", err.message);
        // No rechazar, continuar con otras migraciones
      }

      console.log("✅ Migraciones de membresías completadas");
      resolve();
    } catch (error) {
      console.error("❌ Error en migraciones:", error);
      reject(error);
    }
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  runAsync,
  getAsync,
  allAsync,
};
