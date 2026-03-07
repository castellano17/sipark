const fs = require("fs");

const filePath = "src-electron/api.cjs";
let content = fs.readFileSync(filePath, "utf8");

console.log("\n🔍 Verificando ORDER BY con aliases en PostgreSQL...\n");

// ProductsWithoutMovement - the subquery alias should work, but let's make it explicit
const fix1 = {
  name: "ProductsWithoutMovement - ORDER BY con subquery",
  old: `         WHERE si2.product_id = ps.id) < ?
      ORDER BY last_sale_date ASC`,
  new: `         WHERE si2.product_id = ps.id) < ?
      ORDER BY (SELECT MAX(s.timestamp) 
         FROM sales s 
         JOIN sale_items si2 ON s.id = si2.sale_id 
         WHERE si2.product_id = ps.id) ASC`,
};

if (content.includes(fix1.old)) {
  content = content.replace(fix1.old, fix1.new);
  console.log(`✅ Corregido: ${fix1.name}`);
} else {
  console.log(`⚠️  No encontrado: ${fix1.name}`);
}

fs.writeFileSync(filePath, content, "utf8");

console.log(`\n${"=".repeat(80)}`);
console.log(`\n✨ Correcciones ORDER BY completadas\n`);
