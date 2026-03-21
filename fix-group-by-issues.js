const fs = require("fs");

const filePath = "src-electron/api.cjs";
let content = fs.readFileSync(filePath, "utf8");


// Pattern: Find queries with GROUP BY that might be missing columns
// This is a complex issue - we need to check each query manually

const issues = [
  {
    name: "ProductsWithoutMovement - GROUP BY ps.id missing columns",
    old: `      LEFT JOIN sale_items si ON ps.id = si.product_id
      WHERE ps.type = 'product'
      GROUP BY ps.id
      HAVING last_sale_date IS NULL OR last_sale_date < ?`,
    new: `      LEFT JOIN sale_items si ON ps.id = si.product_id
      WHERE ps.type = 'product'
      GROUP BY ps.id, ps.name, ps.category, ps.stock, ps.price
      HAVING last_sale_date IS NULL OR last_sale_date < ?`,
  },
  {
    name: "PurchasesBySupplier - GROUP BY s.id missing columns",
    old: `      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE DATE(po.invoice_date) >= ? AND DATE(po.invoice_date) <= ?
      GROUP BY s.id
      ORDER BY total_purchased DESC`,
    new: `      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE DATE(po.invoice_date) >= ? AND DATE(po.invoice_date) <= ?
      GROUP BY s.id, s.name, s.phone, s.email
      ORDER BY total_purchased DESC`,
  },
  {
    name: "FrequentClients - GROUP BY c.id missing columns",
    old: `      JOIN sales s ON c.id = s.client_id
      WHERE DATE(s.timestamp) >= ? AND DATE(s.timestamp) <= ?
      GROUP BY c.id
      HAVING visit_count >= ?`,
    new: `      JOIN sales s ON c.id = s.client_id
      WHERE DATE(s.timestamp) >= ? AND DATE(s.timestamp) <= ?
      GROUP BY c.id, c.name, c.phone, c.email
      HAVING visit_count >= ?`,
  },
  {
    name: "InactiveClients - GROUP BY c.id missing columns",
    old: `      FROM clients c
      LEFT JOIN sales s ON c.id = s.client_id
      GROUP BY c.id
      HAVING last_visit < ? OR last_visit IS NULL`,
    new: `      FROM clients c
      LEFT JOIN sales s ON c.id = s.client_id
      GROUP BY c.id, c.name, c.phone, c.email, c.created_at
      HAVING last_visit < ? OR last_visit IS NULL`,
  },
  {
    name: "TopClients - GROUP BY c.id missing columns",
    old: `      INNER JOIN sales s ON c.id = s.client_id
      WHERE s.timestamp BETWEEN ? AND ?
      GROUP BY c.id
      ORDER BY total_spent DESC`,
    new: `      INNER JOIN sales s ON c.id = s.client_id
      WHERE s.timestamp BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.phone, c.email
      ORDER BY total_spent DESC`,
  },
  {
    name: "ActiveClients - GROUP BY c.id missing columns",
    old: `      INNER JOIN sales s ON c.id = s.client_id
      WHERE s.timestamp >= ?
      GROUP BY c.id
      ORDER BY last_visit DESC`,
    new: `      INNER JOIN sales s ON c.id = s.client_id
      WHERE s.timestamp >= ?
      GROUP BY c.id, c.name, c.phone, c.email
      ORDER BY last_visit DESC`,
  },
  {
    name: "NewClients - GROUP BY c.id missing columns",
    old: `      LEFT JOIN sales s ON c.id = s.client_id
      WHERE c.created_at BETWEEN ? AND ?
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
    new: `      LEFT JOIN sales s ON c.id = s.client_id
      WHERE c.created_at BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.phone, c.email, c.created_at
      ORDER BY c.created_at DESC`,
  },
  {
    name: "BestSellingPackages - GROUP BY m.id missing columns",
    old: `      WHERE cm.created_at BETWEEN ? AND ?
        AND cm.status = 'active'
      GROUP BY m.id
      ORDER BY times_sold DESC`,
    new: `      WHERE cm.created_at BETWEEN ? AND ?
        AND cm.status = 'active'
      GROUP BY m.id, m.name, m.price, m.duration_days
      ORDER BY times_sold DESC`,
  },
  {
    name: "UserActivity - GROUP BY ual.user_id missing columns",
    old:
      `      LEFT JOIN users u ON ual.user_id = u.id
      WHERE ual.created_at BETWEEN ? AND ?` +
      String.fromCharCode(36) +
      `{userId ? " AND ual.user_id = ?" : ""}
      GROUP BY ual.user_id
      ORDER BY action_count DESC`,
    new:
      `      LEFT JOIN users u ON ual.user_id = u.id
      WHERE ual.created_at BETWEEN ? AND ?` +
      String.fromCharCode(36) +
      `{userId ? " AND ual.user_id = ?" : ""}
      GROUP BY ual.user_id, u.username, u.full_name, u.role
      ORDER BY action_count DESC`,
  },
  {
    name: "InventoryAdjustments - GROUP BY created_by missing columns",
    old:
      `      FROM stock_adjustments
      WHERE created_at BETWEEN ? AND ?` +
      String.fromCharCode(36) +
      `{userId ? " AND created_by = ?" : ""}` +
      String.fromCharCode(36) +
      `{productId ? " AND product_id = ?" : ""}
      GROUP BY created_by
      ORDER BY adjustment_count DESC`,
    new:
      `      FROM stock_adjustments sa
      LEFT JOIN users u ON sa.created_by = u.id
      WHERE sa.created_at BETWEEN ? AND ?` +
      String.fromCharCode(36) +
      `{userId ? " AND sa.created_by = ?" : ""}` +
      String.fromCharCode(36) +
      `{productId ? " AND sa.product_id = ?" : ""}
      GROUP BY sa.created_by, u.username
      ORDER BY adjustment_count DESC`,
  },
  {
    name: "SystemAccess - GROUP BY ual.user_id missing columns",
    old:
      `      WHERE ual.created_at BETWEEN ? AND ?
        AND (ual.action LIKE '%login%' OR ual.action LIKE '%logout%' OR ual.action LIKE '%access%')` +
      String.fromCharCode(36) +
      `{userId ? " AND ual.user_id = ?" : ""}
      GROUP BY ual.user_id
      ORDER BY access_count DESC`,
    new:
      `      WHERE ual.created_at BETWEEN ? AND ?
        AND (ual.action LIKE '%login%' OR ual.action LIKE '%logout%' OR ual.action LIKE '%access%')` +
      String.fromCharCode(36) +
      `{userId ? " AND ual.user_id = ?" : ""}
      GROUP BY ual.user_id, u.username, u.full_name, u.role
      ORDER BY access_count DESC`,
  },
  {
    name: "PriceChanges - GROUP BY changed_by missing columns",
    old:
      `      FROM price_history
      WHERE created_at BETWEEN ? AND ?` +
      String.fromCharCode(36) +
      `{productId ? " AND product_id = ?" : ""}
      GROUP BY changed_by
      ORDER BY change_count DESC`,
    new:
      `      FROM price_history ph
      LEFT JOIN users u ON ph.changed_by = u.id
      WHERE ph.created_at BETWEEN ? AND ?` +
      String.fromCharCode(36) +
      `{productId ? " AND ph.product_id = ?" : ""}
      GROUP BY ph.changed_by, u.username
      ORDER BY change_count DESC`,
  },
  {
    name: "SalesAudit - GROUP BY sa.user_id missing columns",
    old:
      `      LEFT JOIN users u ON sa.user_id = u.id
      WHERE sa.created_at BETWEEN ? AND ?` +
      String.fromCharCode(36) +
      `{userId ? " AND sa.user_id = ?" : ""}
      GROUP BY sa.user_id
      ORDER BY audit_count DESC`,
    new:
      `      LEFT JOIN users u ON sa.user_id = u.id
      WHERE sa.created_at BETWEEN ? AND ?` +
      String.fromCharCode(36) +
      `{userId ? " AND sa.user_id = ?" : ""}
      GROUP BY sa.user_id, u.username, u.full_name, u.role
      ORDER BY audit_count DESC`,
  },
];

let fixedCount = 0;

issues.forEach((issue) => {
  if (content.includes(issue.old)) {
    content = content.replace(issue.old, issue.new);
    fixedCount++;
  } else {
  }
});

fs.writeFileSync(filePath, content, "utf8");

