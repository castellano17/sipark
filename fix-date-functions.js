const fs = require("fs");

const filePath = "src-electron/api.cjs";
let content = fs.readFileSync(filePath, "utf8");

console.log("\n🔍 Corrigiendo funciones DATE() para PostgreSQL...\n");

const fixes = [
  {
    name: "getExpiringMemberships - date() con concatenación dinámica",
    old: `      WHERE cm.status = 'active' 
        AND cm.end_date BETWEEN date('now') AND date('now', '+' || ? || ' days')`,
    new: `      WHERE cm.status = 'active' 
        AND cm.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + (? || ' days')::INTERVAL)`,
  },
  {
    name: "getActiveMemberships - date() simple",
    old: `      WHERE cm.client_id = ?
        AND cm.status = 'active'
        AND cm.end_date >= date('now')`,
    new: `      WHERE cm.client_id = ?
        AND cm.status = 'active'
        AND cm.end_date >= CURRENT_DATE`,
  },
  {
    name: "getMemberships - expired filter",
    old: `    } else if (statusFilter === "expired") {
      sql += \` WHERE cm.status = 'expired' OR cm.end_date < date('now')\`;`,
    new: `    } else if (statusFilter === "expired") {
      sql += \` WHERE cm.status = 'expired' OR cm.end_date < CURRENT_DATE\`;`,
  },
  {
    name: "getMemberships - expiring_soon filter",
    old: `    } else if (statusFilter === "expiring_soon") {
      sql += \` WHERE cm.status = 'active' AND cm.end_date BETWEEN date('now') AND date('now', '+7 days')\`;`,
    new: `    } else if (statusFilter === "expiring_soon") {
      sql += \` WHERE cm.status = 'active' AND cm.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')\`;`,
  },
];

let fixedCount = 0;

fixes.forEach((fix) => {
  if (content.includes(fix.old)) {
    content = content.replace(fix.old, fix.new);
    console.log(`✅ Corregido: ${fix.name}`);
    fixedCount++;
  } else {
    console.log(`⚠️  No encontrado: ${fix.name}`);
  }
});

fs.writeFileSync(filePath, content, "utf8");

console.log(`\n${"=".repeat(80)}`);
console.log(
  `\n✨ Correcciones DATE() completadas: ${fixedCount}/${fixes.length}\n`,
);
