const fs = require("fs");

const filePath = "src-electron/database-pg.cjs";
let content = fs.readFileSync(filePath, "utf8");

// Find and replace the order of DATE conversions
const oldOrder = `  // Convertir DATE(column) a column::DATE
  pgSql = pgSql.replace(/DATE\\((\\w+)\\)/gi, "$1::DATE");

  // Convertir date('now') a CURRENT_DATE
  pgSql = pgSql.replace(/date\\('now'\\)/gi, "CURRENT_DATE");

  // Convertir DATE('now', '-X days') a (CURRENT_DATE - INTERVAL 'X days')
  pgSql = pgSql.replace(
    /DATE\\('now',\\s*'-(\\d+)\\s+days?'\\)/gi,
    "(CURRENT_DATE - INTERVAL '$1 days')",
  );

  // Convertir DATE('now', '+X days') a (CURRENT_DATE + INTERVAL 'X days')
  pgSql = pgSql.replace(
    /DATE\\('now',\\s*'\\+(\\d+)\\s+days?'\\)/gi,
    "(CURRENT_DATE + INTERVAL '$1 days')",
  );`;

const newOrder = `  // IMPORTANTE: Convertir DATE('now', ...) ANTES de DATE(column)
  // Convertir DATE('now', '-X days') a (CURRENT_DATE - INTERVAL 'X days')
  pgSql = pgSql.replace(
    /DATE\\('now',\\s*'-(\\d+)\\s+days?'\\)/gi,
    "(CURRENT_DATE - INTERVAL '$1 days')",
  );

  // Convertir DATE('now', '+X days') a (CURRENT_DATE + INTERVAL 'X days')
  pgSql = pgSql.replace(
    /DATE\\('now',\\s*'\\+(\\d+)\\s+days?'\\)/gi,
    "(CURRENT_DATE + INTERVAL '$1 days')",
  );

  // Convertir date('now') a CURRENT_DATE
  pgSql = pgSql.replace(/date\\('now'\\)/gi, "CURRENT_DATE");

  // Convertir DATE(column) a column::DATE (DESPUÉS de las conversiones de 'now')
  pgSql = pgSql.replace(/DATE\\((\\w+)\\)/gi, "$1::DATE");`;

content = content.replace(oldOrder, newOrder);

fs.writeFileSync(filePath, content, "utf8");
