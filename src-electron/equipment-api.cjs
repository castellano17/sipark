const { runAsync, getAsync, allAsync } = require('./database-pg.cjs');

// ===================== EQUIPMENT CATEGORIES =====================

async function getEquipmentCategories() {
  try {
    const sql = `SELECT * FROM equipment_categories ORDER BY name ASC`;
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createEquipmentCategory(name, description = '') {
  try {
    const sql = `INSERT INTO equipment_categories (name, description) VALUES (?, ?)`;
    const result = await runAsync(sql, [name, description]);
    return result;
  } catch (error) {
    throw error;
  }
}

async function updateEquipmentCategory(id, name, description = '') {
  try {
    const sql = `UPDATE equipment_categories SET name = ?, description = ? WHERE id = ?`;
    const result = await runAsync(sql, [name, description, id]);
    return result;
  } catch (error) {
    throw error;
  }
}

async function deleteEquipmentCategory(id) {
  try {
    const sql = `DELETE FROM equipment_categories WHERE id = ?`;
    const result = await runAsync(sql, [id]);
    return result;
  } catch (error) {
    throw error;
  }
}

// ===================== EQUIPMENT =====================

async function getEquipment() {
  try {
    const sql = `
      SELECT e.*, c.name as category_name
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      ORDER BY e.name ASC
    `;
    return await allAsync(sql);
  } catch (error) {
    throw error;
  }
}

async function createEquipment(name, category_id, quantity, status, location, barcode) {
  try {
    const finalBarcode = barcode || `EQP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    const sql = `
      INSERT INTO equipment (name, category_id, quantity, status, location, barcode)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await runAsync(sql, [
      name, 
      category_id || null, 
      quantity || 0, 
      status || 'active', 
      location || '',
      finalBarcode
    ]);
    return result;
  } catch (error) {
    throw error;
  }
}

async function updateEquipment(id, name, category_id, quantity, status, location, barcode) {
  try {
    const finalBarcode = barcode || `EQP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    const sql = `
      UPDATE equipment 
      SET name = ?, category_id = ?, quantity = ?, status = ?, location = ?, barcode = ?
      WHERE id = ?
    `;
    const result = await runAsync(sql, [
      name, 
      category_id || null, 
      quantity || 0, 
      status || 'active', 
      location || '', 
      finalBarcode,
      id
    ]);
    return result;
  } catch (error) {
    throw error;
  }
}

async function deleteEquipment(id) {
  try {
    const sql = `DELETE FROM equipment WHERE id = ?`;
    const result = await runAsync(sql, [id]);
    return result;
  } catch (error) {
    throw error;
  }
}

// ===================== EQUIPMENT ADJUSTMENTS =====================

async function adjustEquipmentStock(equipment_id, adjustment_type, quantity, reason, notes, created_by) {
  try {
    const eq = await getAsync(`SELECT quantity FROM equipment WHERE id = ?`, [equipment_id]);
    if (!eq) throw new Error("Equipo no encontrado");

    const previous_quantity = parseInt(eq.quantity || 0);
    const qty = parseInt(quantity);
    let new_quantity = previous_quantity;

    if (adjustment_type === 'in') {
      new_quantity += qty;
    } else { // 'out', 'loss', 'damaged'
      new_quantity -= qty;
    }

    const sqlUpdate = `UPDATE equipment SET quantity = ? WHERE id = ?`;
    await runAsync(sqlUpdate, [new_quantity, equipment_id]);

    const sqlAudit = `
      INSERT INTO equipment_adjustments 
      (equipment_id, adjustment_type, quantity, previous_quantity, new_quantity, reason, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await runAsync(sqlAudit, [
      equipment_id, adjustment_type, qty, previous_quantity, new_quantity, reason, notes || '', created_by || null
    ]);

    return result;
  } catch (error) {
    throw error;
  }
}

async function getEquipmentAdjustments(equipment_id) {
  try {
    const sql = `
      SELECT ea.*, u.first_name || ' ' || u.last_name as user_name
      FROM equipment_adjustments ea
      LEFT JOIN users u ON ea.created_by = u.id
      WHERE ea.equipment_id = ?
      ORDER BY ea.created_at DESC
    `;
    return await allAsync(sql, [equipment_id]);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getEquipmentCategories,
  createEquipmentCategory,
  updateEquipmentCategory,
  deleteEquipmentCategory,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  adjustEquipmentStock,
  getEquipmentAdjustments
};
