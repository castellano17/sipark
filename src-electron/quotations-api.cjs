const { runAsync, getAsync, allAsync } = require("./database-pg.cjs");

// Generar número de cotización
function generateQuotationNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `COT-${year}${month}${day}-${random}`;
}

// Crear cotización
async function createQuotation(data) {
  try {
    const {
      client_name,
      client_phone,
      client_email,
      client_address,
      items,
      discount,
      tax,
      valid_until,
      notes,
      created_by,
    } = data;

    if (!client_name || !client_name.trim()) return { success: false, error: "El campo 'Nombre' es obligatorio" };
    if (!valid_until) return { success: false, error: "El campo 'Válida Hasta' es obligatorio" };
    if (!items || items.length === 0 || items.some((item) => !item.description || item.quantity <= 0)) {
      return { success: false, error: "Debe agregar al menos un item válido" };
    }

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = discount || 0;
    const taxAmount = tax || 0;
    const total = subtotal - discountAmount + taxAmount;

    // Generar número de cotización único
    let quotationNumber;
    let attempts = 0;
    while (attempts < 10) {
      quotationNumber = generateQuotationNumber();
      const existing = await getAsync(
        "SELECT id FROM quotations WHERE quotation_number = ?",
        [quotationNumber],
      );
      if (!existing) break;
      attempts++;
    }

    // Crear cotización
    const result = await runAsync(
      `INSERT INTO quotations (
        quotation_number, client_name, client_phone, client_email,
        client_address, subtotal, discount, tax, total,
        valid_until, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quotationNumber,
        client_name,
        client_phone || null,
        client_email || null,
        client_address || null,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        valid_until || null,
        notes || null,
        created_by || null,
      ],
    );

    const quotationId = result.lastID;

    // Insertar items
    for (const item of items) {
      await runAsync(
        `INSERT INTO quotation_items (
          quotation_id, product_id, description, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          quotationId,
          item.product_id || null,
          item.description,
          item.quantity,
          item.unit_price,
          item.subtotal,
        ],
      );
    }

    return { success: true, id: quotationId, quotationNumber };
  } catch (error) {
    console.error("Error creando cotización:", error);
    return { success: false, error: error.message };
  }
}

// Obtener todas las cotizaciones
async function getAllQuotations() {
  try {
    const quotations = await allAsync(
      `SELECT * FROM quotations ORDER BY created_at DESC`,
    );
    return { success: true, data: quotations };
  } catch (error) {
    console.error("Error obteniendo cotizaciones:", error);
    return { success: false, error: error.message };
  }
}

// Obtener cotización por ID con items
async function getQuotationById(id) {
  try {
    const quotation = await getAsync(`SELECT * FROM quotations WHERE id = ?`, [
      id,
    ]);

    if (!quotation) {
      return { success: false, error: "Cotización no encontrada" };
    }

    const items = await allAsync(
      `SELECT * FROM quotation_items WHERE quotation_id = ?`,
      [id],
    );

    return { success: true, data: { ...quotation, items } };
  } catch (error) {
    console.error("Error obteniendo cotización:", error);
    return { success: false, error: error.message };
  }
}

// Actualizar estado de cotización
async function updateQuotationStatus(id, status) {
  try {
    await runAsync(`UPDATE quotations SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando estado:", error);
    return { success: false, error: error.message };
  }
}

// Eliminar cotización
async function deleteQuotation(id) {
  try {
    await runAsync(`DELETE FROM quotations WHERE id = ?`, [id]);
    return { success: true };
  } catch (error) {
    console.error("Error eliminando cotización:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotationStatus,
  deleteQuotation,
};
