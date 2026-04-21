const { runAsync, getAsync, allAsync } = require("./database-pg.cjs");

// ============ HELPERS ============

// Obtener timestamp local en formato SQLite (YYYY-MM-DD HH:MM:SS)
function getLocalTimestamp() {
  const date = new Date();
  // Devolver timestamp en hora local, no UTC
  // Esto asegura que el frontend y backend usen la misma zona horaria
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
}

// ============ CLIENTS ============

async function getClients() {
  try {
    const sql = `SELECT id, name, parent_name, phone, 
                 child_name, child_age, allergies, special_notes, photo_path, 
                 created_at FROM clients ORDER BY name`;
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createClient(
  name,
  parentName,
  phone,
  childName,
  childAge,
  allergies,
  specialNotes,
) {
  try {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error("El campo 'Nombre del padre/madre/tutor' es obligatorio.");
    }

    // Verificar si ya existe un cliente con el mismo nombre y teléfono
    const existingClient = await getAsync(
      "SELECT id FROM clients WHERE name = ? AND phone = ?",
      [name, phone],
    );

    if (existingClient) {
      throw new Error("Ya existe un cliente con ese nombre y teléfono");
    }

    const sql = `
      INSERT INTO clients (name, parent_name, phone, child_name, child_age, allergies, special_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;
    const result = await runAsync(sql, [
      name,
      parentName,
      phone,
      childName,
      childAge,
      allergies,
      specialNotes,
    ]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function updateClient(
  id,
  name,
  parentName,
  phone,
  childName,
  childAge,
  allergies,
  specialNotes,
) {
  try {
    const sql = `
      UPDATE clients 
      SET name = ?, parent_name = ?, phone = ?, 
          child_name = ?, child_age = ?, allergies = ?, special_notes = ?
      WHERE id = ?
    `;
    await runAsync(sql, [
      name,
      parentName,
      phone,
      childName,
      childAge,
      allergies,
      specialNotes,
      id,
    ]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function deleteClient(id) {
  try {
    // Verificar si el cliente tiene registros relacionados
    const hasSessions = await getAsync(
      "SELECT COUNT(*) as count FROM active_sessions WHERE client_id = ?",
      [id],
    );
    const hasSales = await getAsync(
      "SELECT COUNT(*) as count FROM sales WHERE client_id = ?",
      [id],
    );
    const hasMemberships = await getAsync(
      "SELECT COUNT(*) as count FROM client_memberships WHERE client_id = ?",
      [id],
    );
    const hasVisits = await getAsync(
      "SELECT COUNT(*) as count FROM client_visits WHERE client_id = ?",
      [id],
    );

    const totalRecords =
      (hasSessions?.count || 0) +
      (hasSales?.count || 0) +
      (hasMemberships?.count || 0) +
      (hasVisits?.count || 0);

    if (totalRecords > 0) {
      throw new Error(
        `No se puede eliminar el cliente porque tiene ${totalRecords} registro(s) relacionado(s) (sesiones, ventas, membresías o visitas)`,
      );
    }

    await runAsync("DELETE FROM clients WHERE id = ?", [id]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function getClientById(clientId) {
  try {
    const sql = `SELECT id, name, parent_name, phone, 
                 child_name, child_age, allergies, special_notes, photo_path, 
                 created_at FROM clients WHERE id = ?`;
    return await getAsync(sql, [clientId]);
  } catch (error) {
    throw error;
  }
}

// ============ SESSIONS ============

async function startSession(clientId, packageId, durationMinutes = 60) {
  try {
    const startTime = getLocalTimestamp();
    const sql =
      "INSERT INTO active_sessions (client_id, start_time, package_id, status) VALUES (?, ?, ?, ?) RETURNING id";
    const result = await runAsync(sql, [
      clientId,
      startTime,
      packageId,
      "active",
    ]);
    return {
      id: result.lastID,
      client_id: clientId,
      start_time: startTime,
      package_id: packageId,
      status: "active",
      duration_minutes: durationMinutes,
    };
  } catch (error) {
    throw error;
  }
}

async function getActiveSessions() {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(os.homedir(), "sipark_api_debug.txt");
  try {
    // Consulta ULTRA SIMPLE sin filtros complejos para asegurar que devuelva ALGO
    const sessions = await allAsync(`
      SELECT 
        s.*,
        c.name as client_name,
        p.name as package_name
      FROM active_sessions s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN products_services p ON s.package_id = p.id
      ORDER BY s.id DESC
      LIMIT 50
    `);
    
    // Filtrar en memoria por seguridad pero loguear el total
    const activeOnes = sessions.filter(s => 
       s.status && (s.status.toLowerCase() === 'active' || s.status.toLowerCase() === 'pending')
    );

    try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] Dashboard: Total DB=${sessions.length}, Activos=${activeOnes.length}\n`); } catch(e) {}
    
    // EXTREMADAMENTE IMPORTANTE PARA WINDOWS / ELECTRON IPC:
    // Destruir cualquier rastro de objetos nativos (Dates de Postgres, Buffers, etc.)
    // transformándolos forzosamente en strings puros de JSON.
    // Si Electron detecta un objeto desconocido de C++, aborta la transmisión en silencio y devuelve [].
    // ADEMÁS, PostgreSQL 'pg' driver a menudo devuelve BIGINTs como objetos BigInt natively. 
    // JSON.stringify tira un FATAL ERROR de TYPE si encuentra un BigInt, causando que la pantalla quede en 0.
    const safePayloadJson = JSON.stringify(activeOnes, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    );
    const safePayload = JSON.parse(safePayloadJson);

    return safePayload;
  } catch (error) {
    try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] FALLO CRITICO: ${error.message}\n`); } catch(e) {}
    throw error;
  }
}

async function endSession(sessionId, finalPrice) {
  try {
    // Obtener datos de la sesión
    const session = await getAsync(
      "SELECT * FROM active_sessions WHERE id = ?",
      [sessionId],
    );
    if (!session) {
      throw new Error("Sesión no encontrada");
    }

    // Calcular tiempo transcurrido
    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const elapsedMinutes = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 60000,
    );

    // Actualizar estado de sesión con tiempo final
    await runAsync(
      "UPDATE active_sessions SET status = ?, end_time = ?, elapsed_minutes = ? WHERE id = ?",
      ["completed", getLocalTimestamp(), elapsedMinutes, sessionId],
    );

    // NO crear venta aquí - la venta se crea en POSScreen con createSaleWithItems
    // Solo retornar info de la sesión

    return {
      session_id: sessionId,
      elapsed_minutes: elapsedMinutes,
    };
  } catch (error) {
    throw error;
  }
}

// ============ PRODUCTS/SERVICES ============

async function getProductsServices() {
  try {
    const sql = "SELECT * FROM products_services ORDER BY name";
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createProductService(
  name,
  price,
  type,
  category = null,
  barcode = null,
  stock = null,
  durationMinutes = null,
  imagePath = null,
) {
  try {
    const sql =
      "INSERT INTO products_services (name, price, type, category, barcode, stock, duration_minutes, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id";
    const result = await runAsync(sql, [
      name,
      price,
      type,
      category,
      barcode,
      stock,
      durationMinutes,
      imagePath,
    ]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function updateProductService(
  id,
  name,
  price,
  type,
  category = null,
  barcode = null,
  stock = null,
  durationMinutes = null,
  imagePath = null,
) {
  try {
    const sql =
      "UPDATE products_services SET name = ?, price = ?, type = ?, category = ?, barcode = ?, stock = ?, duration_minutes = ?, image_path = ? WHERE id = ?";
    await runAsync(sql, [
      name,
      price,
      type,
      category,
      barcode,
      stock,
      durationMinutes,
      imagePath,
      id,
    ]);
  } catch (error) {
    throw error;
  }
}

async function updateProductCategory(productId, categoryName) {
  try {
    // Buscar el tipo de la categoría seleccionada
    const category = await getAsync("SELECT type FROM categories WHERE name = ?", [categoryName]);
    const type = category ? category.type : "food";

    const sql = "UPDATE products_services SET category = ?, type = ? WHERE id = ?";
    await runAsync(sql, [categoryName, type, productId]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function deleteProductService(id) {
  try {
    const sql = "DELETE FROM products_services WHERE id = ?";
    await runAsync(sql, [id]);
  } catch (error) {
    throw error;
  }
}

// ============ SALES ============

async function getSales(limit = 100) {
  try {
    const sql = `
      SELECT 
        s.id,
        s.client_id,
        COALESCE(c.name, 'Cliente General') as client_name,
        s.total,
        s.timestamp,
        s.payment_method
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      ORDER BY s.timestamp DESC
      LIMIT ?
    `;
    const sales = await allAsync(sql, [limit]);
    return sales;
  } catch (error) {
    throw error;
  }
}

// ============ STATS ============

async function getDailyStats() {
  try {
    const today = getLocalTimestamp().split(" ")[0]; // Solo la fecha YYYY-MM-DD

    const sql = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(total) as total_revenue,
        COUNT(DISTINCT client_id) as unique_clients
      FROM sales
      WHERE DATE(timestamp) = ?
    `;
    const result = await getAsync(sql, [today]);
    return result || { total_sales: 0, total_revenue: 0, unique_clients: 0 };
  } catch (error) {
    throw error;
  }
}

// ============ DASHBOARD EJECUTIVO ============

async function getExecutiveDashboard() {
  try {
    const today = getLocalTimestamp().split(" ")[0];
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    )
      .toISOString()
      .split("T")[0];
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split("T")[0];

    // Ventas del día
    const dailySales = await getAsync(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total,
        COALESCE(AVG(total), 0) as average
      FROM sales
      WHERE DATE(timestamp) = ?`,
      [today],
    );

    // Ventas del mes actual
    const monthlySales = await getAsync(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE DATE(timestamp) >= ?`,
      [firstDayOfMonth],
    );

    // Ventas del mes anterior
    const lastMonthSales = await getAsync(
      `SELECT 
        COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?`,
      [firstDayOfLastMonth, lastDayOfLastMonth],
    );

    // Clientes atendidos
    const clientsToday = await getAsync(
      `SELECT COUNT(DISTINCT client_id) as count
      FROM sales
      WHERE DATE(timestamp) = ? AND client_id IS NOT NULL`,
      [today],
    );

    const clientsThisWeek = await getAsync(
      `SELECT COUNT(DISTINCT client_id) as count
      FROM sales
      WHERE DATE(timestamp) >= DATE('now', '-7 days') AND client_id IS NOT NULL`,
    );

    const clientsThisMonth = await getAsync(
      `SELECT COUNT(DISTINCT client_id) as count
      FROM sales
      WHERE DATE(timestamp) >= ? AND client_id IS NOT NULL`,
      [firstDayOfMonth],
    );

    // Productos con stock bajo (menos de 10 unidades)
    const lowStock = await allAsync(
      `SELECT id, name, stock, price
      FROM products_services
      WHERE type IN ('food', 'drink', 'snack', 'rental') AND stock < 10
      ORDER BY stock ASC
      LIMIT 5`,
    );

    // Estado de caja
    const activeCashBox = await getAsync(
      `SELECT id, opening_amount, opened_at, opened_by
      FROM cash_boxes
      WHERE status = 'open'
      ORDER BY opened_at DESC
      LIMIT 1`,
    );

    // Calcular saldo actual de caja
    let cashBoxBalance = null;
    if (activeCashBox) {
      const salesTotal = await getAsync(
        `SELECT COALESCE(SUM(total), 0) as total
        FROM sales
        WHERE cash_box_id = ? AND payment_method = 'cash'`,
        [activeCashBox.id],
      );

      const movements = await getAsync(
        `SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM cash_movements
        WHERE cash_box_id = ?`,
        [activeCashBox.id],
      );

      cashBoxBalance = {
        ...activeCashBox,
        current_balance:
          activeCashBox.opening_amount +
          salesTotal.total +
          movements.income -
          movements.expense,
      };
    }

    // Top 5 productos más vendidos del mes
    const topProducts = await allAsync(
      `SELECT 
        si.product_name,
        SUM(si.quantity) as quantity_sold,
        SUM(si.subtotal) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.timestamp) >= ?
      GROUP BY si.product_id, si.product_name
      ORDER BY quantity_sold DESC
      LIMIT 5`,
      [firstDayOfMonth],
    );

    // Ventas de los últimos 30 días (para gráfico)
    const last30DaysSales = await allAsync(
      `SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count,
        SUM(total) as total
      FROM sales
      WHERE DATE(timestamp) >= DATE('now', '-30 days')
      GROUP BY DATE(timestamp)
      ORDER BY date ASC`,
    );

    // Sesiones activas
    const activeSessions = await getAsync(
      `SELECT COUNT(*) as count
      FROM active_sessions
      WHERE status = 'active'`,
    );

    // Calcular porcentaje de cambio mes actual vs anterior
    const monthlyGrowth =
      lastMonthSales.total > 0
        ? ((monthlySales.total - lastMonthSales.total) / lastMonthSales.total) *
          100
        : 0;

    return {
      daily: {
        sales: dailySales.total,
        count: dailySales.count,
        average: dailySales.average,
      },
      monthly: {
        sales: monthlySales.total,
        count: monthlySales.count,
        lastMonth: lastMonthSales.total,
        growth: monthlyGrowth,
      },
      clients: {
        today: clientsToday.count,
        thisWeek: clientsThisWeek.count,
        thisMonth: clientsThisMonth.count,
      },
      lowStock,
      cashBox: cashBoxBalance,
      topProducts,
      last30DaysSales,
      activeSessions: activeSessions.count,
    };
  } catch (error) {
    throw error;
  }
}

// ============ REPORTES ============

async function getSalesByPeriod(startDate, endDate, paymentMethod = null) {
  try {
    let sql = `
      SELECT 
        s.id,
        s.client_id,
        COALESCE(c.name, 'Cliente General') as client_name,
        s.subtotal,
        s.discount,
        s.total,
        s.payment_method,
        s.timestamp,
        DATE(s.timestamp) as date
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE DATE(s.timestamp) >= ? AND DATE(s.timestamp) <= ?
    `;

    const params = [startDate, endDate];

    if (paymentMethod && paymentMethod !== "all") {
      sql += ` AND s.payment_method = ?`;
      params.push(paymentMethod);
    }

    sql += ` ORDER BY s.timestamp DESC`;

    const sales = await allAsync(sql, params);

    // Resumen
    const summary = await getAsync(
      `SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as average_ticket,
        COALESCE(SUM(discount), 0) as total_discount
      FROM sales
      WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
      ${paymentMethod && paymentMethod !== "all" ? "AND payment_method = ?" : ""}`,
      paymentMethod && paymentMethod !== "all"
        ? [startDate, endDate, paymentMethod]
        : [startDate, endDate],
    );

    // Ventas por día
    const dailyBreakdown = await allAsync(
      `SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total,
        COALESCE(AVG(total), 0) as average
      FROM sales
      WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
      ${paymentMethod && paymentMethod !== "all" ? "AND payment_method = ?" : ""}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC`,
      paymentMethod && paymentMethod !== "all"
        ? [startDate, endDate, paymentMethod]
        : [startDate, endDate],
    );

    // Ventas por método de pago
    const paymentMethodBreakdown = await allAsync(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
      GROUP BY payment_method
      ORDER BY total DESC`,
      [startDate, endDate],
    );

    return {
      sales,
      summary: summary || {
        total_sales: 0,
        total_revenue: 0,
        average_ticket: 0,
        total_discount: 0,
      },
      dailyBreakdown,
      paymentMethodBreakdown,
    };
  } catch (error) {
    throw error;
  }
}

async function getCashBoxReport(cashBoxId) {
  try {
    // Información de la caja
    const cashBox = await getAsync(`SELECT * FROM cash_boxes WHERE id = ?`, [
      cashBoxId,
    ]);

    if (!cashBox) {
      throw new Error("Caja no encontrada");
    }

    // Ventas de la caja
    const sales = await allAsync(
      `SELECT 
        s.id,
        s.total,
        s.payment_method,
        s.timestamp,
        COALESCE(c.name, 'Cliente General') as client_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.cash_box_id = ?
      ORDER BY s.timestamp ASC`,
      [cashBoxId],
    );

    // Movimientos de efectivo
    const movements = await allAsync(
      `SELECT * FROM cash_movements 
      WHERE cash_box_id = ?
      ORDER BY timestamp ASC`,
      [cashBoxId],
    );

    // Resumen por método de pago
    const paymentSummary = await allAsync(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE cash_box_id = ?
      GROUP BY payment_method`,
      [cashBoxId],
    );

    // Calcular totales
    const salesTotal = sales.reduce((sum, s) => sum + s.total, 0);
    const cashSales = sales
      .filter((s) => s.payment_method === "cash")
      .reduce((sum, s) => sum + s.total, 0);
    const incomeMovements = movements
      .filter((m) => m.type === "income")
      .reduce((sum, m) => sum + m.amount, 0);
    const expenseMovements = movements
      .filter((m) => m.type === "expense")
      .reduce((sum, m) => sum + m.amount, 0);

    // Debug

    const expectedCash =
      cashBox.opening_amount + cashSales + incomeMovements - expenseMovements;


    const difference = cashBox.closing_amount
      ? cashBox.closing_amount - expectedCash
      : 0;

    return {
      cashBox,
      sales,
      movements,
      paymentSummary,
      totals: {
        salesTotal,
        cashSales,
        incomeMovements,
        expenseMovements,
        expectedCash,
        actualCash: cashBox.closing_amount || 0,
        difference,
      },
    };
  } catch (error) {
    throw error;
  }
}

async function getStockReport(categoryFilter = null, lowStockOnly = false) {
  try {
    let sql = `
      SELECT 
        id,
        name,
        type,
        category,
        stock,
        price,
        (stock * price) as stock_value
      FROM products_services
      WHERE type IN ('food', 'drink', 'snack', 'rental')
    `;

    const params = [];

    if (categoryFilter) {
      sql += ` AND category = ?`;
      params.push(categoryFilter);
    }

    if (lowStockOnly) {
      sql += ` AND stock < 10`;
    }

    sql += ` ORDER BY name ASC`;

    const products = await allAsync(sql, params);

    // Resumen
    const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.stock < 10).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    return {
      products,
      summary: {
        totalProducts,
        totalValue,
        lowStockCount,
        outOfStockCount,
      },
    };
  } catch (error) {
    throw error;
  }
}

async function getTopClientsReport(startDate, endDate, limit = 10) {
  try {
    const topClients = await allAsync(
      `SELECT 
        c.id,
        c.name,
        c.phone,
        COUNT(s.id) as total_purchases,
        COALESCE(SUM(s.total), 0) as total_spent,
        COALESCE(AVG(s.total), 0) as average_ticket,
        MAX(s.timestamp) as last_purchase
      FROM clients c
      INNER JOIN sales s ON c.id = s.client_id
      WHERE DATE(s.timestamp) >= ? AND DATE(s.timestamp) <= ?
      GROUP BY c.id, c.name, c.phone
      ORDER BY total_spent DESC
      LIMIT ?`,
      [startDate, endDate, limit],
    );

    // Clientes más frecuentes
    const frequentClients = await allAsync(
      `SELECT 
        c.id,
        c.name,
        c.phone,
        COUNT(s.id) as visit_count,
        COALESCE(SUM(s.total), 0) as total_spent,
        COALESCE(AVG(s.total), 0) as average_ticket
      FROM clients c
      INNER JOIN sales s ON c.id = s.client_id
      WHERE DATE(s.timestamp) >= ? AND DATE(s.timestamp) <= ?
      GROUP BY c.id, c.name, c.phone
      ORDER BY visit_count DESC
      LIMIT ?`,
      [startDate, endDate, limit],
    );

    return {
      topClients,
      frequentClients,
    };
  } catch (error) {
    throw error;
  }
}

// ============ SETTINGS ============

async function getSetting(key) {
  try {
    const sql = "SELECT value FROM settings WHERE key = ?";
    const result = await getAsync(sql, [key]);
    return result ? result.value : null;
  } catch (error) {
    throw error;
  }
}

async function setSetting(key, value) {
  try {
    const sql = `
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `;
    await runAsync(sql, [key, value, value]);
    return value;
  } catch (error) {
    throw error;
  }
}

async function selectSystemLogo() {
  const { dialog, app } = require('electron');
  const fs = require('fs');
  const path = require('path');

  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg'] }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const sourcePath = result.filePaths[0];
    const extension = path.extname(sourcePath);
    const destDir = path.join(app.getPath('userData'), 'brand');
    
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    
    // Generar un nombre único para forzar refresco del navegador (cache bust)
    const fileName = `logo_${Date.now()}${extension}`;
    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(sourcePath, destPath);
    
    // Guardar solo el nombre del archivo en la DB (Express servirá la carpeta 'brand')
    await setSetting('system_logo', fileName);
    
    // Actualizar icono de ventana manualmente (Electron Main Process)
    try {
      const { ipcMain } = require('electron');
      ipcMain.emit('api:updateAppIcon', { sender: null }, destPath);
    } catch (e) {}

    return fileName;
  }
  return null;
}

async function getAllSettings() {
  try {
    const sql = "SELECT key, value FROM settings";
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

// ============ HEALTH CHECK ============

async function checkDatabaseConnection() {
  try {
    const sql = "SELECT 1";
    await getAsync(sql);
    return { connected: true, message: "Base de datos conectada" };
  } catch (error) {
    return { connected: false, message: "Error de conexión" };
  }
}



// ============ CREATE SESSION (Check-in) ============

async function createSession(
  clientName,
  parentName,
  phone,
  packageId,
  durationMinutes = 60,
  isPaid = false,
  childrenCount = 1
) {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(os.tmpdir(), "sipark_api_logs.txt");
  try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] createSession called: ${clientName}, ${packageId}\n`); } catch(e) {}
  try {
    let clientId;

    // Si no hay teléfono, buscar o crear cliente "Cliente General"
    if (!phone || phone.trim() === "") {
      const sqlClient = "SELECT id FROM clients WHERE name = $1 AND phone = $2";
      const generalClient = await getAsync(sqlClient, ["Cliente General", "0000000000"]);

      if (generalClient) {
        clientId = generalClient.id;
      } else {
        const sqlInsert = "INSERT INTO clients (name, parent_name, phone) VALUES ($1, $2, $3) RETURNING id";
        const result = await runAsync(sqlInsert, ["Cliente General", "Sin Registro", "0000000000"]);
        clientId = result.lastID;
      }
    } else {
      // Cliente con teléfono - buscar o crear
      const sqlClient = "SELECT id FROM clients WHERE name = $1 AND phone = $2";
      const existingClient = await getAsync(sqlClient, [clientName, phone]);

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const sqlInsert = "INSERT INTO clients (name, parent_name, phone) VALUES ($1, $2, $3) RETURNING id";
        const result = await runAsync(sqlInsert, [clientName, parentName, phone]);
        clientId = result.lastID;
      }
    }

    // Crear sesión en estado PENDING (no inicia hasta que se presione "Empezar")
    const startTime = getLocalTimestamp();
    const sessionResult = await runAsync(
      "INSERT INTO active_sessions (client_id, start_time, package_id, duration_minutes, status, is_paid, children_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [clientId, startTime, packageId, durationMinutes, "pending", isPaid, childrenCount],
    );

    return {
      id: sessionResult.lastID,
      client_id: clientId,
      client_name: clientName,
      start_time: startTime,
      package_id: packageId,
      status: "pending",
      duration_minutes: durationMinutes,
      is_paid: isPaid,
      children_count: childrenCount
    };
  } catch (error) {
    throw error;
  }
}

async function startTimerSession(sessionId) {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(os.tmpdir(), "sipark_api_logs.txt");
  try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] startTimerSession: ${sessionId}\n`); } catch(e) {}
  try {
    const startTime = getLocalTimestamp();
    await runAsync(
      "UPDATE active_sessions SET status = 'active', start_time = $1 WHERE id = $2",
      [startTime, sessionId]
    );
    return true;
  } catch (error) {
    throw error;
  }
}

async function setPackageIsStandardEntry(packageId, isStandardEntry) {
  try {
    await runAsync(
      "UPDATE products_services SET is_standard_entry = $1 WHERE id = $2",
      [isStandardEntry ? 1 : 0, packageId]
    );
    return true;
  } catch (error) {
    throw error;
  }
}


async function updateSessionPaidStatus(sessionId, isPaid) {
  try {
    await runAsync(
      "UPDATE active_sessions SET is_paid = ? WHERE id = ?",
      [isPaid, sessionId]
    );
    return true;
  } catch (error) {
    throw error;
  }
}

async function openCashBox(openingAmount, openedBy = "Admin") {
  try {
    const sql = `
      INSERT INTO cash_boxes (opening_amount, opened_at, opened_by, status)
      VALUES (?, ?, ?, 'open')
      RETURNING id
    `;
    const result = await runAsync(sql, [
      openingAmount,
      getLocalTimestamp(),
      openedBy,
    ]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function getActiveCashBox() {
  try {
    const sql =
      "SELECT * FROM cash_boxes WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1";
    return await getAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function closeCashBox(
  cashBoxId,
  closingAmount,
  closedBy = "Admin",
  notes = "",
) {
  try {
    // Obtener caja
    const cashBox = await getAsync("SELECT * FROM cash_boxes WHERE id = ?", [
      cashBoxId,
    ]);
    if (!cashBox) {
      throw new Error("Caja no encontrada");
    }

    // Calcular totales de ventas
    const salesTotal = await getAsync(
      "SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE cash_box_id = ?",
      [cashBoxId],
    );

    const expensesTotal = await getAsync(
      "SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM cash_movements WHERE cash_box_id = ? AND type = 'expense'",
      [cashBoxId],
    );

    // ===== INFORMACIÓN ADICIONAL DETALLADA =====
    
    // 1. Número total de transacciones
    const transactionCount = await getAsync(
      "SELECT COUNT(*) as count FROM sales WHERE cash_box_id = ?",
      [cashBoxId],
    );

    // 2. Desglose por método de pago
    const paymentMethods = await allAsync(
      `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total), 0) as total 
       FROM sales WHERE cash_box_id = ? 
       GROUP BY payment_method`,
      [cashBoxId],
    );

    // 3. Descuentos aplicados
    const discountsTotal = await getAsync(
      "SELECT COALESCE(SUM(discount), 0) as total FROM sales WHERE cash_box_id = ?",
      [cashBoxId],
    );

    // 4. Vouchers canjeados (buscar en sale_items con product_id = -98)
    const vouchersRedeemed = await getAsync(
      `SELECT COUNT(DISTINCT si.sale_id) as count
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.cash_box_id = ? AND si.product_id = -98`,
      [cashBoxId],
    );

    // 5. Membresías vendidas/recargadas (product_id = -99 para recargas)
    const memberships = await getAsync(
      `SELECT 
        COUNT(CASE WHEN si.product_type = 'membership' AND si.product_id != -99 THEN 1 END) as sold,
        COUNT(CASE WHEN si.product_id = -99 THEN 1 END) as recharged,
        COALESCE(SUM(CASE WHEN si.product_id = -99 THEN si.subtotal ELSE 0 END), 0) as recharge_amount
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.cash_box_id = ?`,
      [cashBoxId],
    );

    // 6. Sesiones/Paquetes vendidos
    const packagesCount = await getAsync(
      `SELECT COUNT(*) as count, COALESCE(SUM(si.subtotal), 0) as total
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.cash_box_id = ? AND si.product_type = 'package'`,
      [cashBoxId],
    );

    // 7. Top 5 productos más vendidos
    const topProducts = await allAsync(
      `SELECT si.product_name, si.product_type, 
              SUM(si.quantity) as quantity, 
              COALESCE(SUM(si.subtotal), 0) as total
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.cash_box_id = ? AND si.product_id > 0
       GROUP BY si.product_name, si.product_type
       ORDER BY quantity DESC
       LIMIT 5`,
      [cashBoxId],
    );

    // 8. Movimientos de caja (entradas/salidas)
    const cashMovements = await getAsync(
      `SELECT 
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income_total,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as expense_total
       FROM cash_movements WHERE cash_box_id = ?`,
      [cashBoxId],
    );

    const expectedAmount =
      parseFloat(cashBox.opening_amount) + parseFloat(salesTotal.total) - parseFloat(expensesTotal.total);
    const difference = closingAmount - expectedAmount;

    // Cerrar caja
    const sql = `
      UPDATE cash_boxes 
      SET closing_amount = ?, expected_amount = ?, difference = ?, 
          closed_at = ?, closed_by = ?, status = 'closed', notes = ?
      WHERE id = ?
    `;
    await runAsync(sql, [
      closingAmount,
      expectedAmount,
      difference,
      getLocalTimestamp(),
      closedBy,
      notes,
      cashBoxId,
    ]);

    // Calcular ticket promedio
    const avgTicket = transactionCount.count > 0 
      ? parseFloat(salesTotal.total) / transactionCount.count 
      : 0;

    return {
      cashBoxId,
      openingAmount: cashBox.opening_amount,
      closingAmount,
      expectedAmount,
      difference,
      salesTotal: salesTotal.total,
      expensesTotal: expensesTotal.total,
      // Información adicional detallada
      transactionCount: transactionCount.count,
      avgTicket,
      paymentMethods: paymentMethods || [],
      discountsTotal: discountsTotal.total,
      vouchersRedeemed: vouchersRedeemed.count || 0,
      memberships: {
        sold: memberships.sold || 0,
        recharged: memberships.recharged || 0,
        rechargeAmount: memberships.recharge_amount || 0,
      },
      packages: {
        count: packagesCount.count || 0,
        total: packagesCount.total || 0,
      },
      topProducts: topProducts || [],
      cashMovements: {
        incomeCount: cashMovements.income_count || 0,
        incomeTotal: cashMovements.income_total || 0,
        expenseCount: cashMovements.expense_count || 0,
        expenseTotal: cashMovements.expense_total || 0,
      },
    };
  } catch (error) {
    throw error;
  }
}

async function addCashMovement(cashBoxId, type, amount, description) {
  try {
    const sql = `
      INSERT INTO cash_movements (cash_box_id, type, amount, description, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await runAsync(sql, [
      cashBoxId,
      type,
      amount,
      description,
      getLocalTimestamp(),
    ]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function getCashBoxMovements(cashBoxId) {
  try {
    const sql = `
      SELECT * FROM cash_movements 
      WHERE cash_box_id = ? 
      ORDER BY timestamp ASC
    `;
    return await allAsync(sql, [cashBoxId]);
  } catch (error) {
    throw error;
  }
}

async function getCashBoxSales(cashBoxId) {
  try {
    const sql = `
      SELECT s.*, c.name as client_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.cash_box_id = ?
      ORDER BY s.timestamp ASC
    `;
    return await allAsync(sql, [cashBoxId]);
  } catch (error) {
    throw error;
  }
}

// ============ SALES WITH ITEMS ============

async function createSaleWithItems(saleData) {
  try {
    const {
      client_id,
      client_name,
      items,
      subtotal,
      discount,
      total,
      payment_method,
      cash_box_id,
    } = saleData;

    // Crear venta
    const saleSql = `
      INSERT INTO sales (client_id, client_name, subtotal, discount, total, payment_method, cash_box_id, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const saleResult = await runAsync(saleSql, [
      client_id || null,
      client_name || null,
      subtotal,
      discount,
      total,
      payment_method,
      cash_box_id,
      getLocalTimestamp(),
    ]);

    const saleId = saleResult.rows[0].id;

    // Crear items de venta
    for (const item of items) {
      // product_id negativo (voucher=-98, NFC=-99, etc.) → NULL para respetar FK
      const productId = (item.product_id && item.product_id > 0) ? item.product_id : null;
      const itemSql = `
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await runAsync(itemSql, [
        saleId,
        productId,
        item.product_name,
        item.quantity,
        item.unit_price,
        item.subtotal,
      ]);

      // Actualizar stock solo si hay product_id y es producto físico
      if (productId && ["snack", "drink", "food"].includes(item.product_type)) {
        await runAsync(
          "UPDATE products_services SET stock = stock - $1 WHERE id = $2",
          [item.quantity, productId]
        );
      }

      // CASO ESPECIAL: Si es un Paquete (Entrada) vendido directamente en el POS
      // y NO viene vinculado de una sesión ya creada (como en el flujo de Check-In)
      if (item.product_type === 'package' && !item.active_session_id) {
        try {
          // Crear sesión automática marcada como pagada
          const startTime = getLocalTimestamp();
          // Intentar obtener el duration_minutes por defecto si no viene
          let duration = item.duration_minutes || 60;
          if (!item.duration_minutes && productId) {
             const p = await getAsync("SELECT duration_minutes FROM products_services WHERE id = ?", [productId]);
             if (p?.duration_minutes) duration = p.duration_minutes;
          }

          // Obtener o crear clientId fallback (Cliente General)
          let finalClientId = client_id;
          if (!finalClientId) {
            const general = await getAsync("SELECT id FROM clients WHERE name = $1", ["Cliente General"]);
            if (general) finalClientId = general.id;
            else {
              const res = await runAsync("INSERT INTO clients (name, parent_name) VALUES ($1, $2) RETURNING id", ["Cliente General", "Sin Registro"]);
              finalClientId = res.lastID;
            }
          }

          await runAsync(
            "INSERT INTO active_sessions (client_id, start_time, package_id, duration_minutes, status, is_paid, children_count) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [finalClientId, startTime, productId, duration, "active", true, item.quantity || 1]
          );
        } catch (sessionErr) {
          console.error("Error creando sesión automática desde POS:", sessionErr);
        }
      }
    }

    return saleId;
  } catch (error) {
    throw error;
  }
}


async function getSaleWithItems(saleId) {
  try {
    const sale = await getAsync(
      `SELECT 
        s.*,
        COALESCE(c.name, 'Cliente General') as client_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.id = ?`,
      [saleId],
    );

    if (!sale) return null;

    const items = await allAsync("SELECT * FROM sale_items WHERE sale_id = ?", [
      saleId,
    ]);
    return { ...sale, items };
  } catch (error) {
    throw error;
  }
}

// ============ INVENTORY ============

async function getInventoryProducts() {
  try {
    const sql = `
      SELECT * FROM products_services 
      WHERE type IN ('food', 'drink', 'snack', 'rental', 'event')
      ORDER BY name ASC
    `;
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function updateProductStock(productId, newStock) {
  try {
    const sql = "UPDATE products_services SET stock = ? WHERE id = ?";
    await runAsync(sql, [newStock, productId]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function adjustProductStock(
  productId,
  adjustment,
  reason,
  notes = "",
  createdBy = "Admin",
) {
  try {
    // Obtener stock actual
    const product = await getAsync(
      "SELECT stock, name FROM products_services WHERE id = ?",
      [productId],
    );
    if (!product) throw new Error("Producto no encontrado");

    const previousStock = product.stock;
    const newStock = previousStock + adjustment;

    if (newStock < 0) throw new Error("Stock no puede ser negativo");

    // Determinar tipo de ajuste
    let adjustmentType = "";
    if (adjustment > 0) {
      adjustmentType = reason.includes("Devolución")
        ? "return"
        : "adjustment_in";
    } else {
      adjustmentType =
        reason.includes("Merma") || reason.includes("Pérdida")
          ? "loss"
          : reason.includes("Devolución proveedor")
            ? "return_supplier"
            : "adjustment_out";
    }

    // Actualizar stock
    await runAsync("UPDATE products_services SET stock = ? WHERE id = ?", [
      newStock,
      productId,
    ]);

    // Registrar ajuste en historial
    await runAsync(
      `INSERT INTO stock_adjustments 
       (product_id, adjustment_type, quantity, previous_stock, new_stock, reason, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        adjustmentType,
        adjustment,
        previousStock,
        newStock,
        reason,
        notes,
        createdBy,
        getLocalTimestamp(),
      ],
    );

    return {
      newStock,
      adjustment,
      reason,
      previousStock,
      productName: product.name,
    };
  } catch (error) {
    throw error;
  }
}

async function getStockAdjustments(productId = null, limit = 50) {
  try {
    let sql = `
      SELECT sa.*, ps.name as product_name
      FROM stock_adjustments sa
      LEFT JOIN products_services ps ON sa.product_id = ps.id
    `;

    const params = [];
    if (productId) {
      sql += " WHERE sa.product_id = ?";
      params.push(productId);
    }

    sql += " ORDER BY sa.created_at DESC LIMIT ?";
    params.push(limit);

    return await allAsync(sql, params);
  } catch (error) {
    throw error;
  }
}

async function getLowStockProducts(threshold = 10) {
  try {
    const sql = `
      SELECT * FROM products_services 
      WHERE type IN ('food', 'drink', 'snack', 'rental', 'event')
      AND stock <= ?
      ORDER BY stock ASC
    `;
    return await allAsync(sql, [threshold]);
  } catch (error) {
    throw error;
  }
}

// ============ SUPPLIERS ============

async function getSuppliers() {
  try {
    const sql = "SELECT * FROM suppliers ORDER BY name ASC";
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createSupplier(name, contactName, phone, email, address, notes) {
  try {
    const sql = `
      INSERT INTO suppliers (name, contact_name, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id
    `;
    const result = await runAsync(sql, [
      name,
      contactName,
      phone,
      email,
      address,
      notes,
    ]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function updateSupplier(
  id,
  name,
  contactName,
  phone,
  email,
  address,
  notes,
) {
  try {
    const sql = `
      UPDATE suppliers 
      SET name = ?, contact_name = ?, phone = ?, email = ?, address = ?, notes = ?
      WHERE id = ?
    `;
    await runAsync(sql, [name, contactName, phone, email, address, notes, id]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function deleteSupplier(id) {
  try {
    await runAsync("DELETE FROM suppliers WHERE id = ?", [id]);
    return true;
  } catch (error) {
    throw error;
  }
}

// ============ CATEGORIES ============

async function getCategories() {
  try {
    const sql = "SELECT * FROM categories ORDER BY name ASC";
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createCategory(name, description, type = "food") {
  try {
    const sql =
      "INSERT INTO categories (name, description, type) VALUES (?, ?, ?) RETURNING id";
    const result = await runAsync(sql, [name, description, type]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function updateCategory(id, name, description, type = "food") {
  try {
    const sql = "UPDATE categories SET name = ?, description = ?, type = ? WHERE id = ?";
    await runAsync(sql, [name, description, type, id]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function deleteCategory(id) {
  try {
    await runAsync("DELETE FROM categories WHERE id = ?", [id]);
    return true;
  } catch (error) {
    throw error;
  }
}

// ============ PURCHASE ORDERS ============

async function createPurchaseOrder(purchaseData) {
  try {
    const {
      supplier_id,
      invoice_number,
      invoice_date,
      total_amount,
      items,
      notes,
    } = purchaseData;

    // Crear orden de compra
    const poSql = `
      INSERT INTO purchase_orders (supplier_id, invoice_number, invoice_date, total_amount, total_items, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;
    const poResult = await runAsync(poSql, [
      supplier_id,
      invoice_number,
      invoice_date,
      total_amount,
      items.length,
      notes || null,
      getLocalTimestamp(),
    ]);

    const purchaseOrderId = poResult.lastID;

    // Crear items de compra y actualizar stock
    for (const item of items) {
      // Insertar item de compra
      const itemSql = `
        INSERT INTO purchase_items (purchase_order_id, product_id, quantity, unit_cost, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `;
      await runAsync(itemSql, [
        purchaseOrderId,
        item.product_id,
        item.quantity,
        item.unit_cost,
        item.subtotal,
      ]);

      // Actualizar stock del producto
      const updateResult = await runAsync(
        "UPDATE products_services SET stock = stock + ? WHERE id = ?",
        [item.quantity, item.product_id],
      );
    }
    return purchaseOrderId;
  } catch (error) {
    throw error;
  }
}

async function getPurchaseOrders(limit = 50) {
  try {
    const sql = `
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.created_at DESC
      LIMIT ?
    `;
    return await allAsync(sql, [limit]);
  } catch (error) {
    throw error;
  }
}

async function getPurchaseOrderWithItems(purchaseOrderId) {
  try {
    const po = await getAsync(
      `SELECT po.*, s.name as supplier_name, s.phone as supplier_phone
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = ?`,
      [purchaseOrderId],
    );
    if (!po) return null;

    const items = await allAsync(
      `SELECT pi.*, ps.name as product_name
       FROM purchase_items pi
       LEFT JOIN products_services ps ON pi.product_id = ps.id
       WHERE pi.purchase_order_id = ?`,
      [purchaseOrderId],
    );

    return { ...po, items };
  } catch (error) {
    throw error;
  }
}

// ============ DATABASE CLEANUP ============

async function clearAllData() {
  try {

    // Deshabilitar temporalmente las claves foráneas
    await runAsync("PRAGMA foreign_keys = OFF");

    // Orden importante: primero las tablas dependientes, luego las principales
    const tables = [
      // Tablas con dependencias múltiples (primero)
      "quotation_items",
      "membership_usage",
      "membership_renewals",
      "client_visits",
      "package_included_features",
      "reservations",
      "sales_audit",
      "price_history",
      "user_audit_log",
      "user_permissions",
      "stock_adjustments",
      "purchase_items",
      "sale_items",
      "cash_movements",

      // Tablas con dependencias simples
      "purchase_orders",
      "sales",
      "client_memberships",
      "active_sessions",
      "quotations",
      "cash_boxes",

      // Tablas base (sin dependencias)
      "products_services",
      "clients",
      "categories",
      "suppliers",
      "memberships",
      "package_features",
      "package_feature_categories",
      "users",
    ];

    for (const table of tables) {
      try {
        await runAsync(`DELETE FROM ${table}`);
      } catch (err) {
        // Si la tabla no existe, continuar
        if (!err.message.includes("no such table")) {
        }
      }
    }

    // Reiniciar los autoincrement
    await runAsync("DELETE FROM sqlite_sequence");

    // Reactivar las claves foráneas
    await runAsync("PRAGMA foreign_keys = ON");


    return { success: true, message: "Base de datos limpiada exitosamente" };
  } catch (error) {
    // Asegurar que las claves foráneas se reactiven incluso si hay error
    try {
      await runAsync("PRAGMA foreign_keys = ON");
    } catch (e) {
      // Ignorar error al reactivar
    }
    throw error;
  }
}

// ============ MEMBERSHIPS ============

async function getMemberships() {
  try {
    const sql =
      "SELECT * FROM memberships WHERE is_active = TRUE ORDER BY name ASC";
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createMembership(
  name,
  description,
  price,
  duration_days,
  auto_renew = false,
  is_active = true,
  total_hours = null,
  membership_type = "standard",
) {
  try {
    const benefits = ""; // No se usa por ahora, pero lo mantenemos para compatibilidad
    const max_sessions_per_day = null;
    const discount_percentage = 0;
    const priority_level = 0;
    const grace_period_days = 0;
    const phone = null;
    const id_card = null;
    const acquisition_date = null;

    const sql = `
      INSERT INTO memberships (
        name, description, price, duration_days, benefits,
        membership_type, max_sessions_per_day, discount_percentage,
        priority_level, auto_renew, grace_period_days, is_active,
        phone, id_card, acquisition_date, total_hours
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;
    const result = await runAsync(sql, [
      name,
      description,
      price,
      duration_days,
      benefits,
      membership_type,
      max_sessions_per_day,
      discount_percentage,
      priority_level,
      auto_renew,
      grace_period_days,
      true,
      phone,
      id_card,
      acquisition_date,
      total_hours,
    ]);
    return result.rows[0].id;
  } catch (error) {
    throw error;
  }
}

async function updateMembership(
  id,
  name,
  description,
  price,
  duration_days,
  auto_renew,
  is_active,
  total_hours,
) {
  try {
    const benefits = "";
    const membership_type = "standard";
    const max_sessions_per_day = null;
    const discount_percentage = 0;
    const priority_level = 0;
    const grace_period_days = 0;
    const phone = null;
    const id_card = null;
    const acquisition_date = null;

    const sql = `
      UPDATE memberships 
      SET name = ?, description = ?, price = ?, duration_days = ?, benefits = ?,
          membership_type = ?, max_sessions_per_day = ?, discount_percentage = ?,
          priority_level = ?, auto_renew = ?, grace_period_days = ?, is_active = ?,
          phone = ?, id_card = ?, acquisition_date = ?, total_hours = ?
      WHERE id = ?
    `;
    await runAsync(sql, [
      name,
      description,
      price,
      duration_days,
      benefits,
      membership_type,
      max_sessions_per_day,
      discount_percentage,
      priority_level,
      !!auto_renew,
      grace_period_days,
      !!is_active,
      phone,
      id_card,
      acquisition_date,
      total_hours,
      id,
    ]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function deleteMembership(id) {
  try {
    await runAsync("UPDATE memberships SET is_active = FALSE WHERE id = ?", [
      id,
    ]);
    return true;
  } catch (error) {
    throw error;
  }
}

// ============ CLIENT MEMBERSHIPS ============

async function getClientMemberships(clientId) {
  try {
    const sql = `
      SELECT cm.*, m.name as membership_name, m.duration_days, m.benefits
      FROM client_memberships cm
      JOIN memberships m ON cm.membership_id = m.id
      WHERE cm.client_id = ?
      ORDER BY cm.created_at DESC
    `;
    return await allAsync(sql, [clientId]);
  } catch (error) {
    throw error;
  }
}

async function assignMembership(
  clientId,
  membershipId,
  paymentAmount,
  notes,
  createdBy,
  phone = null,
  id_card = null,
  acquisition_date = null,
  total_hours = null,
) {
  try {
    // Obtener duración de la membresía
    const membership = await getAsync(
      "SELECT duration_days FROM memberships WHERE id = ?",
      [membershipId],
    );
    if (!membership) throw new Error("Membresía no encontrada");

    const startDate = getLocalTimestamp().split(" ")[0]; // YYYY-MM-DD
    const endDate = new Date();
    // Usar la fecha actual del sistema local para calcular el fin
    endDate.setDate(endDate.getDate() + membership.duration_days);
    
    // Formatear endDate a YYYY-MM-DD local
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    const endDateStr = `${year}-${month}-${day}`;

    let userId = null;
    if (createdBy) {
      if (typeof createdBy === "number") {
        userId = createdBy;
      } else {
        const user = await getAsync("SELECT id FROM users WHERE username = ?", [
          createdBy,
        ]);
        userId = user ? user.id : null;
      }
    }

    const sql = `
      INSERT INTO client_memberships (
        client_id, membership_id, start_date, end_date, status, 
        payment_amount, balance, notes, phone, id_card, acquisition_date, 
        total_hours, created_by, created_at
      )
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;
    const result = await runAsync(sql, [
      clientId,
      membershipId,
      startDate,
      endDateStr,
      paymentAmount,
      paymentAmount, // Initial balance = payment amount
      notes,
      phone,
      id_card,
      acquisition_date || startDate,
      total_hours,
      userId,
      getLocalTimestamp(),
    ]);
    return result.rows[0].id;
  } catch (error) {
    throw error;
  }
}

async function cancelClientMembership(id, canceledBy) {
  try {
    await runAsync(
      "UPDATE client_memberships SET status = 'cancelled' WHERE id = ?",
      [id],
    );
    return true;
  } catch (error) {
    throw error;
  }
}

// Registrar renovación de membresía
async function recordMembershipRenewal(renewalData) {
  try {
    const sql = `
      INSERT INTO membership_renewals (
        client_id, old_membership_id, new_membership_id, renewal_date,
        old_end_date, new_end_date, payment_amount, payment_method,
        discount_applied, notes, processed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await runAsync(sql, [
      renewalData.client_id,
      renewalData.old_membership_id,
      renewalData.new_membership_id,
      renewalData.renewal_date,
      renewalData.old_end_date,
      renewalData.new_end_date,
      renewalData.payment_amount,
      renewalData.payment_method,
      renewalData.discount_applied,
      renewalData.notes,
      renewalData.processed_by,
    ]);

    return result.lastID;
  } catch (error) {
    throw error;
  }
}

// Obtener membresía activa de un cliente
async function getClientActiveMembership(clientId) {
  try {
    const sql = `
      SELECT 
        cm.*,
        m.name as membership_name,
        m.discount_percentage,
        m.max_sessions_per_day,
        m.priority_level
      FROM client_memberships cm
      INNER JOIN memberships m ON cm.membership_id = m.id
      WHERE cm.client_id = ?
        AND cm.status = 'active'
        AND cm.end_date >= CURRENT_DATE
      ORDER BY cm.end_date DESC
      LIMIT 1
    `;

    return await getAsync(sql, [clientId]);
  } catch (error) {
    throw error;
  }
}

// Registrar uso de membresía
async function recordMembershipUsage(usageData) {
  try {
    const sql = `
      INSERT INTO membership_usage (
        client_membership_id, client_id, usage_date, usage_type,
        session_id, sale_id, discount_applied, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await runAsync(sql, [
      usageData.client_membership_id,
      usageData.client_id,
      usageData.usage_date || new Date().toISOString(),
      usageData.usage_type,
      usageData.session_id || null,
      usageData.sale_id || null,
      usageData.discount_applied || 0,
      usageData.notes || null,
    ]);

    return result.lastID;
  } catch (error) {
    throw error;
  }
}

// Obtener historial de uso de membresía
async function getMembershipUsageHistory(clientMembershipId) {
  try {
    const sql = `
      SELECT 
        mu.*,
        c.name as client_name,
        CASE 
          WHEN mu.usage_type = 'session' THEN 'Sesión de juego'
          WHEN mu.usage_type = 'product_discount' THEN 'Descuento en producto'
          WHEN mu.usage_type = 'service_discount' THEN 'Descuento en servicio'
          ELSE mu.usage_type
        END as usage_type_label
      FROM membership_usage mu
      INNER JOIN clients c ON mu.client_id = c.id
      WHERE mu.client_membership_id = ?
      ORDER BY mu.usage_date DESC, mu.created_at DESC
    `;

    return await allAsync(sql, [clientMembershipId]);
  } catch (error) {
    throw error;
  }
}

// Verificar límite de sesiones diarias
async function checkDailySessionLimit(clientId, clientMembershipId) {
  try {
    // Obtener la membresía para ver el límite
    const membership = await getAsync(
      `SELECT m.max_sessions_per_day 
       FROM client_memberships cm
       INNER JOIN memberships m ON cm.membership_id = m.id
       WHERE cm.id = ?`,
      [clientMembershipId],
    );

    if (!membership || !membership.max_sessions_per_day) {
      return { allowed: true, remaining: null }; // Sin límite
    }

    // Contar sesiones de hoy
    const today = new Date().toISOString().split("T")[0];
    const count = await getAsync(
      `SELECT COUNT(*) as count 
       FROM membership_usage 
       WHERE client_membership_id = ? 
         AND usage_type = 'session'
         AND DATE(usage_date) = ?`,
      [clientMembershipId, today],
    );

    const used = count?.count || 0;
    const remaining = membership.max_sessions_per_day - used;

    return {
      allowed: remaining > 0,
      remaining: remaining,
      limit: membership.max_sessions_per_day,
      used: used,
    };
  } catch (error) {
    throw error;
  }
}

// ============ CLIENT VISITS ============

async function getClientVisits(clientId, limit = 50) {
  try {
    const sql = `
      SELECT * FROM client_visits
      WHERE client_id = ?
      ORDER BY visit_date DESC, check_in_time DESC
      LIMIT ?
    `;
    return await allAsync(sql, [clientId, limit]);
  } catch (error) {
    throw error;
  }
}

async function createClientVisit(
  clientId,
  visitDate,
  checkInTime,
  amountPaid,
  notes,
  createdBy,
) {
  try {
    const sql = `
      INSERT INTO client_visits (client_id, visit_date, check_in_time, amount_paid, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;
    const result = await runAsync(sql, [
      clientId,
      visitDate,
      checkInTime,
      amountPaid,
      notes,
      createdBy,
      getLocalTimestamp(),
    ]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function updateClientVisitCheckout(
  visitId,
  checkOutTime,
  durationMinutes,
) {
  try {
    const sql = `
      UPDATE client_visits 
      SET check_out_time = ?, duration_minutes = ?
      WHERE id = ?
    `;
    await runAsync(sql, [checkOutTime, durationMinutes, visitId]);
    return true;
  } catch (error) {
    throw error;
  }
}

// ============ PACKAGE FEATURES ============

async function getPackageFeatures() {
  try {
    const sql =
      "SELECT * FROM package_features WHERE is_active = TRUE ORDER BY category, name ASC";
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createPackageFeature(name, description, category, requires_quantity = false) {
  try {
    const sql = `
      INSERT INTO package_features (name, description, category, requires_quantity, is_active)
      VALUES (?, ?, ?, ?, true)
      RETURNING id
    `;
    const result = await runAsync(sql, [name, description, category, requires_quantity]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function updatePackageFeature(id, name, description, category, requires_quantity = false) {
  try {
    const sql = `
      UPDATE package_features 
      SET name = ?, description = ?, category = ?, requires_quantity = ?
      WHERE id = ?
    `;
    await runAsync(sql, [name, description, category, requires_quantity, id]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function deletePackageFeature(id) {
  try {
    await runAsync(
      "UPDATE package_features SET is_active = FALSE WHERE id = $1",
      [id],
    );
    return true;
  } catch (error) {
    throw error;
  }
}

async function getPackageIncludedFeatures(packageId) {
  try {
    const sql = `
      SELECT pf.*, pif.quantity 
      FROM package_features pf
      JOIN package_included_features pif ON pf.id = pif.feature_id
      WHERE pif.package_id = ?
      ORDER BY pf.category, pf.name
    `;
    return await allAsync(sql, [packageId]);
  } catch (error) {
    throw error;
  }
}

async function setPackageFeatures(packageId, features) {
  try {
    // features puede ser [id1, id2] o [{id: id1, quantity: q1}, {id: id2, quantity: q2}]

    // Eliminar características existentes
    await runAsync(
      "DELETE FROM package_included_features WHERE package_id = ?",
      [packageId],
    );

    // Agregar nuevas características
    for (const item of features) {
      const featureId = typeof item === 'object' ? item.id : item;
      const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;

      await runAsync(
        "INSERT INTO package_included_features (package_id, feature_id, quantity) VALUES (?, ?, ?)",
        [packageId, featureId, quantity],
      );
    }
    return true;
  } catch (error) {
    throw error;
  }
}

// ============ PACKAGE FEATURE CATEGORIES ============

async function getPackageFeatureCategories() {
  try {
    const sql =
      "SELECT * FROM package_feature_categories WHERE is_active = TRUE ORDER BY name ASC";
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createPackageFeatureCategory(name, description) {
  try {
    const sql = `
      INSERT INTO package_feature_categories (name, description, is_active)
      VALUES (?, ?, true)
      RETURNING id
    `;
    const result = await runAsync(sql, [name, description]);
    return result.lastID;
  } catch (error) {
    throw error;
  }
}

async function updatePackageFeatureCategory(id, name, description) {
  try {
    const sql = `
      UPDATE package_feature_categories 
      SET name = ?, description = ?
      WHERE id = ?
    `;
    await runAsync(sql, [name, description, id]);
    return true;
  } catch (error) {
    throw error;
  }
}

async function deletePackageFeatureCategory(id) {
  try {
    await runAsync(
      "UPDATE package_feature_categories SET is_active = FALSE WHERE id = $1",
      [id],
    );
    return true;
  } catch (error) {
    throw error;
  }
}

async function getCashBoxes() {
  try {
    const sql = `
      SELECT 
        id,
        opening_amount,
        closing_amount,
        status,
        opened_at,
        closed_at,
        opened_by,
        closed_by
      FROM cash_boxes
      ORDER BY opened_at DESC
      LIMIT 50
    `;
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

// ============ FASE 2 - REPORTES ============

async function getSalesByProduct(startDate, endDate, categoryFilter = null) {
  try {
    let sql = `
      SELECT 
        si.product_id,
        si.product_name,
        ps.category,
        SUM(si.quantity) as quantity_sold,
        SUM(si.subtotal) as revenue,
        COUNT(DISTINCT si.sale_id) as transactions,
        AVG(si.unit_price) as average_price
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN products_services ps ON si.product_id = ps.id
      WHERE DATE(s.timestamp) >= ? AND DATE(s.timestamp) <= ?
    `;

    const params = [startDate, endDate];

    if (categoryFilter && categoryFilter !== "all") {
      sql += ` AND ps.category = ?`;
      params.push(categoryFilter);
    }

    sql += `
      GROUP BY si.product_id, si.product_name, ps.category
      ORDER BY quantity_sold DESC
    `;

    const products = await allAsync(sql, params);

    // Calcular totales y porcentajes
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity_sold, 0);

    const productsWithPercentage = products.map((p) => ({
      ...p,
      revenue_percentage:
        totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
      quantity_percentage:
        totalQuantity > 0 ? (p.quantity_sold / totalQuantity) * 100 : 0,
    }));

    // Top 5 y Bottom 5
    const topProducts = productsWithPercentage.slice(0, 5);
    const bottomProducts = productsWithPercentage.slice(-5).reverse();

    return {
      products: productsWithPercentage,
      topProducts,
      bottomProducts,
      summary: {
        totalRevenue,
        totalQuantity,
        totalProducts: products.length,
        averageRevenuePerProduct:
          products.length > 0 ? totalRevenue / products.length : 0,
      },
    };
  } catch (error) {
    throw error;
  }
}

async function getCashFlowReport(startDate, endDate) {
  try {
    // Ingresos por ventas
    const salesIncome = await allAsync(
      `SELECT 
        DATE(timestamp) as date,
        SUM(total) as amount,
        'sale' as type
      FROM sales
      WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
      GROUP BY DATE(timestamp)
      ORDER BY date ASC`,
      [startDate, endDate],
    );

    // Movimientos de caja (ingresos adicionales)
    const cashIncome = await allAsync(
      `SELECT 
        DATE(timestamp) as date,
        SUM(amount) as amount,
        'income' as type
      FROM cash_movements
      WHERE type = 'income' AND DATE(timestamp) >= ? AND DATE(timestamp) <= ?
      GROUP BY DATE(timestamp)
      ORDER BY date ASC`,
      [startDate, endDate],
    );

    // Gastos
    const expenses = await allAsync(
      `SELECT 
        DATE(timestamp) as date,
        SUM(amount) as amount,
        'expense' as type
      FROM cash_movements
      WHERE type = 'expense' AND DATE(timestamp) >= ? AND DATE(timestamp) <= ?
      GROUP BY DATE(timestamp)
      ORDER BY date ASC`,
      [startDate, endDate],
    );

    // Compras a proveedores
    const purchases = await allAsync(
      `SELECT 
        DATE(invoice_date) as date,
        SUM(total_amount) as amount,
        'purchase' as type
      FROM purchase_orders
      WHERE DATE(invoice_date) >= ? AND DATE(invoice_date) <= ?
      GROUP BY DATE(invoice_date)
      ORDER BY date ASC`,
      [startDate, endDate],
    );

    // Combinar todos los movimientos por fecha
    // Convertir fechas a strings para comparación correcta
    const allDates = new Set([
      ...salesIncome.map((s) =>
        typeof s.date === "string"
          ? s.date
          : new Date(s.date).toISOString().split("T")[0],
      ),
      ...cashIncome.map((c) =>
        typeof c.date === "string"
          ? c.date
          : new Date(c.date).toISOString().split("T")[0],
      ),
      ...expenses.map((e) =>
        typeof e.date === "string"
          ? e.date
          : new Date(e.date).toISOString().split("T")[0],
      ),
      ...purchases.map((p) =>
        typeof p.date === "string"
          ? p.date
          : new Date(p.date).toISOString().split("T")[0],
      ),
    ]);

    const dailyFlow = Array.from(allDates)
      .sort()
      .map((date) => {
        const sales =
          salesIncome.find((s) => {
            const sDate =
              typeof s.date === "string"
                ? s.date
                : new Date(s.date).toISOString().split("T")[0];
            return sDate === date;
          })?.amount || 0;
        const income =
          cashIncome.find((c) => {
            const cDate =
              typeof c.date === "string"
                ? c.date
                : new Date(c.date).toISOString().split("T")[0];
            return cDate === date;
          })?.amount || 0;
        const expense =
          expenses.find((e) => {
            const eDate =
              typeof e.date === "string"
                ? e.date
                : new Date(e.date).toISOString().split("T")[0];
            return eDate === date;
          })?.amount || 0;
        const purchase =
          purchases.find((p) => {
            const pDate =
              typeof p.date === "string"
                ? p.date
                : new Date(p.date).toISOString().split("T")[0];
            return pDate === date;
          })?.amount || 0;

        const totalIncome = sales + income;
        const totalExpense = expense + purchase;
        const netFlow = totalIncome - totalExpense;

        return {
          date,
          sales,
          income,
          expense,
          purchase,
          totalIncome,
          totalExpense,
          netFlow,
        };
      });

    // Calcular balance acumulado
    let balance = 0;
    const dailyFlowWithBalance = dailyFlow.map((day) => {
      balance += day.netFlow;
      return { ...day, balance };
    });

    // Resumen del período
    const summary = {
      totalSales: salesIncome.reduce((sum, s) => sum + s.amount, 0),
      totalIncome: cashIncome.reduce((sum, c) => sum + c.amount, 0),
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalPurchases: purchases.reduce((sum, p) => sum + p.amount, 0),
      netIncome: 0,
    };

    summary.netIncome =
      summary.totalSales +
      summary.totalIncome -
      summary.totalExpenses -
      summary.totalPurchases;

    return {
      dailyFlow: dailyFlowWithBalance,
      summary,
    };
  } catch (error) {
    throw error;
  }
}

async function getInventoryMovements(startDate, endDate, productFilter = null) {
  try {
    let sql = `
      SELECT 
        sa.id,
        sa.product_id,
        ps.name as product_name,
        ps.category as category,
        sa.adjustment_type,
        sa.quantity,
        sa.previous_stock,
        sa.new_stock,
        sa.reason,
        sa.notes,
        sa.created_by,
        sa.created_at
      FROM stock_adjustments sa
      LEFT JOIN products_services ps ON sa.product_id = ps.id
      WHERE DATE(sa.created_at) >= ? AND DATE(sa.created_at) <= ?
    `;

    const params = [startDate, endDate];

    if (productFilter) {
      sql += ` AND sa.product_id = ?`;
      params.push(productFilter);
    }

    sql += ` ORDER BY sa.created_at DESC`;

    const movements = await allAsync(sql, params);

    // Resumen por tipo
    const summary = {
      totalMovements: movements.length,
      additions: movements.filter((m) => m.adjustment_type === "add").length,
      subtractions: movements.filter((m) => m.adjustment_type === "subtract")
        .length,
      corrections: movements.filter((m) => m.adjustment_type === "correction")
        .length,
      totalAdded: movements
        .filter((m) => m.adjustment_type === "add")
        .reduce((sum, m) => sum + m.quantity, 0),
      totalSubtracted: movements
        .filter((m) => m.adjustment_type === "subtract")
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
    };

    return {
      movements,
      summary,
    };
  } catch (error) {
    throw error;
  }
}

async function getPurchasesByPeriod(startDate, endDate, supplierFilter = null) {
  try {
    let sql = `
      SELECT 
        po.id,
        po.supplier_id,
        s.name as supplier_name,
        po.invoice_date,
        po.total_amount as total,
        po.notes
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE DATE(po.invoice_date) >= ? AND DATE(po.invoice_date) <= ?
    `;

    const params = [startDate, endDate];

    if (supplierFilter && supplierFilter !== "all") {
      sql += ` AND po.supplier_id = ?`;
      params.push(supplierFilter);
    }

    sql += ` ORDER BY po.invoice_date DESC`;

    const purchases = await allAsync(sql, params);

    // Resumen
    const summary = {
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum, p) => sum + p.total, 0),
      averageOrderValue:
        purchases.length > 0
          ? purchases.reduce((sum, p) => sum + p.total, 0) / purchases.length
          : 0,
    };

    // Compras por proveedor
    const bySupplier = await allAsync(
      `SELECT 
        s.id,
        s.name,
        COUNT(po.id) as order_count,
        SUM(po.total_amount) as total_amount
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE DATE(po.invoice_date) >= ? AND DATE(po.invoice_date) <= ?
      ${supplierFilter && supplierFilter !== "all" ? "AND s.id = ?" : ""}
      GROUP BY s.id, s.name
      ORDER BY total_amount DESC`,
      supplierFilter && supplierFilter !== "all"
        ? [startDate, endDate, supplierFilter]
        : [startDate, endDate],
    );

    // Compras por día
    const dailyPurchases = await allAsync(
      `SELECT 
        DATE(invoice_date) as date,
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM purchase_orders
      WHERE DATE(invoice_date) >= ? AND DATE(invoice_date) <= ?
      ${supplierFilter && supplierFilter !== "all" ? "AND supplier_id = ?" : ""}
      GROUP BY DATE(invoice_date)
      ORDER BY date ASC`,
      supplierFilter && supplierFilter !== "all"
        ? [startDate, endDate, supplierFilter]
        : [startDate, endDate],
    );

    return {
      purchases,
      summary,
      bySupplier,
      dailyPurchases,
    };
  } catch (error) {
    throw error;
  }
}

async function getSessionsByPeriod(startDate, endDate, packageFilter = null) {
  try {
    let sql = `
      SELECT 
        s.id,
        s.client_id,
        c.name as client_name,
        s.package_id,
        ps.name as package_name,
        s.start_time,
        s.end_time,
        s.duration_minutes,
        s.status
      FROM active_sessions s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN products_services ps ON s.package_id = ps.id
      WHERE DATE(s.start_time) >= ? AND DATE(s.start_time) <= ?
    `;

    const params = [startDate, endDate];

    if (packageFilter && packageFilter !== "all") {
      sql += ` AND s.package_id = ?`;
      params.push(packageFilter);
    }

    sql += ` ORDER BY s.start_time DESC`;

    const sessions = await allAsync(sql, params);

    // Resumen
    const completedSessions = sessions.filter((s) => s.status === "completed");
    const totalDuration = completedSessions.reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0,
    );

    const summary = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => s.status === "active").length,
      completedSessions: completedSessions.length,
      averageDuration:
        completedSessions.length > 0
          ? totalDuration / completedSessions.length
          : 0,
      totalDuration,
    };

    // Sesiones por paquete
    const byPackage = await allAsync(
      `SELECT 
        ps.id,
        ps.name,
        COUNT(s.id) as session_count,
        AVG(s.duration_minutes) as avg_duration
      FROM products_services ps
      LEFT JOIN active_sessions s ON ps.id = s.package_id
      WHERE DATE(s.start_time) >= ? AND DATE(s.start_time) <= ?
      ${packageFilter && packageFilter !== "all" ? "AND ps.id = ?" : ""}
      GROUP BY ps.id, ps.name
      ORDER BY session_count DESC`,
      packageFilter && packageFilter !== "all"
        ? [startDate, endDate, packageFilter]
        : [startDate, endDate],
    );

    // Sesiones por día
    const dailySessions = await allAsync(
      `SELECT 
        DATE(start_time) as date,
        COUNT(*) as count,
        AVG(duration_minutes) as avg_duration
      FROM active_sessions
      WHERE DATE(start_time) >= ? AND DATE(start_time) <= ?
      ${packageFilter && packageFilter !== "all" ? "AND package_id = ?" : ""}
      GROUP BY DATE(start_time)
      ORDER BY date ASC`,
      packageFilter && packageFilter !== "all"
        ? [startDate, endDate, packageFilter]
        : [startDate, endDate],
    );

    return {
      sessions,
      summary,
      byPackage,
      dailySessions,
    };
  } catch (error) {
    throw error;
  }
}

// ============ FASE 3 - REPORTES COMPLEMENTARIOS ============

// Ventas por Método de Pago
async function getSalesByPaymentMethod(startDate, endDate) {
  try {
    const salesByMethod = await allAsync(
      `SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(total) as total_amount,
        AVG(total) as average_ticket
      FROM sales
      WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
      GROUP BY payment_method
      ORDER BY total_amount DESC`,
      [startDate, endDate],
    );

    const totalRevenue = salesByMethod.reduce(
      (sum, m) => sum + m.total_amount,
      0,
    );

    const methodsWithPercentage = salesByMethod.map((m) => ({
      ...m,
      percentage: totalRevenue > 0 ? (m.total_amount / totalRevenue) * 100 : 0,
    }));

    return {
      methods: methodsWithPercentage,
      summary: {
        totalRevenue,
        totalTransactions: salesByMethod.reduce(
          (sum, m) => sum + m.transaction_count,
          0,
        ),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Ventas por Hora del Día
async function getSalesByHour(startDate, endDate) {
  try {
    const salesByHour = await allAsync(
      `SELECT 
        CAST(strftime('%H', timestamp) AS INTEGER) as hour,
        COUNT(*) as transaction_count,
        SUM(total) as total_amount
      FROM sales
      WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
      GROUP BY hour
      ORDER BY hour ASC`,
      [startDate, endDate],
    );

    // Llenar horas sin ventas con 0
    const allHours = Array.from({ length: 24 }, (_, i) => {
      const hourData = salesByHour.find((h) => h.hour === i);
      return {
        hour: i,
        transaction_count: hourData?.transaction_count || 0,
        total_amount: hourData?.total_amount || 0,
      };
    });

    const peakHour = salesByHour.reduce(
      (max, h) => (h.total_amount > max.total_amount ? h : max),
      salesByHour[0] || { hour: 0, total_amount: 0 },
    );

    return {
      hourlyData: allHours,
      peakHour,
      summary: {
        totalRevenue: salesByHour.reduce((sum, h) => sum + h.total_amount, 0),
        totalTransactions: salesByHour.reduce(
          (sum, h) => sum + h.transaction_count,
          0,
        ),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Productos con Stock Bajo
async function getLowStockProducts(threshold = null) {
  try {
    let sql = `
      SELECT 
        id,
        name,
        category,
        stock,
        min_stock,
        price,
        (stock * price) as stock_value
      FROM products_services
      WHERE type = 'product' AND stock <= min_stock
    `;

    if (threshold) {
      sql += ` AND stock <= ?`;
    }

    sql += ` ORDER BY stock ASC`;

    const products = threshold
      ? await allAsync(sql, [threshold])
      : await allAsync(sql);

    const summary = {
      totalProducts: products.length,
      criticalStock: products.filter((p) => p.stock === 0).length,
      totalValue: products.reduce((sum, p) => sum + p.stock_value, 0),
    };

    return {
      products,
      summary,
    };
  } catch (error) {
    throw error;
  }
}

// Productos Sin Movimiento
async function getProductsWithoutMovement(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    const products = await allAsync(
      `SELECT 
        ps.id,
        ps.name,
        ps.category,
        ps.stock,
        ps.price,
        MAX(si.sale_id) as last_sale_id,
        (SELECT MAX(s.timestamp) 
         FROM sales s 
         JOIN sale_items si2 ON s.id = si2.sale_id 
         WHERE si2.product_id = ps.id) as last_sale_date
      FROM products_services ps
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
      ORDER BY (SELECT MAX(s.timestamp) 
         FROM sales s 
         JOIN sale_items si2 ON s.id = si2.sale_id 
         WHERE si2.product_id = ps.id) ASC`,
      [cutoffDateStr],
    );

    const productsWithDays = products.map((p) => {
      const daysSinceLastSale = p.last_sale_date
        ? Math.floor(
            (new Date() - new Date(p.last_sale_date)) / (1000 * 60 * 60 * 24),
          )
        : null;
      return {
        ...p,
        days_without_movement: daysSinceLastSale,
        stock_value: p.stock * p.price,
      };
    });

    return {
      products: productsWithDays,
      summary: {
        totalProducts: productsWithDays.length,
        totalStockValue: productsWithDays.reduce(
          (sum, p) => sum + p.stock_value,
          0,
        ),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Compras por Proveedor
async function getPurchasesBySupplier(startDate, endDate) {
  try {
    const suppliers = await allAsync(
      `SELECT 
        s.id,
        s.name,
        s.contact_name,
        s.phone,
        COUNT(po.id) as order_count,
        SUM(po.total_amount) as total_purchased,
        AVG(po.total_amount) as average_order,
        MAX(po.invoice_date) as last_purchase_date
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE DATE(po.invoice_date) >= ? AND DATE(po.invoice_date) <= ?
      GROUP BY s.id, s.name, s.phone, s.email
      ORDER BY total_purchased DESC`,
      [startDate, endDate],
    );

    const summary = {
      totalSuppliers: suppliers.length,
      totalPurchased: suppliers.reduce(
        (sum, s) => sum + (s.total_purchased || 0),
        0,
      ),
      totalOrders: suppliers.reduce((sum, s) => sum + (s.order_count || 0), 0),
    };

    return {
      suppliers,
      summary,
    };
  } catch (error) {
    throw error;
  }
}

async function getMostPurchasedProducts(startDate, endDate, limit = 20) {
  try {
    const products = await allAsync(
      `SELECT 
        p.id,
        p.name,
        p.category,
        SUM(pi.quantity) as total_quantity,
        SUM(pi.subtotal) as total_cost,
        COUNT(DISTINCT pi.purchase_order_id) as purchase_count,
        AVG(pi.unit_cost) as avg_unit_cost
      FROM purchase_items pi
      LEFT JOIN products_services p ON pi.product_id = p.id
      LEFT JOIN purchase_orders po ON pi.purchase_order_id = po.id
      WHERE po.invoice_date BETWEEN ? AND ?
      GROUP BY p.id, p.name, p.category, pi.product_id
      ORDER BY total_quantity DESC
      LIMIT ?`,
      [startDate, endDate, limit],
    );

    // Totales
    const totals = await getAsync(
      `SELECT 
        COUNT(DISTINCT pi.product_id) as unique_products,
        SUM(pi.quantity) as total_quantity,
        SUM(pi.subtotal) as total_cost
      FROM purchase_items pi
      LEFT JOIN purchase_orders po ON pi.purchase_order_id = po.id
      WHERE po.invoice_date BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    return {
      products,
      totals,
    };
  } catch (error) {
    throw error;
  }
}

async function getPurchaseOrdersHistory(startDate, endDate, supplierId = null) {
  try {
    let sql = `
      SELECT 
        po.id,
        po.invoice_number,
        po.invoice_date,
        po.total_amount,
        po.total_items,
        po.notes,
        po.created_at,
        s.name as supplier_name,
        s.contact_name as supplier_contact,
        s.phone as supplier_phone
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.invoice_date BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (supplierId) {
      sql += ` AND po.supplier_id = ?`;
      params.push(supplierId);
    }

    sql += ` ORDER BY po.invoice_date DESC`;

    const orders = await allAsync(sql, params);

    // Obtener items para cada orden
    for (const order of orders) {
      order.items = await allAsync(
        `SELECT 
          pi.id,
          pi.quantity,
          pi.unit_cost,
          pi.subtotal,
          p.name as product_name,
          p.category
        FROM purchase_items pi
        LEFT JOIN products_services p ON pi.product_id = p.id
        WHERE pi.purchase_order_id = ?`,
        [order.id],
      );
    }

    // Estadísticas
    const stats = await getAsync(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_order_amount,
        SUM(total_items) as total_items
      FROM purchase_orders
      WHERE invoice_date BETWEEN ? AND ?${supplierId ? " AND supplier_id = ?" : ""}`,
      supplierId ? [startDate, endDate, supplierId] : [startDate, endDate],
    );

    return {
      orders,
      stats,
    };
  } catch (error) {
    throw error;
  }
}

// Clientes Frecuentes
async function getFrequentClients(startDate, endDate, minVisits = 5) {
  try {
    const clients = await allAsync(
      `SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        COUNT(s.id) as visit_count,
        SUM(s.total) as total_spent,
        AVG(s.total) as average_ticket,
        MAX(s.timestamp) as last_visit
      FROM clients c
      JOIN sales s ON c.id = s.client_id
      WHERE DATE(s.timestamp) >= ? AND DATE(s.timestamp) <= ?
      GROUP BY c.id, c.name, c.phone, c.email
      HAVING COUNT(s.id) >= ?
      ORDER BY visit_count DESC`,
      [startDate, endDate, minVisits],
    );

    return {
      clients,
      summary: {
        totalClients: clients.length,
        totalVisits: clients.reduce((sum, c) => sum + c.visit_count, 0),
        totalRevenue: clients.reduce((sum, c) => sum + c.total_spent, 0),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Clientes Inactivos
async function getInactiveClients(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    const clients = await allAsync(
      `SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        MAX(s.timestamp) as last_visit,
        COUNT(s.id) as total_visits,
        SUM(s.total) as total_spent
      FROM clients c
      LEFT JOIN sales s ON c.id = s.client_id
      GROUP BY c.id, c.name, c.phone, c.email, c.created_at
      HAVING MAX(s.timestamp) < ? OR MAX(s.timestamp) IS NULL
      ORDER BY MAX(s.timestamp) ASC`,
      [cutoffDateStr],
    );

    const clientsWithDays = clients.map((c) => {
      const daysSinceLastVisit = c.last_visit
        ? Math.floor(
            (new Date() - new Date(c.last_visit)) / (1000 * 60 * 60 * 24),
          )
        : null;
      return {
        ...c,
        days_inactive: daysSinceLastVisit,
      };
    });

    return {
      clients: clientsWithDays,
      summary: {
        totalInactive: clientsWithDays.length,
      },
    };
  } catch (error) {
    throw error;
  }
}

// ============ FASE 3 - REPORTES ADICIONALES ============

// Ventas por Cliente
async function getSalesByClient(startDate, endDate, limit = 20) {
  try {
    const clients = await allAsync(
      `SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        COUNT(s.id) as total_purchases,
        COALESCE(SUM(s.total), 0) as total_spent,
        COALESCE(AVG(s.total), 0) as avg_ticket,
        MAX(s.timestamp) as last_purchase
      FROM clients c
      INNER JOIN sales s ON c.id = s.client_id
      WHERE s.timestamp BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.phone, c.email
      ORDER BY total_spent DESC
      LIMIT ?`,
      [startDate, endDate, limit],
    );

    const totalSales = await getAsync(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE timestamp BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    return {
      clients: clients.map((c) => ({
        ...c,
        percentage: totalSales.total
          ? ((c.total_spent / totalSales.total) * 100).toFixed(2)
          : "0.00",
      })),
      summary: {
        totalClients: clients.length,
        totalRevenue: totalSales.total || 0,
      },
    };
  } catch (error) {
    throw error;
  }
}

// Comparativo de Ventas
async function getSalesComparison(
  period1Start,
  period1End,
  period2Start,
  period2End,
) {
  try {
    const period1 = await getAsync(
      `SELECT 
        COUNT(id) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as avg_ticket
      FROM sales 
      WHERE timestamp BETWEEN ? AND ?`,
      [period1Start, period1End],
    );

    const period2 = await getAsync(
      `SELECT 
        COUNT(id) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as avg_ticket
      FROM sales 
      WHERE timestamp BETWEEN ? AND ?`,
      [period2Start, period2End],
    );

    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return "0.00";
      return (((current - previous) / previous) * 100).toFixed(2);
    };

    return {
      period1: {
        ...period1,
        label: `${period1Start} - ${period1End}`,
      },
      period2: {
        ...period2,
        label: `${period2Start} - ${period2End}`,
      },
      growth: {
        sales: calculateGrowth(period2.total_sales, period1.total_sales),
        revenue: calculateGrowth(period2.total_revenue, period1.total_revenue),
        avgTicket: calculateGrowth(period2.avg_ticket, period1.avg_ticket),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Ingresos vs Gastos
async function getIncomeVsExpenses(startDate, endDate) {
  try {
    // Ingresos por ventas
    const income = await getAsync(
      `SELECT SUM(total) as total FROM sales WHERE timestamp BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Gastos por compras
    const expenses = await getAsync(
      `SELECT SUM(total_amount) as total FROM purchase_orders WHERE invoice_date BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Gastos adicionales de caja
    const cashExpenses = await getAsync(
      `SELECT SUM(amount) as total FROM cash_movements 
       WHERE type = 'expense' AND timestamp BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    const totalIncome = income.total || 0;
    const totalExpenses = (expenses.total || 0) + (cashExpenses.total || 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin =
      totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0;

    return {
      income: totalIncome,
      expenses: totalExpenses,
      netProfit: netProfit,
      profitMargin: profitMargin,
      summary: {
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        netProfit: netProfit,
      },
    };
  } catch (error) {
    throw error;
  }
}

// Valorización de Inventario
async function getInventoryValuation(categoryFilter = null) {
  try {
    let sql = `
      SELECT 
        ps.id,
        ps.name,
        ps.type,
        ps.category as category_name,
        ps.stock,
        ps.price,
        (ps.stock * ps.price) as total_value
      FROM products_services ps
      WHERE ps.type = 'product' AND ps.stock > 0
    `;

    const params = [];
    if (categoryFilter) {
      sql += ` AND ps.category = ?`;
      params.push(categoryFilter);
    }

    sql += ` ORDER BY total_value DESC`;

    const products = await allAsync(sql, params);

    const summary = products.reduce(
      (acc, p) => ({
        totalValue: acc.totalValue + (p.total_value || 0),
        totalUnits: acc.totalUnits + (p.stock || 0),
      }),
      { totalValue: 0, totalUnits: 0 },
    );

    return {
      products,
      summary: {
        ...summary,
        totalProducts: products.length,
      },
    };
  } catch (error) {
    throw error;
  }
}

// Clientes Activos
async function getActiveClients(days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    const clients = await allAsync(
      `SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        MAX(s.timestamp) as last_visit,
        COUNT(s.id) as total_visits,
        SUM(s.total) as total_spent,
        AVG(s.total) as avg_ticket
      FROM clients c
      INNER JOIN sales s ON c.id = s.client_id
      WHERE s.timestamp >= ?
      GROUP BY c.id, c.name, c.phone, c.email
      ORDER BY last_visit DESC`,
      [cutoffDateStr],
    );

    return {
      clients,
      summary: {
        totalActive: clients.length,
        totalRevenue: clients.reduce((sum, c) => sum + (c.total_spent || 0), 0),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Nuevos Clientes
async function getNewClients(startDate, endDate) {
  try {
    const clients = await allAsync(
      `SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.created_at as registration_date,
        MIN(s.timestamp) as first_purchase,
        COUNT(s.id) as total_purchases,
        SUM(s.total) as total_spent
      FROM clients c
      LEFT JOIN sales s ON c.id = s.client_id
      WHERE c.created_at BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.phone, c.email, c.created_at
      ORDER BY c.created_at DESC`,
      [startDate, endDate],
    );

    return {
      clients,
      summary: {
        totalNew: clients.length,
        withPurchases: clients.filter((c) => c.total_purchases > 0).length,
        totalRevenue: clients.reduce((sum, c) => sum + (c.total_spent || 0), 0),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Paquetes Más Vendidos
async function getBestSellingPackages(startDate, endDate) {
  try {
    // Como client_visits no tiene membership_id, usamos client_memberships
    const packages = await allAsync(
      `SELECT 
        m.id,
        m.name,
        m.duration_days,
        m.price,
        COUNT(cm.id) as times_sold,
        COALESCE(SUM(cm.payment_amount), 0) as total_revenue
      FROM memberships m
      INNER JOIN client_memberships cm ON m.id = cm.membership_id
      WHERE cm.created_at BETWEEN ? AND ?
        AND cm.status = 'active'
      GROUP BY m.id, m.name, m.price, m.duration_days
      ORDER BY times_sold DESC`,
      [startDate, endDate],
    );

    const totalRevenue = packages.reduce(
      (sum, p) => sum + (p.total_revenue || 0),
      0,
    );

    return {
      packages: packages.map((p) => ({
        ...p,
        percentage:
          totalRevenue > 0
            ? ((p.total_revenue / totalRevenue) * 100).toFixed(2)
            : "0.00",
      })),
      summary: {
        totalPackages: packages.length,
        totalRevenue: totalRevenue,
        totalSold: packages.reduce((sum, p) => sum + p.times_sold, 0),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Duración Promedio de Sesiones
async function getAverageSessionDuration(
  startDate,
  endDate,
  packageFilter = null,
) {
  try {
    // Usamos client_visits directamente ya que tiene duration_minutes
    let sql = `
      SELECT 
        'Visitas Generales' as package_name,
        0 as expected_duration,
        COUNT(cv.id) as total_sessions,
        AVG(cv.duration_minutes) as avg_duration_minutes,
        MIN(cv.duration_minutes) as min_duration_minutes,
        MAX(cv.duration_minutes) as max_duration_minutes
      FROM client_visits cv
      WHERE cv.visit_date BETWEEN ? AND ?
        AND cv.duration_minutes IS NOT NULL
    `;

    const params = [startDate, endDate];

    const sessions = await allAsync(sql, params);

    const overallAvg =
      sessions.length > 0 && sessions[0].avg_duration_minutes
        ? sessions[0].avg_duration_minutes
        : 0;

    return {
      sessions,
      summary: {
        totalSessions: sessions.length > 0 ? sessions[0].total_sessions : 0,
        overallAvgDuration: overallAvg.toFixed(2),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Ocupación por Hora
async function getHourlyOccupancy(startDate, endDate) {
  try {
    // Obtener todas las sesiones en el rango de fechas
    const sql = `
      SELECT 
        strftime('%H', start_time) as hour,
        COUNT(*) as session_count,
        AVG(elapsed_minutes) as avg_duration
      FROM active_sessions
      WHERE DATE(start_time) >= ? AND DATE(start_time) <= ?
        AND status = 'completed'
      GROUP BY strftime('%H', start_time)
      ORDER BY hour
    `;

    const hourlyData = await allAsync(sql, [startDate, endDate]);

    // Crear array con todas las horas (0-23) inicializadas en 0
    const allHours = Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, "0"),
      session_count: 0,
      avg_duration: 0,
      hour_label: `${String(i).padStart(2, "0")}:00`,
    }));

    // Llenar con datos reales
    hourlyData.forEach((data) => {
      const hourIndex = parseInt(data.hour);
      allHours[hourIndex] = {
        hour: data.hour,
        session_count: data.session_count,
        avg_duration: data.avg_duration || 0,
        hour_label: `${data.hour}:00`,
      };
    });

    // Encontrar hora pico
    const peakHour = allHours.reduce(
      (max, current) =>
        current.session_count > max.session_count ? current : max,
      allHours[0],
    );

    // Calcular totales
    const totalSessions = allHours.reduce((sum, h) => sum + h.session_count, 0);
    const avgSessionsPerHour = totalSessions / 24;

    return {
      hourlyData: allHours,
      summary: {
        totalSessions,
        avgSessionsPerHour: avgSessionsPerHour.toFixed(2),
        peakHour: peakHour.hour_label,
        peakHourSessions: peakHour.session_count,
        dateRange: { startDate, endDate },
      },
    };
  } catch (error) {
    throw error;
  }
}

// Membresías Activas
async function getActiveMemberships(statusFilter = "all") {
  try {
    let sql = `
      SELECT 
        cm.id,
        c.name as client_name,
        c.phone as client_phone,
        m.name as membership_name,
        m.duration_days,
        m.price as membership_price,
        cm.start_date,
        cm.end_date,
        cm.status,
        cm.payment_amount,
        cm.balance,
        cm.notes,
        cm.phone,
        cm.id_card,
        cm.acquisition_date,
        cm.total_hours,
        crd.uid as nfc_uid,
        CAST((julianday(cm.end_date) - julianday('now')) AS INTEGER) as days_remaining
      FROM client_memberships cm
      INNER JOIN clients c ON cm.client_id = c.id
      INNER JOIN memberships m ON cm.membership_id = m.id
      LEFT JOIN nfc_cards crd ON cm.nfc_card_id = crd.id
    `;

    const params = [];

    if (statusFilter === "active") {
      sql += ` WHERE cm.status = 'active'`;
    } else if (statusFilter === "expired") {
      sql += ` WHERE cm.status = 'expired' OR cm.end_date < CURRENT_DATE`;
    } else if (statusFilter === "expiring_soon") {
      sql += ` WHERE cm.status = 'active' AND cm.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')`;
    }

    sql += ` ORDER BY cm.end_date ASC`;

    const memberships = await allAsync(sql, params);

    // Calcular estadísticas
    const stats = {
      total: memberships.length,
      active: memberships.filter(
        (m) => m.status === "active" && m.days_remaining > 0,
      ).length,
      expired: memberships.filter(
        (m) => m.status === "expired" || m.days_remaining < 0,
      ).length,
      expiringSoon: memberships.filter(
        (m) =>
          m.status === "active" &&
          m.days_remaining >= 0 &&
          m.days_remaining <= 7,
      ).length,
      totalRevenue: memberships.reduce(
        (sum, m) => sum + (m.payment_amount || 0),
        0,
      ),
    };

    return {
      memberships: memberships.map((m) => ({
        ...m,
        days_remaining: m.days_remaining < 0 ? 0 : m.days_remaining,
        is_expiring_soon: m.days_remaining >= 0 && m.days_remaining <= 7,
        is_expired: m.status === "expired" || m.days_remaining < 0,
      })),
      summary: stats,
    };
  } catch (error) {
    throw error;
  }
}

// Membresías por Vencer
async function getExpiringMemberships(daysThreshold = 30) {
  try {
    const sql = `
      SELECT 
        cm.id,
        c.id as client_id,
        c.name as client_name,
        c.phone as client_phone,
        m.name as membership_name,
        m.duration_days,
        m.price as membership_price,
        cm.start_date,
        cm.end_date,
        cm.status,
        cm.payment_amount,
        CAST((julianday(cm.end_date) - julianday('now')) AS INTEGER) as days_remaining
      FROM client_memberships cm
      INNER JOIN clients c ON cm.client_id = c.id
      INNER JOIN memberships m ON cm.membership_id = m.id
      WHERE cm.status = 'active' 
        AND cm.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + (? || ' days')::INTERVAL)
      ORDER BY cm.end_date ASC
    `;

    const memberships = await allAsync(sql, [daysThreshold]);

    // Agrupar por urgencia
    const critical = memberships.filter((m) => m.days_remaining <= 7);
    const warning = memberships.filter(
      (m) => m.days_remaining > 7 && m.days_remaining <= 15,
    );
    const normal = memberships.filter((m) => m.days_remaining > 15);

    return {
      memberships: memberships.map((m) => ({
        ...m,
        urgency:
          m.days_remaining <= 7
            ? "critical"
            : m.days_remaining <= 15
              ? "warning"
              : "normal",
      })),
      summary: {
        total: memberships.length,
        critical: critical.length,
        warning: warning.length,
        normal: normal.length,
        potentialRevenue: memberships.reduce(
          (sum, m) => sum + (m.membership_price || 0),
          0,
        ),
      },
    };
  } catch (error) {
    throw error;
  }
}

// Historial de Sesiones
async function getSessionsHistory(
  startDate,
  endDate,
  clientId = null,
  status = "all",
) {
  try {
    let sql = `
      SELECT 
        cv.id,
        cv.visit_date,
        cv.check_in_time,
        cv.check_out_time,
        cv.duration_minutes,
        c.id as client_id,
        c.name as client_name,
        c.phone as client_phone,
        m.name as membership_name,
        cm.end_date as membership_end_date,
        CASE 
          WHEN cv.check_out_time IS NULL THEN 'active'
          ELSE 'completed'
        END as status
      FROM client_visits cv
      INNER JOIN clients c ON cv.client_id = c.id
      LEFT JOIN client_memberships cm ON c.id = cm.client_id 
        AND cm.status = 'active'
        AND cv.visit_date BETWEEN cm.start_date AND cm.end_date
      LEFT JOIN memberships m ON cm.membership_id = m.id
      WHERE cv.visit_date BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (clientId) {
      sql += ` AND cv.client_id = ?`;
      params.push(clientId);
    }

    if (status === "active") {
      sql += ` AND cv.check_out_time IS NULL`;
    } else if (status === "completed") {
      sql += ` AND cv.check_out_time IS NOT NULL`;
    }

    sql += ` ORDER BY cv.visit_date DESC, cv.check_in_time DESC`;

    const sessions = await allAsync(sql, params);

    // Calcular estadísticas
    const completedSessions = sessions.filter((s) => s.check_out_time !== null);
    const totalDuration = completedSessions.reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0,
    );

    return {
      sessions,
      summary: {
        total: sessions.length,
        active: sessions.filter((s) => s.check_out_time === null).length,
        completed: completedSessions.length,
        totalDuration: totalDuration,
        averageDuration:
          completedSessions.length > 0
            ? (totalDuration / completedSessions.length).toFixed(2)
            : 0,
      },
    };
  } catch (error) {
    throw error;
  }
}

// Descuentos Aplicados
async function getDiscountsReport(
  startDate,
  endDate,
  minDiscount = 0,
  maxDiscount = null,
) {
  try {
    let sql = `
      SELECT 
        s.id,
        s.timestamp,
        s.client_id,
        COALESCE(c.name, 'Cliente General') as client_name,
        c.phone as client_phone,
        s.subtotal,
        s.discount,
        s.total,
        s.payment_method,
        CAST((s.discount / NULLIF(s.subtotal, 0) * 100) AS REAL) as discount_percentage
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.timestamp BETWEEN ? AND ?
        AND s.discount > 0
        AND s.subtotal > 0
    `;

    const params = [startDate, endDate];

    if (minDiscount > 0) {
      sql += ` AND s.discount >= ?`;
      params.push(minDiscount);
    }

    if (maxDiscount !== null) {
      sql += ` AND s.discount <= ?`;
      params.push(maxDiscount);
    }

    sql += ` ORDER BY s.discount DESC`;

    const discounts = await allAsync(sql, params);

    // Calcular totales del período
    const totalsQuery = await getAsync(
      `SELECT 
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as total_sales_count
      FROM sales 
      WHERE timestamp BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    const totalDiscountedSales = discounts.length;
    const totalDiscount = discounts.reduce(
      (sum, d) => sum + (d.discount || 0),
      0,
    );
    const averageDiscount =
      totalDiscountedSales > 0
        ? (totalDiscount / totalDiscountedSales).toFixed(2)
        : 0;
    const discountPercentageOfSales =
      totalsQuery.total_subtotal > 0
        ? ((totalDiscount / totalsQuery.total_subtotal) * 100).toFixed(2)
        : "0.00";

    // Agrupar por rangos de descuento
    const ranges = {
      low: discounts.filter((d) => d.discount_percentage < 10).length,
      medium: discounts.filter(
        (d) => d.discount_percentage >= 10 && d.discount_percentage < 25,
      ).length,
      high: discounts.filter(
        (d) => d.discount_percentage >= 25 && d.discount_percentage < 50,
      ).length,
      veryHigh: discounts.filter((d) => d.discount_percentage >= 50).length,
    };

    return {
      discounts,
      summary: {
        totalDiscountedSales,
        totalDiscount,
        averageDiscount,
        discountPercentageOfSales,
        totalSalesInPeriod: totalsQuery.total_sales_count,
        totalSubtotalInPeriod: totalsQuery.total_subtotal,
        salesWithoutDiscount:
          totalsQuery.total_sales_count - totalDiscountedSales,
      },
      ranges,
    };
  } catch (error) {
    throw error;
  }
}

async function getDailyCashSummary(date) {
  try {
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;

    // Ventas del día por método de pago
    const salesByMethod = await allAsync(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(discount), 0) as discount
      FROM sales
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY payment_method`,
      [startDate, endDate],
    );

    // Total de ventas
    const totalSales = await getAsync(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(discount), 0) as discount
      FROM sales
      WHERE timestamp BETWEEN ? AND ?`,
      [startDate, endDate],
    );

    // Gastos del día (movimientos de salida)
    const expenses = await allAsync(
      `SELECT 
        cm.description,
        cm.amount,
        cm.timestamp
      FROM cash_movements cm
      WHERE cm.type = 'expense'
        AND cm.timestamp BETWEEN ? AND ?
      ORDER BY cm.timestamp DESC`,
      [startDate, endDate],
    );

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Ingresos adicionales (movimientos de entrada)
    const additionalIncome = await allAsync(
      `SELECT 
        cm.description,
        cm.amount,
        cm.timestamp
      FROM cash_movements cm
      WHERE cm.type = 'income'
        AND cm.timestamp BETWEEN ? AND ?
      ORDER BY cm.timestamp DESC`,
      [startDate, endDate],
    );

    const totalAdditionalIncome = additionalIncome.reduce(
      (sum, i) => sum + i.amount,
      0,
    );

    // Caja abierta del día (si existe)
    const openCashBox = await getAsync(
      `SELECT 
        id,
        opening_amount,
        opened_at,
        opened_by,
        status
      FROM cash_boxes
      WHERE DATE(opened_at) = ?
      ORDER BY opened_at DESC
      LIMIT 1`,
      [date],
    );

    // Calcular saldo
    const cashSales =
      salesByMethod.find((s) => s.payment_method === "cash")?.total || 0;
    const expectedCash = openCashBox
      ? openCashBox.opening_amount +
        cashSales +
        totalAdditionalIncome -
        totalExpenses
      : cashSales + totalAdditionalIncome - totalExpenses;

    return {
      date,
      cashBox: openCashBox,
      sales: {
        total: totalSales.total,
        count: totalSales.count,
        subtotal: totalSales.subtotal,
        discount: totalSales.discount,
        byMethod: salesByMethod,
      },
      expenses: {
        total: totalExpenses,
        items: expenses,
      },
      additionalIncome: {
        total: totalAdditionalIncome,
        items: additionalIncome,
      },
      summary: {
        openingAmount: openCashBox?.opening_amount || 0,
        salesTotal: totalSales.total,
        cashSales,
        additionalIncome: totalAdditionalIncome,
        expenses: totalExpenses,
        expectedCash,
        netIncome: totalSales.total + totalAdditionalIncome - totalExpenses,
      },
    };
  } catch (error) {
    throw error;
  }
}

// ============================================
// AUDIT REPORTS
// ============================================

async function getUserActivityReport(
  startDate,
  endDate,
  userId = null,
  actionType = null,
) {
  try {
    let sql = `
      SELECT 
        ual.id,
        ual.action,
        ual.details,
        ual.ip_address,
        ual.created_at,
        u.username,
        u.first_name,
        u.last_name,
        u.role,
        tu.username as target_username,
        tu.first_name as target_first_name,
        tu.last_name as target_last_name
      FROM user_audit_log ual
      LEFT JOIN users u ON ual.user_id = u.id
      LEFT JOIN users tu ON ual.target_user_id = tu.id
      WHERE ual.created_at BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (userId) {
      sql += ` AND ual.user_id = ?`;
      params.push(userId);
    }

    if (actionType) {
      sql += ` AND ual.action LIKE ?`;
      params.push(`%${actionType}%`);
    }

    sql += ` ORDER BY ual.created_at DESC`;

    const activities = await allAsync(sql, params);

    // Estadísticas
    const stats = await getAsync(
      `SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN action LIKE '%login%' THEN 1 END) as login_count,
        COUNT(CASE WHEN action LIKE '%create%' THEN 1 END) as create_count,
        COUNT(CASE WHEN action LIKE '%update%' THEN 1 END) as update_count,
        COUNT(CASE WHEN action LIKE '%delete%' THEN 1 END) as delete_count
      FROM user_audit_log
      WHERE created_at BETWEEN ? AND ?${userId ? " AND user_id = ?" : ""}`,
      userId ? [startDate, endDate, userId] : [startDate, endDate],
    );

    // Actividad por usuario
    const byUser = await allAsync(
      `SELECT 
        u.username,
        u.first_name,
        u.last_name,
        u.role,
        COUNT(*) as action_count
      FROM user_audit_log ual
      LEFT JOIN users u ON ual.user_id = u.id
      WHERE ual.created_at BETWEEN ? AND ?${userId ? " AND ual.user_id = ?" : ""}
      GROUP BY ual.user_id, u.username, u.first_name, u.last_name, u.role
      ORDER BY action_count DESC`,
      userId ? [startDate, endDate, userId] : [startDate, endDate],
    );

    return {
      activities,
      stats,
      byUser,
    };
  } catch (error) {
    throw error;
  }
}

async function getInventoryChangesReport(
  startDate,
  endDate,
  userId = null,
  productId = null,
) {
  try {
    // Si userId es un número, obtener el username
    let usernameFilter = null;
    if (userId) {
      // Intentar obtener el username si es un ID numérico
      if (!isNaN(userId)) {
        const user = await getAsync("SELECT username FROM users WHERE id = ?", [
          userId,
        ]);
        usernameFilter = user?.username || null;
      } else {
        // Es un username directamente
        usernameFilter = userId;
      }
    }

    let sql = `
      SELECT 
        sa.id,
        sa.adjustment_type,
        sa.quantity,
        sa.previous_stock,
        sa.new_stock,
        sa.reason,
        sa.notes,
        sa.created_by,
        sa.created_at,
        p.name as product_name,
        p.barcode,
        p.category
      FROM stock_adjustments sa
      LEFT JOIN products_services p ON sa.product_id = p.id
      WHERE sa.created_at BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (usernameFilter) {
      sql += ` AND sa.created_by = ?`;
      params.push(usernameFilter);
    }

    if (productId) {
      sql += ` AND sa.product_id = ?`;
      params.push(productId);
    }

    sql += ` ORDER BY sa.created_at DESC`;

    const changes = await allAsync(sql, params);

    // Estadísticas
    const statsParams = [startDate, endDate];
    let statsWhere = "";

    if (usernameFilter) {
      statsWhere += ` AND created_by = ?`;
      statsParams.push(usernameFilter);
    }

    if (productId) {
      statsWhere += ` AND product_id = ?`;
      statsParams.push(productId);
    }

    const stats = await getAsync(
      `SELECT 
        COUNT(*) as total_adjustments,
        COUNT(DISTINCT product_id) as affected_products,
        SUM(CASE WHEN adjustment_type = 'increase' THEN quantity ELSE 0 END) as total_increases,
        SUM(CASE WHEN adjustment_type = 'decrease' THEN quantity ELSE 0 END) as total_decreases,
        COUNT(CASE WHEN adjustment_type = 'increase' THEN 1 END) as increase_count,
        COUNT(CASE WHEN adjustment_type = 'decrease' THEN 1 END) as decrease_count
      FROM stock_adjustments
      WHERE created_at BETWEEN ? AND ?${statsWhere}`,
      statsParams,
    );

    // Por tipo de ajuste
    const byType = await allAsync(
      `SELECT 
        adjustment_type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM stock_adjustments
      WHERE created_at BETWEEN ? AND ?${statsWhere}
      GROUP BY adjustment_type`,
      statsParams,
    );

    // Por usuario
    const byUser = await allAsync(
      `SELECT 
        sa.created_by,
        u.username,
        COUNT(*) as adjustment_count,
        SUM(quantity) as total_quantity
      FROM stock_adjustments sa
      LEFT JOIN users u ON sa.created_by = u.username
      WHERE sa.created_at BETWEEN ? AND ?${statsWhere}
      GROUP BY sa.created_by, u.username
      ORDER BY adjustment_count DESC`,
      statsParams,
    );

    return {
      changes,
      stats,
      byType,
      byUser,
    };
  } catch (error) {
    throw error;
  }
}

async function getSystemAccessReport(startDate, endDate, userId = null) {
  try {
    let sql = `
      SELECT 
        ual.id,
        ual.action,
        ual.details,
        ual.ip_address,
        ual.created_at,
        u.username,
        u.first_name,
        u.last_name,
        u.role
      FROM user_audit_log ual
      LEFT JOIN users u ON ual.user_id = u.id
      WHERE ual.created_at BETWEEN ? AND ?
        AND (ual.action LIKE '%login%' OR ual.action LIKE '%logout%' OR ual.action LIKE '%access%')
    `;

    const params = [startDate, endDate];

    if (userId) {
      sql += ` AND ual.user_id = ?`;
      params.push(userId);
    }

    sql += ` ORDER BY ual.created_at DESC`;

    const accesses = await allAsync(sql, params);

    // Estadísticas
    const stats = await getAsync(
      `SELECT 
        COUNT(*) as total_accesses,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN action LIKE '%success%' OR action = 'login' THEN 1 END) as successful_logins,
        COUNT(CASE WHEN action LIKE '%fail%' OR action LIKE '%error%' THEN 1 END) as failed_logins
      FROM user_audit_log
      WHERE created_at BETWEEN ? AND ?
        AND (action LIKE '%login%' OR action LIKE '%logout%' OR action LIKE '%access%')${userId ? " AND user_id = ?" : ""}`,
      userId ? [startDate, endDate, userId] : [startDate, endDate],
    );

    // Por usuario
    const byUser = await allAsync(
      `SELECT 
        u.username,
        u.first_name,
        u.last_name,
        u.role,
        COUNT(*) as access_count,
        MAX(ual.created_at) as last_access
      FROM user_audit_log ual
      LEFT JOIN users u ON ual.user_id = u.id
      WHERE ual.created_at BETWEEN ? AND ?
        AND (ual.action LIKE '%login%' OR ual.action LIKE '%logout%' OR ual.action LIKE '%access%')${userId ? " AND ual.user_id = ?" : ""}
      GROUP BY ual.user_id, u.username, u.first_name, u.last_name, u.role
      ORDER BY access_count DESC`,
      userId ? [startDate, endDate, userId] : [startDate, endDate],
    );

    // Por día
    const byDay = await allAsync(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as access_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_audit_log
      WHERE created_at BETWEEN ? AND ?
        AND (action LIKE '%login%' OR action LIKE '%logout%' OR action LIKE '%access%')${userId ? " AND user_id = ?" : ""}
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      userId ? [startDate, endDate, userId] : [startDate, endDate],
    );

    return {
      accesses,
      stats,
      byUser,
      byDay,
    };
  } catch (error) {
    throw error;
  }
}

async function getPriceChangesReport(startDate, endDate, productId = null) {
  try {
    let sql = `
      SELECT 
        ph.id,
        ph.product_id,
        ph.old_price,
        ph.new_price,
        ph.changed_by,
        ph.reason,
        ph.created_at,
        p.name as product_name,
        p.category,
        (ph.new_price - ph.old_price) as price_difference,
        CAST(((ph.new_price - ph.old_price) / ph.old_price * 100) AS REAL) as percentage_change
      FROM price_history ph
      LEFT JOIN products_services p ON ph.product_id = p.id
      WHERE ph.created_at BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (productId) {
      sql += ` AND ph.product_id = ?`;
      params.push(productId);
    }

    sql += ` ORDER BY ph.created_at DESC`;

    const changes = await allAsync(sql, params);

    // Estadísticas
    const stats = {
      total_changes: changes.length,
      price_increases: changes.filter((c) => c.new_price > c.old_price).length,
      price_decreases: changes.filter((c) => c.new_price < c.old_price).length,
      avg_increase:
        changes.filter((c) => c.new_price > c.old_price).length > 0
          ? changes
              .filter((c) => c.new_price > c.old_price)
              .reduce((sum, c) => sum + c.percentage_change, 0) /
            changes.filter((c) => c.new_price > c.old_price).length
          : 0,
      avg_decrease:
        changes.filter((c) => c.new_price < c.old_price).length > 0
          ? Math.abs(
              changes
                .filter((c) => c.new_price < c.old_price)
                .reduce((sum, c) => sum + c.percentage_change, 0) /
                changes.filter((c) => c.new_price < c.old_price).length,
            )
          : 0,
    };

    // Por usuario
    const byUser = await allAsync(
      `SELECT 
        changed_by,
        COUNT(*) as change_count
      FROM price_history ph
      LEFT JOIN users u ON ph.changed_by = u.id
      WHERE ph.created_at BETWEEN ? AND ?${productId ? " AND ph.product_id = ?" : ""}
      GROUP BY ph.changed_by, u.username
      ORDER BY change_count DESC`,
      productId ? [startDate, endDate, productId] : [startDate, endDate],
    );

    return {
      changes,
      stats,
      byUser,
    };
  } catch (error) {
    throw error;
  }
}

async function getSalesAuditReport(
  startDate,
  endDate,
  userId = null,
  action = null,
) {
  try {
    let sql = `
      SELECT 
        sa.id,
        sa.sale_id,
        sa.action,
        sa.details,
        sa.created_at,
        u.username,
        u.first_name,
        u.last_name,
        s.total as sale_total,
        s.timestamp as sale_date,
        COALESCE(c.name, 'Cliente General') as client_name
      FROM sales_audit sa
      LEFT JOIN users u ON sa.user_id = u.id
      LEFT JOIN sales s ON sa.sale_id = s.id
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE sa.created_at BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (userId) {
      sql += ` AND sa.user_id = ?`;
      params.push(userId);
    }

    if (action) {
      sql += ` AND sa.action = ?`;
      params.push(action);
    }

    sql += ` ORDER BY sa.created_at DESC`;

    const audits = await allAsync(sql, params);

    // Estadísticas
    const stats = await getAsync(
      `SELECT 
        COUNT(*) as total_audits,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN action = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN action = 'modified' THEN 1 END) as modified_count,
        COUNT(CASE WHEN action = 'refunded' THEN 1 END) as refunded_count
      FROM sales_audit
      WHERE created_at BETWEEN ? AND ?${userId ? " AND user_id = ?" : ""}`,
      userId ? [startDate, endDate, userId] : [startDate, endDate],
    );

    // Por acción
    const byAction = await allAsync(
      `SELECT 
        action,
        COUNT(*) as count
      FROM sales_audit
      WHERE created_at BETWEEN ? AND ?${userId ? " AND user_id = ?" : ""}
      GROUP BY action
      ORDER BY count DESC`,
      userId ? [startDate, endDate, userId] : [startDate, endDate],
    );

    // Por usuario
    const byUser = await allAsync(
      `SELECT 
        u.username,
        u.first_name,
        u.last_name,
        COUNT(*) as audit_count
      FROM sales_audit sa
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE sa.created_at BETWEEN ? AND ?${userId ? " AND sa.user_id = ?" : ""}
      GROUP BY sa.user_id, u.username, u.first_name, u.last_name, u.role
      ORDER BY audit_count DESC`,
      userId ? [startDate, endDate, userId] : [startDate, endDate],
    );

    return {
      audits,
      stats,
      byAction,
      byUser,
    };
  } catch (error) {
    throw error;
  }
}

// Función temporal para corregir montos negativos en cash_movements
async function fixNegativeCashMovements() {
  try {
    const result = await runAsync(
      `UPDATE cash_movements SET amount = ABS(amount) WHERE amount < 0`,
    );

    return { success: true, changes: result.changes };
  } catch (error) {
    throw error;
  }
}

// ============ WAITER ORDERS ============

async function createWaiterOrder(orderData) {
  try {
    console.log("📥 [WaiterAPI] Datos Recibidos:", JSON.stringify(orderData, null, 2));
    const { table_or_client_name, subtotal, total, items } = orderData;
    
    const subtotalVal = parseFloat(subtotal) || 0;
    const totalVal = parseFloat(total) || 0;

    if (!items || items.length === 0) {
      throw new Error("El pedido no tiene productos.");
    }

    // 1. BUSCAR SI YA EXISTE UN PEDIDO PENDIENTE CON ESE NOMBRE
    const existingOrderSql = `SELECT id, subtotal, total FROM waiter_orders WHERE table_or_client_name = $1 AND status = 'pending' LIMIT 1`;
    const existingOrder = await getAsync(existingOrderSql, [table_or_client_name]);

    let orderId;
    
    if (existingOrder) {
      // --- ESCENARIO A: ACTUALIZAR PEDIDO EXISTENTE ---
      orderId = existingOrder.id;
      console.log(`🔄 [WaiterAPI] Uniendo pedido a ID existente: ${orderId}`);

      const newSubtotal = parseFloat(existingOrder.subtotal) + subtotalVal;
      const newTotal = parseFloat(existingOrder.total) + totalVal;

      await runAsync(
        "UPDATE waiter_orders SET subtotal = $1, total = $2, created_at = CURRENT_TIMESTAMP WHERE id = $3",
        [newSubtotal, newTotal, orderId]
      );
    } else {
      // --- ESCENARIO B: CREAR PEDIDO NUEVO ---
      const orderSql = `
        INSERT INTO waiter_orders (table_or_client_name, subtotal, total, status, created_at)
        VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
        RETURNING id
      `;
      const result = await runAsync(orderSql, [table_or_client_name, subtotalVal, totalVal]);
      orderId = result.lastID;
    }

    if (!orderId) throw new Error("No se pudo obtener el ID del pedido.");

    // 2. INSERTAR O ACTUALIZAR LOS ITEMS DEL PEDIDO
    for (const item of items) {
      // Verificar si el producto ya existe en ESTE pedido
      const checkItemSql = `SELECT id, quantity, subtotal FROM waiter_order_items WHERE order_id = $1 AND product_id = $2`;
      const existingItem = await getAsync(checkItemSql, [orderId, item.product_id || 0]);

      if (existingItem && item.product_id) {
        // Si ya existe el mismo producto, sumamos la cantidad
        const newQty = parseInt(existingItem.quantity) + (parseInt(item.quantity) || 1);
        const newSub = parseFloat(existingItem.subtotal) + (parseFloat(item.subtotal) || 0);
        
        await runAsync(
          "UPDATE waiter_order_items SET quantity = $1, subtotal = $2 WHERE id = $3",
          [newQty, newSub, existingItem.id]
        );
      } else {
        // Si es nuevo, lo insertamos
        const itemSql = `
          INSERT INTO waiter_order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await runAsync(itemSql, [
          orderId,
          item.product_id || null,
          item.product_name,
          parseInt(item.quantity) || 1,
          parseFloat(item.unit_price) || 0,
          parseFloat(item.subtotal) || 0
        ]);
      }
    }

    return orderId;
  } catch (error) {
    console.error("ERROR EN createWaiterOrder:", error);
    throw error;
  }
}

async function getPendingWaiterOrders() {
  try {
    const sql = `
      SELECT *
      FROM waiter_orders
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `;
    const orders = await allAsync(sql);

    // Obtener items para cada orden con su tipo real de producto
    for (let order of orders) {
      const itemsSql = `
        SELECT w.*, p.type as product_type 
        FROM waiter_order_items w
        LEFT JOIN products_services p ON w.product_id = p.id
        WHERE w.order_id = $1
      `;
      const items = await allAsync(itemsSql, [order.id]);
      order.items = items;
    }

    return orders;
  } catch (error) {
    throw error;
  }
}

async function updateWaiterOrderStatus(arg1, arg2) {
  try {
    let orderId, status;
    if (typeof arg1 === 'object' && arg1 !== null) {
      orderId = arg1.orderId;
      status = arg1.status;
    } else {
      orderId = arg1;
      status = arg2;
    }
    
    const sql = "UPDATE waiter_orders SET status = $1 WHERE id = $2";
    await runAsync(sql, [status, orderId]);
    return true;
  } catch (error) {
    console.error("Error updating waiter order status:", error);
    throw error;
  }
}

async function deleteWaiterOrder(orderId) {
  try {
    // cascade delete se manejará automáticamente por la FK constraint
    await runAsync("DELETE FROM waiter_orders WHERE id = $1", [orderId]);
    return true;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getClientById,
  startSession,
  getActiveSessions,
  endSession,
  getProductsServices,
  createProductService,
  updateProductService,
  updateProductCategory,
  deleteProductService,
  getSales,
  getDailyStats,
  selectSystemLogo,
  getExecutiveDashboard,
  getSalesByPeriod,
  getCashBoxReport,
  getCashBoxes,
  getStockReport,
  getTopClientsReport,
  getSalesByProduct,
  getCashFlowReport,
  getInventoryMovements,
  getPurchasesByPeriod,
  getSessionsByPeriod,
  // Fase 3
  getSalesByPaymentMethod,
  getSalesByHour,
  getLowStockProducts,
  getProductsWithoutMovement,
  getPurchasesBySupplier,
  getMostPurchasedProducts,
  getPurchaseOrdersHistory,
  getFrequentClients,
  getInactiveClients,
  // Fase 3 - Adicionales
  getSalesByClient,
  getSalesComparison,
  getIncomeVsExpenses,
  getInventoryValuation,
  getActiveClients,
  getNewClients,
  getBestSellingPackages,
  getAverageSessionDuration,
  getHourlyOccupancy,
  getActiveMemberships,
  getExpiringMemberships,
  getSessionsHistory,
  getDiscountsReport,
  getDailyCashSummary,
  // Audit Reports
  getUserActivityReport,
  getInventoryChangesReport,
  getSystemAccessReport,
  getPriceChangesReport,
  getSalesAuditReport,
  getSetting,
  setSetting,
  getAllSettings,
  createSession,
  startTimerSession,
  updateSessionPaidStatus,
  checkDatabaseConnection,
  openCashBox,
  getActiveCashBox,
  closeCashBox,
  addCashMovement,
  getCashBoxMovements,
  getCashBoxSales,
  createSaleWithItems,
  getSaleWithItems,
  getInventoryProducts,
  updateProductStock,
  updateProductCategory,
  adjustProductStock,
  getStockAdjustments,
  getLowStockProducts,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderWithItems,
  clearAllData,
  getMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
  getClientMemberships,
  assignMembership,
  cancelClientMembership,
  recordMembershipRenewal,
  getClientVisits,
  createClientVisit,
  updateClientVisitCheckout,
  getPackageFeatures,
  createPackageFeature,
  updatePackageFeature,
  deletePackageFeature,
  getPackageIncludedFeatures,
  setPackageFeatures,
  getPackageFeatureCategories,
  createPackageFeatureCategory,
  updatePackageFeatureCategory,
  deletePackageFeatureCategory,
  fixNegativeCashMovements,
  openCashDrawerWithAudit,
  createWaiterOrder,
  getPendingWaiterOrders,
  updateWaiterOrderStatus,
  deleteWaiterOrder,
  setPackageIsStandardEntry,
};

async function openCashDrawerWithAudit(userId, printerName, reason = "Apertura manual") {
  try {
    const printerModule = require("./printer.cjs");
    const success = await printerModule.openCashDrawer(printerName);
    if (success) {
      // Usar 1 como fallback si el userId es nulo/inválido
      const finalUserId = userId || 1; 
      await runAsync(
        "INSERT INTO user_audit_log (user_id, action, details) VALUES ($1, $2, $3)",
        [finalUserId, "MANUAL_DRAWER_OPEN", reason]
      );
    }
    return success;
  } catch (error) {
    throw error;
  }
}

// Importar funciones adicionales
const usersApi = require("./users-api.cjs");
const quotationsApi = require("./quotations-api.cjs");
const reservationsApi = require("./reservations-api.cjs");
const suppliesApi = require("./supplies-api.cjs");
const equipmentApi = require("./equipment-api.cjs");

// Agregar funciones al módulo
Object.assign(module.exports, usersApi);
Object.assign(module.exports, quotationsApi);
Object.assign(module.exports, reservationsApi);
Object.assign(module.exports, suppliesApi);
Object.assign(module.exports, equipmentApi);
