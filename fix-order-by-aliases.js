const fs = require("fs");

const filePath = "src-electron/api.cjs";
let content = fs.readFileSync(filePath, "utf8");


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
} else {
}

fs.writeFileSync(filePath, content, "utf8");

