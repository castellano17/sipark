const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

let pool = null;

// Configuración de la base de datos
// Puede ser configurada mediante variables de entorno o archivo de configuración
function getConfig() {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  
  // Lista de posibles ubicaciones (Prioridad al directorio actual)
  const paths = [
    path.join(process.cwd(), "db-config.json"),
    path.join(os.homedir(), 'Documents', 'SIPARK_CONFIG', 'db-config.json')
  ];

  let config = null;
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        config = JSON.parse(fs.readFileSync(p, "utf8"));
        break;
      } catch (e) {}
    }
  }

  const defaultConfig = {
    host: "127.0.0.1",
    port: 5432,
    database: "ludoteca_pos",
    user: "ludoteca_user",
    password: "password_cambiame",
    max: 20
  };

  return config || defaultConfig;
}

async function initializeDatabase() {
  try {
    const config = getConfig();

    pool = new Pool(config);

    // Probar la conexión
    const client = await pool.connect();
    client.release();

    // Crear tablas
    await createTables();

    return pool;
  } catch (error) {
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
      phone VARCHAR(50),
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
      is_standard_entry BOOLEAN DEFAULT FALSE,
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
      children_count INTEGER DEFAULT 1,
      status VARCHAR(50) DEFAULT 'active',
      is_paid BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`,

    `CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      client_id INTEGER,
      client_name VARCHAR(255),
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
      product_id INTEGER,
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
      type VARCHAR(50) DEFAULT 'food',
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
      can_open_drawer BOOLEAN DEFAULT FALSE,
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
      phone VARCHAR(50),
      id_card VARCHAR(50),
      acquisition_date DATE,
      total_hours VARCHAR(50),
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
      phone VARCHAR(50),
      id_card VARCHAR(50),
      acquisition_date DATE,
      total_hours VARCHAR(50),
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

    `CREATE TABLE IF NOT EXISTS nfc_cards (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(255) UNIQUE NOT NULL,
      client_id INTEGER,
      is_active BOOLEAN DEFAULT TRUE,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`,

    `CREATE INDEX IF NOT EXISTS idx_nfc_cards_uid ON nfc_cards(uid)`,

    `CREATE TABLE IF NOT EXISTS promotion_campaigns (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL DEFAULT 'hours',
      benefit_value DECIMAL(10,2) NOT NULL DEFAULT 0,
      benefit_package_id INTEGER,
      code_count INTEGER NOT NULL DEFAULT 1,
      max_uses_per_code INTEGER NOT NULL DEFAULT 1,
      valid_from DATE,
      valid_until DATE,
      target_audience VARCHAR(50) DEFAULT 'all',
      min_purchase DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS promotion_vouchers (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      code VARCHAR(30) UNIQUE NOT NULL,
      barcode_data TEXT,
      qr_data TEXT,
      times_used INTEGER DEFAULT 0,
      max_uses INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES promotion_campaigns(id)
    )`,

    `CREATE INDEX IF NOT EXISTS idx_promotion_vouchers_code ON promotion_vouchers(code)`,

    `CREATE TABLE IF NOT EXISTS voucher_redemptions (
      id SERIAL PRIMARY KEY,
      voucher_id INTEGER NOT NULL,
      redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      client_id INTEGER,
      redeemed_by INTEGER,
      sale_id INTEGER,
      benefit_applied JSONB,
      notes TEXT,
      FOREIGN KEY (voucher_id) REFERENCES promotion_vouchers(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (redeemed_by) REFERENCES users(id),
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    )`,

    `CREATE TABLE IF NOT EXISTS nfc_transactions (
      id SERIAL PRIMARY KEY,
      client_membership_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      previous_balance DECIMAL(10,2) NOT NULL,
      new_balance DECIMAL(10,2) NOT NULL,
      related_sale_id INTEGER,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_membership_id) REFERENCES client_memberships(id),
      FOREIGN KEY (card_id) REFERENCES nfc_cards(id),
      FOREIGN KEY (related_sale_id) REFERENCES sales(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
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
      requires_quantity BOOLEAN DEFAULT false,
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
      quantity INTEGER DEFAULT 1,
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
      client_name VARCHAR(255) NOT NULL,
      client_phone VARCHAR(50),
      client_email VARCHAR(255),
      client_address VARCHAR(255),
      subtotal DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      tax DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      valid_until DATE,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS quotation_items (
      id SERIAL PRIMARY KEY,
      quotation_id INTEGER NOT NULL,
      product_id INTEGER,
      description VARCHAR(255) NOT NULL,
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
    `CREATE TABLE IF NOT EXISTS supply_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS supplies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category_id INTEGER,
      stock DECIMAL(10,2) DEFAULT 0,
      unit_of_measure VARCHAR(50) NOT NULL,
      min_stock DECIMAL(10,2) DEFAULT 0,
      barcode VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES supply_categories(id)
    )`,

    `CREATE TABLE IF NOT EXISTS supply_adjustments (
      id SERIAL PRIMARY KEY,
      supply_id INTEGER NOT NULL,
      adjustment_type VARCHAR(50) NOT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      previous_stock DECIMAL(10,2) NOT NULL,
      new_stock DECIMAL(10,2) NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supply_id) REFERENCES supplies(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS equipment_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS equipment (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category_id INTEGER,
      quantity INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      location VARCHAR(255),
      barcode VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES equipment_categories(id)
    )`,

    `CREATE TABLE IF NOT EXISTS equipment_adjustments (
      id SERIAL PRIMARY KEY,
      equipment_id INTEGER NOT NULL,
      adjustment_type VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL,
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS waiter_orders (
      id SERIAL PRIMARY KEY,
      table_or_client_name VARCHAR(255) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS waiter_order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES waiter_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products_services(id)
    )`
  ];

  for (const sql of tables) {
    try {
      await pool.query(sql);
    } catch (error) {
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
    `CREATE INDEX IF NOT EXISTS idx_active_sessions_paid ON active_sessions(is_paid)`,
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
    `CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id)`
  ];

  for (const sql of indexes) {
    try {
      await pool.query(sql);
    } catch (error) {
    }
  }

  // Migraciones / Actualizaciones de esquema
  try {
    // Verificar si la columna is_paid existe en active_sessions, si no, crearla
    await pool.query(`
      DO $$ 
      DECLARE
        bebidas_emb_exists BOOLEAN;
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='active_sessions' AND column_name='is_paid') THEN
          ALTER TABLE active_sessions ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;
        END IF;

        -- Migración para nuevas columnas de membresías
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memberships' AND column_name='id_card') THEN
          ALTER TABLE memberships ADD COLUMN id_card VARCHAR(50);
          ALTER TABLE memberships ADD COLUMN phone VARCHAR(50);
          ALTER TABLE memberships ADD COLUMN acquisition_date DATE;
          ALTER TABLE memberships ADD COLUMN total_hours VARCHAR(50);
        END IF;

        -- Migración para nuevas columnas de membresías compradas
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_memberships' AND column_name='id_card') THEN
          ALTER TABLE client_memberships ADD COLUMN id_card VARCHAR(50);
          ALTER TABLE client_memberships ADD COLUMN phone VARCHAR(50);
          ALTER TABLE client_memberships ADD COLUMN acquisition_date DATE;
          ALTER TABLE client_memberships ADD COLUMN total_hours VARCHAR(50);
        END IF;

        -- Migración para NFC en client_memberships
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_memberships' AND column_name='nfc_card_id') THEN
          ALTER TABLE client_memberships ADD COLUMN nfc_card_id INTEGER;
          ALTER TABLE client_memberships ADD CONSTRAINT fk_nfc_card FOREIGN KEY (nfc_card_id) REFERENCES nfc_cards(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_memberships' AND column_name='balance') THEN
          ALTER TABLE client_memberships ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00;
        END IF;

        -- Migración para last_used_at en nfc_cards
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nfc_cards' AND column_name='last_used_at') THEN
          ALTER TABLE nfc_cards ADD COLUMN last_used_at TIMESTAMP;
        END IF;

        -- Asegurar índice explícito en uid de nfc_cards (UNIQUE ya lo crea pero lo hacemos visible)
        CREATE INDEX IF NOT EXISTS idx_nfc_cards_uid ON nfc_cards(uid);

        -- Migración para client_name en sales (agregado aquí para asegurar ejecución)
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);

        -- Migración para columnas de características de paquetes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='package_features' AND column_name='requires_quantity') THEN
          ALTER TABLE package_features ADD COLUMN requires_quantity BOOLEAN DEFAULT false;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='package_included_features' AND column_name='quantity') THEN
          ALTER TABLE package_included_features ADD COLUMN quantity INTEGER DEFAULT 1;
        END IF;

        -- Migración para permitir teléfono opcional en clientes
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='phone' AND is_nullable='NO') THEN
          ALTER TABLE clients ALTER COLUMN phone DROP NOT NULL;
        END IF;

        -- Migración para is_standard_entry en products_services
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products_services' AND column_name='is_standard_entry') THEN
          ALTER TABLE products_services ADD COLUMN is_standard_entry BOOLEAN DEFAULT FALSE;
        END IF;

        -- Migración para permitir product_id opcional en sale_items (Venta de membresías, etc.)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='product_id' AND is_nullable='NO') THEN
          ALTER TABLE sale_items ALTER COLUMN product_id DROP NOT NULL;
        END IF;

        -- Migración para children_count en active_sessions
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='active_sessions' AND column_name='children_count') THEN
          ALTER TABLE active_sessions ADD COLUMN children_count INTEGER DEFAULT 1;
        END IF;

        -- Migración para tipo en categorías
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='type') THEN
          ALTER TABLE categories ADD COLUMN type VARCHAR(50) DEFAULT 'food';
        END IF;

        -- Migración para can_open_drawer en user_permissions
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_permissions' AND column_name='can_open_drawer') THEN
          ALTER TABLE user_permissions ADD COLUMN can_open_drawer BOOLEAN DEFAULT FALSE;
        END IF;

        -- Asegurar categorías base para productos antiguos
        INSERT INTO categories (name, type) VALUES ('Tiempo', 'time') ON CONFLICT (name) DO NOTHING;
        INSERT INTO categories (name, type) VALUES ('Paquetes', 'package') ON CONFLICT (name) DO NOTHING;
        INSERT INTO categories (name, type) VALUES ('Comida', 'food') ON CONFLICT (name) DO NOTHING;
        INSERT INTO categories (name, type) VALUES ('Bebidas', 'drink') ON CONFLICT (name) DO NOTHING;
        INSERT INTO categories (name, type) VALUES ('Snacks', 'snack') ON CONFLICT (name) DO NOTHING;
        INSERT INTO categories (name, type) VALUES ('Eventos', 'event') ON CONFLICT (name) DO NOTHING;
        INSERT INTO categories (name, type) VALUES ('Alquiler', 'rental') ON CONFLICT (name) DO NOTHING;
        INSERT INTO categories (name, type) VALUES ('Membresía', 'membership') ON CONFLICT (name) DO NOTHING;

        -- Migrar productos sin categoría al nombre de su tipo
        UPDATE products_services SET category = 'Tiempo' WHERE type = 'time' AND (category IS NULL OR category = '' OR category = '-');
        UPDATE products_services SET category = 'Paquetes' WHERE type = 'package' AND (category IS NULL OR category = '' OR category = '-');
        UPDATE products_services SET category = 'Comida' WHERE type = 'food' AND (category IS NULL OR category = '' OR category = '-');
        UPDATE products_services SET category = 'Bebidas' WHERE type = 'drink' AND (category IS NULL OR category = '' OR category = '-');
        UPDATE products_services SET category = 'Snacks' WHERE type = 'snack' AND (category IS NULL OR category = '' OR category = '-');
        UPDATE products_services SET category = 'Eventos' WHERE type = 'event' AND (category IS NULL OR category = '' OR category = '-');
        UPDATE products_services SET category = 'Alquiler' WHERE type = 'rental' AND (category IS NULL OR category = '' OR category = '-');
        UPDATE products_services SET category = 'Membresía' WHERE type = 'membership' AND (category IS NULL OR category = '' OR category = '-');

        -- Asegurar que los productos tengan una categoría válida, quitando lo innecesario
        -- 1. Mover productos de la genérica 'Bebidas' a 'Bebidas embotelladas' si existe
        SELECT EXISTS (SELECT 1 FROM categories WHERE name = 'Bebidas embotelladas') INTO bebidas_emb_exists;
        IF bebidas_emb_exists THEN
            UPDATE products_services SET category = 'Bebidas embotelladas' WHERE category = 'Bebidas';
        END IF;

        -- 2. Asegurarnos que 'Paquetes' existe (porque el usuario lo quiere aparte de sus categorías)
        INSERT INTO categories (name, type) VALUES ('Paquetes', 'package') ON CONFLICT (name) DO NOTHING;
        
        -- 3. Mover productos de tipo 'package' sin categoría a 'Paquetes'
        UPDATE products_services SET category = 'Paquetes' WHERE type = 'package' AND (category IS NULL OR category = '' OR category = '-');

        -- 4. Eliminar todas las categorías genéricas que el usuario NO quiere ver
        DELETE FROM categories WHERE name IN ('Bebidas', 'Comida', 'Alquiler', 'Eventos', 'Membresía', 'Snacks', 'Tiempo');
        
        -- 5. Si eliminamos 'Bebidas' y quedaron productos ahí (porque no existía 'Bebidas embotelladas'), 
        --    podemos regresarlos a su tipo original o dejarlos para que el usuario les asigne una.
        END $$;
    `);
  } catch (error) {
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

  // Agregar RETURNING id para los INSERTs (excepto settings) para emular result.lastID de SQLite
  const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT INTO');
  const isSettings = pgSql.toUpperCase().includes('INTO SETTINGS');
  const hasReturning = pgSql.toUpperCase().includes('RETURNING');
  
  if (isInsert && !isSettings && !hasReturning) {
    pgSql += ' RETURNING id';
  }

  return pgSql;
}

// Función para asegurar que el pool esté inicializado
async function checkPool() {
  if (!pool) {
    const config = getConfig();
    pool = new Pool(config);
    try {
      await pool.query("SELECT 1");
    } catch (err) {
      console.error("❌ Fallo crítico de conexión a Postgres:", err.message);
      pool = null;
      throw err;
    }
  }
}

async function runAsync(sql, params = []) {
  try {
    await checkPool();
    // Convertir sintaxis SQLite a PostgreSQL
    const pgSql = convertSqliteToPostgres(sql);

    const result = await pool.query(pgSql, params);

    return {
      lastID: result.rows[0]?.id || null,
      changes: result.rowCount,
      rows: result.rows,
    };
  } catch (error) {
    throw error;
  }
}

async function getAsync(sql, params = []) {
  try {
    await checkPool();
    const pgSql = convertSqliteToPostgres(sql);
    const result = await pool.query(pgSql, params);
    if (!result.rows[0]) return null;
    
    const normalizedRow = {};
    for (const key in result.rows[0]) {
      normalizedRow[key.toLowerCase()] = result.rows[0][key];
    }
    return normalizedRow;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

async function allAsync(sql, params = []) {
  try {
    await checkPool();
    const pgSql = convertSqliteToPostgres(sql);
    const result = await pool.query(pgSql, params);
    
    return (result.rows || []).map(row => {
      const normalizedRow = {};
      for (const key in row) {
        normalizedRow[key.toLowerCase()] = row[key];
      }
      return normalizedRow;
    });
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
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
