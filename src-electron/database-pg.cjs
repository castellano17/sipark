const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

let pool = null;

// Configuración de la base de datos
// Puede ser configurada mediante variables de entorno o archivo de configuración
function getConfig() {
  const configPath = path.join(process.cwd(), "db-config.json");

  // Intentar leer configuración desde archivo
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return config;
    } catch (error) {
      console.warn(
        "⚠️ Error leyendo db-config.json, usando valores por defecto",
      );
    }
  }

  // Configuración por defecto para PostgreSQL del sistema
  const defaultConfig = {
    host: process.env.DB_HOST || "127.0.0.1", // Usar IPv4 explícitamente
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "ludoteca_pos",
    user: process.env.DB_USER || "ludoteca_user",
    password: process.env.DB_PASSWORD || "ludoteca2024",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // 10 segundos para dar más tiempo
  };

  // Crear el archivo de configuración automáticamente si no existe
  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify(defaultConfig, null, 2),
      "utf8",
    );
    console.log("✅ Archivo db-config.json creado automáticamente");
  } catch (error) {
    console.warn("⚠️ No se pudo crear db-config.json:", error.message);
  }

  return defaultConfig;
}

async function initializeDatabase() {
  try {
    const config = getConfig();

    console.log(
      `🔌 Conectando a PostgreSQL en ${config.host}:${config.port}...`,
    );

    pool = new Pool(config);

    // Probar la conexión
    const client = await pool.connect();
    console.log("✅ Conexión a PostgreSQL establecida");
    client.release();

    // Crear tablas
    await createTables();
    console.log("✅ Base de datos PostgreSQL inicializada");

    return pool;
  } catch (error) {
    console.error("❌ Error inicializando PostgreSQL:", error.message);
    throw error;
  }
}

async function createTables() {
  const tables = [
    // Crear users PRIMERO porque otras tablas la referencian
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(50),
      photo_path TEXT,
      role VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      parent_name VARCHAR(255),
      phone VARCHAR(50) NOT NULL,
      emergency_phone VARCHAR(50),
      email VARCHAR(255),
      child_name VARCHAR(255),
      child_age INTEGER,
      allergies TEXT,
      special_notes TEXT,
      photo_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS products_services (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      type VARCHAR(50) NOT NULL,
      category VARCHAR(100),
      barcode VARCHAR(100) UNIQUE,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      duration_minutes INTEGER,
      last_sale_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS cash_boxes (
      id SERIAL PRIMARY KEY,
      opening_amount DECIMAL(10,2) NOT NULL,
      closing_amount DECIMAL(10,2),
      expected_amount DECIMAL(10,2),
      difference DECIMAL(10,2),
      opened_at TIMESTAMP NOT NULL,
      closed_at TIMESTAMP,
      opened_by VARCHAR(100),
      closed_by VARCHAR(100),
      status VARCHAR(50) DEFAULT 'open',
      notes TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS active_sessions (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      elapsed_minutes INTEGER,
      duration_minutes INTEGER,
      package_id INTEGER,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`,

    `CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      client_id INTEGER,
      total DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_method VARCHAR(50),
      cash_box_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products_services(id)
    )`,

    `CREATE TABLE IF NOT EXISTS cash_movements (
      id SERIAL PRIMARY KEY,
      cash_box_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(id)
    )`,

    `CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(100),
      address TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER NOT NULL,
      invoice_number VARCHAR(100) NOT NULL,
      invoice_date DATE NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      total_items INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )`,

    `CREATE TABLE IF NOT EXISTS purchase_items (
      id SERIAL PRIMARY KEY,
      purchase_order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (product_id) REFERENCES products_services(id)
    )`,

    `CREATE TABLE IF NOT EXISTS stock_adjustments (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      adjustment_type VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      created_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products_services(id)
    )`,

    `CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      module VARCHAR(50) NOT NULL,
      can_view BOOLEAN DEFAULT FALSE,
      can_create BOOLEAN DEFAULT FALSE,
      can_edit BOOLEAN DEFAULT FALSE,
      can_delete BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, module)
    )`,

    `CREATE TABLE IF NOT EXISTS user_audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      action VARCHAR(100) NOT NULL,
      target_user_id INTEGER,
      details TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (target_user_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS memberships (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      duration_days INTEGER NOT NULL,
      benefits TEXT,
      membership_type VARCHAR(50) DEFAULT 'standard',
      max_sessions_per_day INTEGER,
      discount_percentage DECIMAL(5,2) DEFAULT 0,
      priority_level INTEGER DEFAULT 0,
      auto_renew BOOLEAN DEFAULT FALSE,
      grace_period_days INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS client_memberships (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      membership_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      payment_amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50),
      notes TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (membership_id) REFERENCES memberships(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS membership_renewals (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      old_membership_id INTEGER NOT NULL,
      new_membership_id INTEGER NOT NULL,
      renewal_date DATE NOT NULL,
      old_end_date DATE NOT NULL,
      new_end_date DATE NOT NULL,
      payment_amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50),
      discount_applied DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      processed_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (old_membership_id) REFERENCES memberships(id),
      FOREIGN KEY (new_membership_id) REFERENCES memberships(id),
      FOREIGN KEY (processed_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS membership_usage (
      id SERIAL PRIMARY KEY,
      client_membership_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      usage_date DATE NOT NULL,
      usage_type VARCHAR(50) NOT NULL,
      session_id INTEGER,
      sale_id INTEGER,
      discount_applied DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_membership_id) REFERENCES client_memberships(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (session_id) REFERENCES active_sessions(id),
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    )`,

    `CREATE TABLE IF NOT EXISTS client_visits (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      visit_date DATE NOT NULL,
      check_in_time TIMESTAMP NOT NULL,
      check_out_time TIMESTAMP,
      duration_minutes INTEGER,
      amount_paid DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS package_features (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS package_feature_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS package_included_features (
      id SERIAL PRIMARY KEY,
      package_id INTEGER NOT NULL,
      feature_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES products_services(id) ON DELETE CASCADE,
      FOREIGN KEY (feature_id) REFERENCES package_features(id) ON DELETE CASCADE,
      UNIQUE(package_id, feature_id)
    )`,

    `CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      client_name VARCHAR(255),
      client_phone VARCHAR(50),
      client_email VARCHAR(255),
      package_id INTEGER,
      package_name VARCHAR(255),
      event_date DATE NOT NULL,
      event_time TIME NOT NULL,
      num_children INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      total_amount DECIMAL(10,2) NOT NULL,
      deposit_amount DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (package_id) REFERENCES products_services(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      quotation_number VARCHAR(50) NOT NULL UNIQUE,
      client_id INTEGER NOT NULL,
      client_name VARCHAR(255) NOT NULL,
      client_phone VARCHAR(50),
      client_email VARCHAR(255),
      event_date DATE,
      event_time TIME,
      num_children INTEGER,
      total_amount DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      final_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      valid_until DATE,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS quotation_items (
      id SERIAL PRIMARY KEY,
      quotation_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products_services(id)
    )`,

    `CREATE TABLE IF NOT EXISTS price_history (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      old_price DECIMAL(10,2) NOT NULL,
      new_price DECIMAL(10,2) NOT NULL,
      reason TEXT,
      changed_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products_services(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS sales_audit (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER NOT NULL,
      user_id INTEGER,
      action VARCHAR(50) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
  ];

  for (const sql of tables) {
    try {
      await pool.query(sql);
    } catch (error) {
      console.error("Error creando tabla:", error.message);
      throw error;
    }
  }

  // Crear índices para mejorar el rendimiento
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_barcode ON products_services(barcode)`,
    `CREATE INDEX IF NOT EXISTS idx_products_type ON products_services(type)`,
    `CREATE INDEX IF NOT EXISTS idx_active_sessions_status ON active_sessions(status)`,
    `CREATE INDEX IF NOT EXISTS idx_cash_boxes_status ON cash_boxes(status)`,
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    `CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_audit_user ON user_audit_log(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_audit_created ON user_audit_log(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_client_memberships_client ON client_memberships(client_id)`,
    `CREATE INDEX IF NOT EXISTS idx_client_memberships_status ON client_memberships(status)`,
    `CREATE INDEX IF NOT EXISTS idx_client_visits_client ON client_visits(client_id)`,
    `CREATE INDEX IF NOT EXISTS idx_client_visits_date ON client_visits(visit_date)`,
  ];

  for (const sql of indexes) {
    try {
      await pool.query(sql);
    } catch (error) {
      // Los índices pueden ya existir, no es crítico
      console.warn("Advertencia creando índice:", error.message);
    }
  }
}

function getDatabase() {
  if (!pool) {
    throw new Error("Base de datos no inicializada");
  }
  return pool;
}

// Función helper para convertir sintaxis SQLite a PostgreSQL
function convertSqliteToPostgres(sql) {
  let pgSql = sql;

  // Convertir ? a $1, $2, $3, etc.
  let paramIndex = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

  // Convertir julianday() - DEBE IR ANTES de DATE()
  // CAST((julianday(cm.end_date) - julianday('now')) AS INTEGER) -> CAST((cm.end_date - CURRENT_DATE) AS INTEGER)
  pgSql = pgSql.replace(
    /CAST\(\(julianday\(([^)]+)\)\s*-\s*julianday\('now'\)\)\s+AS\s+INTEGER\)/gi,
    "CAST(($1 - CURRENT_DATE) AS INTEGER)",
  );

  // julianday(column) - julianday('now') -> (column - CURRENT_DATE)
  pgSql = pgSql.replace(
    /julianday\(([^)]+)\)\s*-\s*julianday\('now'\)/gi,
    "($1 - CURRENT_DATE)",
  );

  // IMPORTANTE: Convertir DATE('now', ...) ANTES de DATE(column)
  // Convertir DATE('now', '-X days') a (CURRENT_DATE - INTERVAL 'X days')
  pgSql = pgSql.replace(
    /DATE\('now',\s*'-(\d+)\s+days?'\)/gi,
    "(CURRENT_DATE - INTERVAL '$1 days')",
  );

  // Convertir DATE('now', '+X days') a (CURRENT_DATE + INTERVAL 'X days')
  pgSql = pgSql.replace(
    /DATE\('now',\s*'\+(\d+)\s+days?'\)/gi,
    "(CURRENT_DATE + INTERVAL '$1 days')",
  );

  // Convertir date('now') a CURRENT_DATE
  pgSql = pgSql.replace(/date\('now'\)/gi, "CURRENT_DATE");

  // Convertir DATE(column) a column::DATE (DESPUÉS de las conversiones de 'now')
  pgSql = pgSql.replace(/DATE\((\w+)\)/gi, "$1::DATE");

  // Convertir strftime('%H', column) a EXTRACT(HOUR FROM column)
  pgSql = pgSql.replace(/strftime\('%H',\s*(\w+)\)/gi, "EXTRACT(HOUR FROM $1)");

  // Convertir CAST(strftime('%H', column) AS INTEGER) a EXTRACT(HOUR FROM column)::INTEGER
  pgSql = pgSql.replace(
    /CAST\(strftime\('%H',\s*(\w+)\)\s+AS\s+INTEGER\)/gi,
    "EXTRACT(HOUR FROM $1)::INTEGER",
  );

  return pgSql;
}

async function runAsync(sql, params = []) {
  try {
    // Convertir sintaxis SQLite a PostgreSQL
    const pgSql = convertSqliteToPostgres(sql);
    console.log("🔧 DB: SQL original:", sql);
    console.log("🔧 DB: SQL convertido:", pgSql);
    console.log("🔧 DB: Parámetros:", params);

    const result = await pool.query(pgSql, params);
    console.log("🔧 DB: Resultado query:", {
      rowCount: result.rowCount,
      rows: result.rows,
    });

    return {
      lastID: result.rows[0]?.id || null,
      changes: result.rowCount,
      rows: result.rows,
    };
  } catch (error) {
    console.error("❌ DB: Error en runAsync:", error.message);
    console.error("❌ DB: Stack:", error.stack);
    throw error;
  }
}

async function getAsync(sql, params = []) {
  try {
    // Convertir sintaxis SQLite a PostgreSQL
    const pgSql = convertSqliteToPostgres(sql);

    const result = await pool.query(pgSql, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error en getAsync:", error.message);
    throw error;
  }
}

async function allAsync(sql, params = []) {
  try {
    // Convertir sintaxis SQLite a PostgreSQL
    const pgSql = convertSqliteToPostgres(sql);

    const result = await pool.query(pgSql, params);
    return result.rows || [];
  } catch (error) {
    console.error("Error en allAsync:", error.message);
    throw error;
  }
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log("✅ Conexión a PostgreSQL cerrada");
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  runAsync,
  getAsync,
  allAsync,
  closeDatabase,
};
