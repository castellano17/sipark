const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Intentar leer configuración desde db-config.json o usar valores por defecto
const configPath = path.join(__dirname, "db-config.json");
const exampleConfigPath = path.join(__dirname, "db-config.example.json");

let config;

try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log("✅ Configuración cargada desde db-config.json");
  } else if (fs.existsSync(exampleConfigPath)) {
    config = JSON.parse(fs.readFileSync(exampleConfigPath, "utf8"));
    console.log(
      "⚠️  Usando db-config.example.json (crea db-config.json con tu configuración real)",
    );
  } else {
    // Configuración por defecto
    config = {
      host: "localhost",
      port: 5432,
      database: "sipark_pos",
      user: "postgres",
      password: "postgres",
    };
    console.log("⚠️  Usando configuración por defecto");
  }
} catch (error) {
  console.error("❌ Error leyendo configuración:", error.message);
  process.exit(1);
}

const pool = new Pool(config);

async function fixCashMovements() {
  try {
    console.log("🔍 Buscando movimientos de efectivo con montos negativos...");

    // Buscar todos los movimientos con montos negativos
    const result = await pool.query(
      `SELECT id, type, amount, description FROM cash_movements WHERE amount < 0`,
    );

    const negativeMovements = result.rows;

    console.log(
      `📦 Encontrados ${negativeMovements.length} movimientos con montos negativos`,
    );

    if (negativeMovements.length === 0) {
      console.log("✅ No hay movimientos que corregir");
      return;
    }

    // Mostrar los movimientos que se van a corregir
    console.log("\n📋 Movimientos a corregir:");
    negativeMovements.forEach((m) => {
      console.log(
        `  - ID: ${m.id}, Tipo: ${m.type}, Monto: ${m.amount}, Descripción: ${m.description}`,
      );
    });

    // Corregir los montos (convertir negativos a positivos)
    for (const movement of negativeMovements) {
      const positiveAmount = Math.abs(movement.amount);
      await pool.query(`UPDATE cash_movements SET amount = $1 WHERE id = $2`, [
        positiveAmount,
        movement.id,
      ]);
      console.log(
        `✅ Corregido movimiento ID ${movement.id}: ${movement.amount} → ${positiveAmount}`,
      );
    }

    console.log("\n✅ Todos los movimientos han sido corregidos");
    console.log("🔄 Recarga la aplicación para ver los cambios");
  } catch (error) {
    console.error("❌ Error corrigiendo movimientos:", error);
  } finally {
    await pool.end();
  }
}

fixCashMovements();
