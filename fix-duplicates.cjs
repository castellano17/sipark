const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const os = require("os");

// Determinar la ruta de userData según el sistema operativo
function getUserDataPath() {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === "darwin") {
    // macOS
    return path.join(homeDir, "Library", "Application Support", "ludoteca-pos");
  } else if (platform === "win32") {
    // Windows
    return path.join(
      process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
      "ludoteca-pos",
    );
  } else {
    // Linux
    return path.join(homeDir, ".config", "ludoteca-pos");
  }
}

// Ruta a la base de datos
const userDataPath = getUserDataPath();
const dbPath = path.join(userDataPath, "sipark.db");

console.log("🔍 Buscando base de datos en:", dbPath);

if (!fs.existsSync(dbPath)) {
  console.error("❌ No se encontró la base de datos en:", dbPath);
  console.log("\n💡 Ubicaciones posibles:");
  console.log("   - macOS: ~/Library/Application Support/sipark/sipark.db");
  console.log("   - Windows: %APPDATA%/sipark/sipark.db");
  console.log("   - Linux: ~/.config/sipark/sipark.db");
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

async function fixDuplicates() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log("🔍 Buscando clientes duplicados...\n");

      // Mostrar duplicados
      db.all(
        `SELECT name, phone, COUNT(*) as cantidad
         FROM clients
         GROUP BY name, phone
         HAVING COUNT(*) > 1`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          if (rows.length === 0) {
            console.log("✅ No se encontraron clientes duplicados");
            db.close();
            resolve();
            return;
          }

          console.log("📋 Clientes duplicados encontrados:");
          rows.forEach((row) => {
            console.log(
              `   - ${row.name} (${row.phone}): ${row.cantidad} registros`,
            );
          });
          console.log("");

          // Eliminar duplicados
          db.run(
            `DELETE FROM clients
             WHERE id NOT IN (
               SELECT MIN(id)
               FROM clients
               GROUP BY name, phone
             )`,
            [],
            function (err) {
              if (err) {
                reject(err);
                return;
              }

              console.log(
                `✅ Se eliminaron ${this.changes} registros duplicados\n`,
              );

              // Verificar que no queden duplicados
              db.all(
                `SELECT name, phone, COUNT(*) as cantidad
                 FROM clients
                 GROUP BY name, phone
                 HAVING COUNT(*) > 1`,
                [],
                (err, rows) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  if (rows.length === 0) {
                    console.log(
                      "✅ Limpieza completada. No quedan duplicados.",
                    );
                  } else {
                    console.log("⚠️  Aún quedan algunos duplicados:");
                    rows.forEach((row) => {
                      console.log(
                        `   - ${row.name} (${row.phone}): ${row.cantidad} registros`,
                      );
                    });
                  }

                  db.close();
                  resolve();
                },
              );
            },
          );
        },
      );
    });
  });
}

fixDuplicates()
  .then(() => {
    console.log("\n✅ Proceso completado");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error:", err);
    process.exit(1);
  });
