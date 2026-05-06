const { runAsync, getAsync, allAsync } = require("./database-pg.cjs");

// Crear reservación
async function createReservation(data) {
  try {
    if (!data.client_name || !data.client_name.trim()) return { success: false, error: "El campo 'Nombre' es obligatorio" };
    if (!data.event_date) return { success: false, error: "El campo 'Fecha del Evento' es obligatorio" };
    if (!data.event_time) return { success: false, error: "El campo 'Hora del Evento' es obligatorio" };
    if (!data.package_id) return { success: false, error: "El campo 'Paquete' es obligatorio" };

    const result = await runAsync(
      `INSERT INTO reservations (
        client_id, client_name, client_phone, client_email, client_id_card,
        event_date, event_time, package_id, package_name,
        num_children, total_amount, discount, deposit_amount, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.client_id || null,
        data.client_name,
        data.client_phone,
        data.client_email || null,
        data.client_id_card || null,
        data.event_date,
        data.event_time,
        data.package_id,
        data.package_name,
        data.num_children || 0,
        data.total_amount,
        data.discount || 0,
        0, // El adelanto se registrará a través del POS para evitar duplicaciones
        data.status || "pending",
        data.notes || null,
        data.created_by || null,
      ],
    );

    return { success: true, id: result.lastID };
  } catch (error) {
    console.error("ERROR DB RESERVACIÓN:", error);
    return { success: false, error: error.message };
  }
}

// Obtener todas las reservaciones
async function getAllReservations() {
  try {
    const reservations = await allAsync(
      `SELECT r.*, c.name as client_full_name, p.name as package_full_name
       FROM reservations r
       LEFT JOIN clients c ON r.client_id = c.id
       LEFT JOIN products_services p ON r.package_id = p.id
       ORDER BY r.event_date DESC, r.event_time DESC`,
    );
    return { success: true, data: reservations };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Obtener reservaciones por rango de fechas
async function getReservationsByDateRange(startDate, endDate) {
  try {
    const reservations = await allAsync(
      `SELECT r.*, c.name as client_full_name, p.name as package_full_name
       FROM reservations r
       LEFT JOIN clients c ON r.client_id = c.id
       LEFT JOIN products_services p ON r.package_id = p.id
       WHERE r.event_date BETWEEN ? AND ?
       ORDER BY r.event_date, r.event_time`,
      [startDate, endDate],
    );
    return { success: true, data: reservations };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Obtener reservación por ID
async function getReservationById(id) {
  try {
    const reservation = await getAsync(
      `SELECT r.*, c.name as client_full_name, p.name as package_full_name
       FROM reservations r
       LEFT JOIN clients c ON r.client_id = c.id
       LEFT JOIN products_services p ON r.package_id = p.id
       WHERE r.id = ?`,
      [id],
    );
    return { success: true, data: reservation };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Actualizar estado de reservación
async function updateReservationStatus(id, status) {
  try {
    await runAsync(`UPDATE reservations SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Cancelar reservación
async function cancelReservation(id) {
  try {
    await runAsync(
      `UPDATE reservations SET status = 'cancelled' WHERE id = ?`,
      [id],
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Registrar pago de reservación
async function registerReservationPayment(reservationId, paymentData) {
  try {
    const { amount, paymentMethod, cashBoxId, userId, saleId: existingSaleId } = paymentData;

    // Obtener la reservación
    const reservation = await getAsync(
      `SELECT * FROM reservations WHERE id = ?`,
      [reservationId],
    );

    if (!reservation) {
      return { success: false, error: "Reservación no encontrada" };
    }

    // Validar que el monto sea válido
    if (amount <= 0) {
      return { success: false, error: "El monto debe ser mayor a 0" };
    }

    // Validar que no exceda el saldo pendiente (Asegurar números)
    const total = Number(reservation.total_amount || 0);
    const deposit = Number(reservation.deposit_amount || 0);
    const amountNum = Number(amount);
    
    const remaining = total - deposit;
    
    // Añadimos una pequeña tolerancia de 0.01 para errores de decimales
    if (amountNum > (remaining + 0.01)) {
      return {
        success: false,
        error: `El monto ($${amountNum}) excede el saldo pendiente ($${remaining.toFixed(2)})`,
      };
    }

    let saleId = existingSaleId;

    // Solo crear venta si NO viene del POS (POS ya la crea por su cuenta)
    if (!existingSaleId) {
      const clientId = reservation.client_id > 0 ? reservation.client_id : null;

      const saleResult = await runAsync(
        `INSERT INTO sales (
          client_id, client_name, total, subtotal, discount,
          payment_method, cash_box_id, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          clientId,
          reservation.client_name,
          amount,
          amount,
          0,
          paymentMethod,
          cashBoxId,
        ],
      );

      saleId = saleResult.lastID;

      await runAsync(
        `INSERT INTO sale_items (
          sale_id, product_id, product_name, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          reservation.package_id,
          `Reservación: ${reservation.package_name}`,
          1,
          amount,
          amount,
        ],
      );
    }

    // Actualizar la reservación - Asegurar que sean números para evitar errores de concatenación
    const currentDeposit = Number(reservation.deposit_amount || 0);
    const totalAmount = Number(reservation.total_amount || 0);
    const amountPaid = Number(amount);
    
    const newDepositAmount = currentDeposit + amountPaid;
    const isPaid = newDepositAmount >= (totalAmount - 0.01);
    const paymentStatus = isPaid
      ? "paid"
      : newDepositAmount > 0
        ? "partial"
        : "unpaid";

    await runAsync(
      `UPDATE reservations SET
        deposit_amount = ?,
        payment_status = ?,
        status = ?,
        sale_id = COALESCE(sale_id, ?)
      WHERE id = ?`,
      [
        newDepositAmount,
        paymentStatus,
        isPaid ? "confirmed" : reservation.status,
        saleId,
        reservationId,
      ],
    );

    return { success: true, saleId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Completar evento de reservación
async function completeReservation(reservationId, paymentData) {
  try {
    const { remainingAmount, paymentMethod, cashBoxId, userId } = paymentData;

    // Obtener la reservación
    const reservation = await getAsync(
      `SELECT * FROM reservations WHERE id = ?`,
      [reservationId],
    );

    if (!reservation) {
      return { success: false, error: "Reservación no encontrada" };
    }

    let finalSaleId = null;

    // Si hay saldo pendiente, crear la venta
    if (remainingAmount > 0) {
      const clientId = reservation.client_id > 0 ? reservation.client_id : null;

      const saleResult = await runAsync(
        `INSERT INTO sales (
          client_id, client_name, total, subtotal, discount,
          payment_method, cash_box_id, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          clientId,
          reservation.client_name,
          remainingAmount,
          remainingAmount,
          0,
          paymentMethod,
          cashBoxId,
        ],
      );

      finalSaleId = saleResult.lastID;

      // Crear el item de venta
      await runAsync(
        `INSERT INTO sale_items (
          sale_id, product_id, product_name, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          finalSaleId,
          reservation.package_id,
          `Saldo Reservación: ${reservation.package_name}`,
          1,
          remainingAmount,
          remainingAmount,
        ],
      );
    }

    // Actualizar la reservación a completada
    await runAsync(
      `UPDATE reservations SET
        deposit_amount = total_amount,
        payment_status = 'paid',
        status = 'completed',
        final_sale_id = ?,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [finalSaleId, reservationId],
    );

    return { success: true, finalSaleId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createReservation,
  getAllReservations,
  getReservationsByDateRange,
  getReservationById,
  updateReservationStatus,
  cancelReservation,
  registerReservationPayment,
  completeReservation,
};
