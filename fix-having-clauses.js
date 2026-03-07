const fs = require("fs");

const filePath = "src-electron/api.cjs";
let content = fs.readFileSync(filePath, "utf8");

console.log("\n🔍 Corrigiendo cláusulas HAVING para PostgreSQL...\n");

const fixes = [
  {
    name: "ProductsWithoutMovement - HAVING con alias de subquery",
    old: `      FROM products_services ps
      LEFT JOIN sale_items si ON ps.id = si.product_id
      WHERE ps.type = 'product'
      GROUP BY ps.id, ps.name, ps.category, ps.stock, ps.price
      HAVING last_sale_date IS NULL OR last_sale_date < ?
      ORDER BY last_sale_date ASC`,
    new: `      FROM products_services ps
      LEFT JOIN sale_items si ON ps.id = si.product_id
      WHERE ps.type = 'product'
      GROUP BY ps.id, ps.name, ps.category, ps.stock, ps.price
      HAVING (SELECT MAX(s.timestamp) 
         FROM sales s 
         JOIN sale_items si2 ON s.id = si2.sale_id 
         WHERE si2.product_id = ps.id) IS NULL 
         OR (SELECT MAX(s.timestamp) 
         FROM sales s 
         JOIN sale_items si2 ON s.id = si2.sale_id 
         WHERE si2.product_id = ps.id) < ?
      ORDER BY last_sale_date ASC`,
  },
  {
    name: "InactiveClients - HAVING con alias MAX()",
    old: `      FROM clients c
      LEFT JOIN sales s ON c.id = s.client_id
      GROUP BY c.id, c.name, c.phone, c.email, c.created_at
      HAVING last_visit < ? OR last_visit IS NULL
      ORDER BY last_visit ASC`,
    new: `      FROM clients c
      LEFT JOIN sales s ON c.id = s.client_id
      GROUP BY c.id, c.name, c.phone, c.email, c.created_at
      HAVING MAX(s.timestamp) < ? OR MAX(s.timestamp) IS NULL
      ORDER BY last_visit ASC`,
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
  `\n✨ Correcciones HAVING completadas: ${fixedCount}/${fixes.length}\n`,
);
