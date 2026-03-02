const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const os = require("os");

function getUserDataPath() {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === "darwin") {
    return path.join(homeDir, "Library", "Application Support", "ludoteca-pos");
  } else if (platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
      "ludoteca-pos",
    );
  } else {
    return path.join(homeDir, ".config", "ludoteca-pos");
  }
}

const dbPath = path.join(getUserDataPath(), "sipark.db");
const db = new sqlite3.Database(dbPath);

console.log("🔍 Verificando últimas ventas...\n");

db.all(
  `SELECT 
    s.id,
    s.client_id,
    c.name as client_name_from_join,
    COALESCE(c.name, 'Cliente General') as client_name_coalesce,
    s.total,
    s.timestamp
  FROM sales s
  LEFT JOIN clients c ON s.client_id = c.id
  ORDER BY s.id DESC
  LIMIT 10`,
  [],
  (err, rows) => {
    if (err) {
      console.error("❌ Error:", err);
      process.exit(1);
    }

    console.log("📊 Últimas 10 ventas:\n");
    rows.forEach((row) => {
      console.log(`ID: ${row.id}`);
      console.log(`  client_id: ${row.client_id}`);
      console.log(`  client_name (JOIN): ${row.client_name_from_join}`);
      console.log(`  client_name (COALESCE): ${row.client_name_coalesce}`);
      console.log(`  total: ${row.total}`);
      console.log(`  timestamp: ${row.timestamp}`);
      console.log("");
    });

    db.close();
  },
);
