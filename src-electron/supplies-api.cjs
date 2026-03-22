const { runAsync, getAsync, allAsync } = require('./database-pg.cjs');

// ===================== SUPPLY CATEGORIES =====================

async function getSupplyCategories() {
  try {
    const sql = `SELECT * FROM supply_categories ORDER BY name ASC`;
    return await allAsync(sql);
  } catch (error) {
    console.error("Error obteniendo categorías de insumos:", error);
    throw error;
  }
}

async function createSupplyCategory(name, description = '') {
  try {
    const sql = `INSERT INTO supply_categories (name, description) VALUES (?, ?)`;
    const result = await runAsync(sql, [name, description]);
    return result;
  } catch (error) {
    console.error("Error creando categoría de insumos:", error);
    throw error;
  }
}

async function updateSupplyCategory(id, name, description = '') {
  try {
    const sql = `UPDATE supply_categories SET name = ?, description = ? WHERE id = ?`;
    const result = await runAsync(sql, [name, description, id]);
    return result;
  } catch (error) {
    console.error("Error actualizando categoría de insumos:", error);
    throw error;
  }
}

async function deleteSupplyCategory(id) {
  try {
    const sql = `DELETE FROM supply_categories WHERE id = ?`;
    const result = await runAsync(sql, [id]);
    return result;
  } catch (error) {
    console.error("Error eliminando categoría de insumos:", error);
    throw error;
  }
}

// ===================== SUPPLIES =====================

async function getSupplies() {
  try {
    const sql = `
      SELECT s.*, c.name as category_name
      FROM supplies s
      LEFT JOIN supply_categories c ON s.category_id = c.id
      ORDER BY s.name ASC
    `;
    return await allAsync(sql);
  } catch (error) {
    console.error("Error obteniendo insumos:", error);
    throw error;
  }
}

async function createSupply(name, category_id, stock, unit_of_measure, min_stock, barcode) {
  try {
    const finalBarcode = barcode || `INS-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    const sql = `
      INSERT INTO supplies (name, category_id, stock, unit_of_measure, min_stock, barcode)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await runAsync(sql, [
      name, 
      category_id || null, 
      stock || 0, 
      unit_of_measure, 
      min_stock || 0,
      finalBarcode
    ]);
    return result;
  } catch (error) {
    console.error("Error creando insumo:", error);
    throw error;
  }
}

async function updateSupply(id, name, category_id, stock, unit_of_measure, min_stock, barcode) {
  try {
    const finalBarcode = barcode || `INS-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    const sql = `
      UPDATE supplies 
      SET name = ?, category_id = ?, stock = ?, unit_of_measure = ?, min_stock = ?, barcode = ?
      WHERE id = ?
    `;
    const result = await runAsync(sql, [
      name, 
      category_id || null, 
      stock || 0, 
      unit_of_measure, 
      min_stock || 0, 
      finalBarcode,
      id
    ]);
    return result;
  } catch (error) {
    console.error("Error actualizando insumo:", error);
    throw error;
  }
}

async function deleteSupply(id) {
  try {
    const sql = `DELETE FROM supplies WHERE id = ?`;
    const result = await runAsync(sql, [id]);
    return result;
  } catch (error) {
    console.error("Error eliminando insumo:", error);
    throw error;
  }
}

// ===================== SUPPLY ADJUSTMENTS =====================

async function adjustSupplyStock(supply_id, adjustment_type, quantity, reason, notes, created_by) {
  try {
    const supply = await getAsync(`SELECT stock FROM supplies WHERE id = ?`, [supply_id]);
    if (!supply) throw new Error("Insumo no encontrado");

    const previous_stock = parseFloat(supply.stock || 0);
    const qty = parseFloat(quantity);
    let new_stock = previous_stock;

    if (adjustment_type === 'in') {
      new_stock += qty;
    } else { // 'out', 'loss', etc.
      new_stock -= qty;
    }

    const sqlUpdate = `UPDATE supplies SET stock = ? WHERE id = ?`;
    await runAsync(sqlUpdate, [new_stock, supply_id]);

    const sqlAudit = `
      INSERT INTO supply_adjustments 
      (supply_id, adjustment_type, quantity, previous_stock, new_stock, reason, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await runAsync(sqlAudit, [
      supply_id, adjustment_type, qty, previous_stock, new_stock, reason, notes || '', created_by || null
    ]);

    return result;
  } catch (error) {
    console.error("Error ajustando stock de insumo:", error);
    throw error;
  }
}

async function getSupplyAdjustments(supply_id) {
  try {
    const sql = `
      SELECT sa.*, u.first_name || ' ' || u.last_name as user_name
      FROM supply_adjustments sa
      LEFT JOIN users u ON sa.created_by = u.id
      WHERE sa.supply_id = ?
      ORDER BY sa.created_at DESC
    `;
    return await allAsync(sql, [supply_id]);
  } catch (error) {
    console.error("Error obteniendo historial de insumo:", error);
    throw error;
  }
}

module.exports = {
  getSupplyCategories,
  createSupplyCategory,
  updateSupplyCategory,
  deleteSupplyCategory,
  getSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  adjustSupplyStock,
  getSupplyAdjustments
};
