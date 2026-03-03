const { getDatabase } = require("./database.cjs");

async function migrateDatabase() {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    // Verificar si las columnas existen
    db.all("PRAGMA table_info(sales)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const columnNames = columns.map((col) => col.name);
        const migrations = [];

        // Agregar columna subtotal si no existe
        if (!columnNames.includes("subtotal")) {
          migrations.push(
            "ALTER TABLE sales ADD COLUMN subtotal REAL NOT NULL DEFAULT 0",
          );
        }

        // Agregar columna discount si no existe
        if (!columnNames.includes("discount")) {
          migrations.push(
            "ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0",
          );
        }

        // Agregar columna cash_box_id si no existe
        if (!columnNames.includes("cash_box_id")) {
          migrations.push("ALTER TABLE sales ADD COLUMN cash_box_id INTEGER");
        }

        // Verificar columnas de products_services
        db.all("PRAGMA table_info(products_services)", (err, prodColumns) => {
          if (err) {
            reject(err);
            return;
          }

          const prodColumnNames = prodColumns.map((col) => col.name);

          // Agregar columna stock si no existe
          if (!prodColumnNames.includes("stock")) {
            migrations.push(
              "ALTER TABLE products_services ADD COLUMN stock INTEGER DEFAULT 0",
            );
          }

          // Verificar columnas de clients
          db.all("PRAGMA table_info(clients)", (err, clientColumns) => {
            if (err) {
              reject(err);
              return;
            }

            const clientColumnNames = clientColumns.map((col) => col.name);

            // Agregar nuevas columnas a clients si no existen
            if (!clientColumnNames.includes("emergency_phone")) {
              migrations.push(
                "ALTER TABLE clients ADD COLUMN emergency_phone TEXT",
              );
            }
            if (!clientColumnNames.includes("email")) {
              migrations.push("ALTER TABLE clients ADD COLUMN email TEXT");
            }
            if (!clientColumnNames.includes("child_name")) {
              migrations.push("ALTER TABLE clients ADD COLUMN child_name TEXT");
            }
            if (!clientColumnNames.includes("child_age")) {
              migrations.push(
                "ALTER TABLE clients ADD COLUMN child_age INTEGER",
              );
            }
            if (!clientColumnNames.includes("allergies")) {
              migrations.push("ALTER TABLE clients ADD COLUMN allergies TEXT");
            }
            if (!clientColumnNames.includes("special_notes")) {
              migrations.push(
                "ALTER TABLE clients ADD COLUMN special_notes TEXT",
              );
            }

            // Agregar columna category si no existe
            if (!prodColumnNames.includes("category")) {
              migrations.push(
                "ALTER TABLE products_services ADD COLUMN category TEXT",
              );
            }

            // Agregar columna barcode si no existe (sin UNIQUE porque SQLite no lo permite en ALTER TABLE)
            if (!prodColumnNames.includes("barcode")) {
              migrations.push(
                "ALTER TABLE products_services ADD COLUMN barcode TEXT",
              );
            }

            // Verificar columnas de active_sessions
            db.all(
              "PRAGMA table_info(active_sessions)",
              (err, sessionColumns) => {
                if (err) {
                  reject(err);
                  return;
                }

                const sessionColumnNames = sessionColumns.map(
                  (col) => col.name,
                );

                // Agregar columna duration_minutes si no existe
                if (!sessionColumnNames.includes("duration_minutes")) {
                  migrations.push(
                    "ALTER TABLE active_sessions ADD COLUMN duration_minutes INTEGER",
                  );
                }

                // Agregar columna end_time si no existe
                if (!sessionColumnNames.includes("end_time")) {
                  migrations.push(
                    "ALTER TABLE active_sessions ADD COLUMN end_time TEXT",
                  );
                }

                // Agregar columna elapsed_minutes si no existe
                if (!sessionColumnNames.includes("elapsed_minutes")) {
                  migrations.push(
                    "ALTER TABLE active_sessions ADD COLUMN elapsed_minutes INTEGER",
                  );
                }

                // Migración especial: Corregir timestamps de UTC a hora local
                // Esta migración se ejecuta siempre para corregir datos existentes
                migrations.push({
                  type: "fix_timestamps",
                  description: "Corregir timestamps de UTC a hora local",
                });

                // Ejecutar migraciones
                let completed = 0;
                let hasError = false;

                if (migrations.length === 0) {
                  console.log("✅ Base de datos ya está actualizada");
                  resolve();
                  return;
                }

                console.log(
                  `🔄 Ejecutando ${migrations.length} migraciones...`,
                );

                const executeMigration = (migration, index) => {
                  // Si es una migración especial de timestamps
                  if (
                    typeof migration === "object" &&
                    migration.type === "fix_timestamps"
                  ) {
                    console.log(`🔄 ${migration.description}...`);

                    // Obtener todas las ventas con timestamps en formato ISO
                    db.all(
                      "SELECT id, timestamp FROM sales WHERE timestamp LIKE '%T%'",
                      (err, sales) => {
                        if (err) {
                          console.error("Error obteniendo ventas:", err);
                          completed++;
                          checkCompletion();
                          return;
                        }

                        if (!sales || sales.length === 0) {
                          console.log(
                            "✅ No hay timestamps para corregir en sales",
                          );
                          completed++;
                          checkCompletion();
                          return;
                        }

                        console.log(
                          `📝 Corrigiendo ${sales.length} timestamps en sales...`,
                        );
                        let fixed = 0;

                        sales.forEach((sale) => {
                          // Convertir de UTC a hora local
                          const utcDate = new Date(sale.timestamp);
                          const year = utcDate.getFullYear();
                          const month = String(utcDate.getMonth() + 1).padStart(
                            2,
                            "0",
                          );
                          const day = String(utcDate.getDate()).padStart(
                            2,
                            "0",
                          );
                          const hours = String(utcDate.getHours()).padStart(
                            2,
                            "0",
                          );
                          const minutes = String(utcDate.getMinutes()).padStart(
                            2,
                            "0",
                          );
                          const seconds = String(utcDate.getSeconds()).padStart(
                            2,
                            "0",
                          );
                          const localTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                          db.run(
                            "UPDATE sales SET timestamp = ? WHERE id = ?",
                            [localTimestamp, sale.id],
                            (err) => {
                              if (err) {
                                console.error(
                                  `Error actualizando venta ${sale.id}:`,
                                  err,
                                );
                              }
                              fixed++;
                              if (fixed === sales.length) {
                                console.log(
                                  `✅ ${fixed} timestamps corregidos en sales`,
                                );
                                completed++;
                                checkCompletion();
                              }
                            },
                          );
                        });
                      },
                    );

                    return;
                  }

                  // Migración SQL normal
                  db.run(migration, (err) => {
                    if (err && !hasError) {
                      hasError = true;
                      console.error(`❌ Error en migración ${index + 1}:`, err);
                      reject(err);
                      return;
                    }
                    completed++;
                    console.log(
                      `✅ Migración ${completed}/${migrations.length} completada`,
                    );
                    checkCompletion();
                  });
                };

                const checkCompletion = () => {
                  if (completed === migrations.length && !hasError) {
                    console.log("✅ Todas las migraciones completadas");
                    resolve();
                  }
                };

                migrations.forEach((migration, index) => {
                  executeMigration(migration, index);
                });
              },
            );
          });
        });
      });
    });
  });
}

module.exports = { migrateDatabase };
