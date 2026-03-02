const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { app } = require("electron");

// Script de migración para agregar campos a tablas de membresías

function migrateDatabase() {
  return new Promise((resolve, reject) => {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "sipark.db");

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("❌ Error abriendo BD:", err);
        reject(err);
        return;
      }

      console.log("✅ Conectado a la base de datos");

      // Función helper para ejecutar queries
      const runQuery = (sql) => {
        return new Promise((resolve, reject) => {
          db.run(sql, (err) => {
            if (err) {
              // Ignorar error si la columna ya existe
              if (err.message.includes("duplicate column name")) {
                console.log("⚠️  Columna ya existe, continuando...");
                resolve();
              } else {
                reject(err);
              }
            } else {
              resolve();
            }
          });
        });
      };

      // Migración de tabla memberships
      const membershipsMigrations = [
        "ALTER TABLE memberships ADD COLUMN membership_type TEXT DEFAULT 'standard'",
        "ALTER TABLE memberships ADD COLUMN max_sessions_per_day INTEGER",
        "ALTER TABLE memberships ADD COLUMN discount_percentage REAL DEFAULT 0",
        "ALTER TABLE memberships ADD COLUMN priority_level INTEGER DEFAULT 0",
        "ALTER TABLE memberships ADD COLUMN auto_renew BOOLEAN DEFAULT 0",
        "ALTER TABLE memberships ADD COLUMN grace_period_days INTEGER DEFAULT 0",
      ];

      // Migración de tabla client_memberships
      const clientMembershipsMigrations = [
        "ALTER TABLE client_memberships ADD COLUMN payment_method TEXT",
        "ALTER TABLE client_memberships ADD COLUMN invoice_number TEXT",
        "ALTER TABLE client_memberships ADD COLUMN auto_renew BOOLEAN DEFAULT 0",
        "ALTER TABLE client_memberships ADD COLUMN renewed_from_id INTEGER",
        "ALTER TABLE client_memberships ADD COLUMN cancelled_at DATETIME",
        "ALTER TABLE client_memberships ADD COLUMN cancelled_by INTEGER",
        "ALTER TABLE client_memberships ADD COLUMN cancellation_reason TEXT",
      ];

      // Crear nuevas tablas
      const newTables = [
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
      ];

      // Ejecutar todas las migraciones
      (async () => {
        try {
          console.log("\n🔄 Migrando tabla memberships...");
          for (const sql of membershipsMigrations) {
            await runQuery(sql);
            console.log("✅ Columna agregada");
          }

          console.log("\n🔄 Migrando tabla client_memberships...");
          for (const sql of clientMembershipsMigrations) {
            await runQuery(sql);
            console.log("✅ Columna agregada");
          }

          console.log("\n🔄 Creando nuevas tablas...");
          for (const sql of newTables) {
            await runQuery(sql);
            console.log("✅ Tabla creada");
          }

          console.log("\n✅ Migración completada exitosamente");
          db.close();
          resolve();
        } catch (error) {
          console.error("\n❌ Error en migración:", error);
          db.close();
          reject(error);
        }
      })();
    });
  });
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  // Simular app.getPath para testing
  if (!app) {
    const os = require("os");
    global.app = {
      getPath: (name) => {
        if (name === "userData") {
          return path.join(os.homedir(), ".sipark");
        }
        return os.homedir();
      },
    };
  }

  migrateDatabase()
    .then(() => {
      console.log("\n🎉 Migración finalizada");
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n💥 Error fatal:", err);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
