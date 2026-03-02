const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Ruta a la base de datos
const dbPath = path.join(__dirname, "sipark.db");

if (!fs.existsSync(dbPath)) {
  console.error("❌ No se encontró la base de datos en:", dbPath);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

async function fixActiveSessions() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log("🔄 Modificando tabla active_sessions...\n");

      // SQLite no permite modificar columnas directamente, hay que recrear la tabla
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Crear tabla temporal con la nueva estructura
        db.run(
          `CREATE TABLE active_sessions_new (
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
          (err) => {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }

            // Copiar datos existentes
            db.run(
              `INSERT INTO active_sessions_new 
               SELECT id, client_id, start_time, end_time, elapsed_minutes, 
                      package_id, NULL as duration_minutes, status, created_at 
               FROM active_sessions`,
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  reject(err);
                  return;
                }

                // Eliminar tabla vieja
                db.run("DROP TABLE active_sessions", (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                    return;
                  }

                  // Renombrar tabla nueva
                  db.run(
                    "ALTER TABLE active_sessions_new RENAME TO active_sessions",
                    (err) => {
                      if (err) {
                        db.run("ROLLBACK");
                        reject(err);
                        return;
                      }

                      // Commit
                      db.run("COMMIT", (err) => {
                        if (err) {
                          reject(err);
                          return;
                        }

                        console.log(
                          "✅ Tabla active_sessions modificada exitosamente",
                        );
                        console.log("   - client_id ahora permite NULL");
                        console.log("   - Agregado campo duration_minutes");
                        db.close();
                        resolve();
                      });
                    },
                  );
                });
              },
            );
          },
        );
      });
    });
  });
}

fixActiveSessions()
  .then(() => {
    console.log("\n✅ Migración completada");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error:", err);
    process.exit(1);
  });
