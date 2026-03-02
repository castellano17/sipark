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

async function addClientNameColumn() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log("🔄 Agregando campo client_name a la tabla sales...\n");

      // Verificar si la columna ya existe
      db.all("PRAGMA table_info(sales)", [], (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const hasClientName = columns.some((col) => col.name === "client_name");

        if (hasClientName) {
          console.log("✅ El campo client_name ya existe");
          db.close();
          resolve();
          return;
        }

        // Agregar la columna
        db.run(
          "ALTER TABLE sales ADD COLUMN client_name TEXT",
          [],
          function (err) {
            if (err) {
              reject(err);
              return;
            }

            console.log("✅ Campo client_name agregado exitosamente");

            // Actualizar ventas existentes con el nombre del cliente desde la tabla clients
            db.run(
              `UPDATE sales 
               SET client_name = (SELECT name FROM clients WHERE clients.id = sales.client_id)
               WHERE client_id IS NOT NULL`,
              [],
              function (err) {
                if (err) {
                  reject(err);
                  return;
                }

                console.log(
                  `✅ ${this.changes} venta(s) actualizada(s) con nombre de cliente`,
                );
                db.close();
                resolve();
              },
            );
          },
        );
      });
    });
  });
}

addClientNameColumn()
  .then(() => {
    console.log("\n✅ Migración completada");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error:", err);
    process.exit(1);
  });
