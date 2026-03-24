const { runAsync, getAsync, allAsync } = require("./database-pg.cjs");

// Obtener detalles de la membresía con su tarjeta NFC
async function getNfcCardByUid(uid) {
  try {
    const query = `
      SELECT 
        c.id as card_id, 
        c.uid, 
        c.client_id, 
        cm.id as client_membership_id, 
        cm.balance,
        cm.status as membership_status,
        cl.name as client_name,
        m.name as membership_name
      FROM nfc_cards c
      JOIN client_memberships cm ON cm.nfc_card_id = c.id
      JOIN clients cl ON c.client_id = cl.id
      JOIN memberships m ON cm.membership_id = m.id
      WHERE c.uid = $1 AND c.is_active = TRUE AND cm.status = 'active'
    `;
    return await getAsync(query, [uid]);
  } catch (error) {
    throw error;
    throw error;
  }
}

// Asignar una tarjeta a una membresía de cliente
async function assignNfcCard(clientMembershipId, uid, clientId) {
  try {
    // Verificar si el UID ya está en uso y activo
    const existing = await getAsync("SELECT id FROM nfc_cards WHERE uid = $1 AND is_active = TRUE", [uid]);
    if (existing) {
      throw new Error("Esta tarjeta NFC ya está asignada y activa.");
    }

    // Insertar la nueva tarjeta
    const result = await runAsync(
      "INSERT INTO nfc_cards (uid, client_id, is_active) VALUES ($1, $2, TRUE) RETURNING id",
      [uid, clientId]
    );
    const newCardId = result.lastID;

    // Actualizar la membresía con la nueva tarjeta
    await runAsync(
      "UPDATE client_memberships SET nfc_card_id = $1 WHERE id = $2",
      [newCardId, clientMembershipId]
    );

    return { success: true, cardId: newCardId };
  } catch (error) {
    throw error;
    throw error;
  }
}

// Recargar saldo en la membresía (vinculado a una venta en el POS)
async function rechargeNfcCard(clientMembershipId, amount, saleId, userId) {
  try {
    // Obtener balance actual
    const membership = await getAsync(
      "SELECT balance, nfc_card_id FROM client_memberships WHERE id = $1", 
      [clientMembershipId]
    );
    
    if (!membership) {
      throw new Error("Membresía no encontrada.");
    }

    const previousBalance = parseFloat(membership.balance || 0);
    const newBalance = previousBalance + parseFloat(amount);

    // Actualizar balance
    await runAsync(
      "UPDATE client_memberships SET balance = $1 WHERE id = $2",
      [newBalance, clientMembershipId]
    );

    // Guardar transacción
    await runAsync(
      `INSERT INTO nfc_transactions 
        (client_membership_id, card_id, type, amount, previous_balance, new_balance, related_sale_id, created_by) 
       VALUES ($1, $2, 'recharge', $3, $4, $5, $6, $7)`,
      [
        clientMembershipId, 
        membership.nfc_card_id, 
        parseFloat(amount), 
        previousBalance, 
        newBalance, 
        saleId, 
        userId
      ]
    );

    return { success: true, newBalance };
  } catch (error) {
    throw error;
    throw error;
  }
}

// Cobrar entrada/uso de la tarjeta NFC
async function chargeNfcEntry(uid, amount, userId) {
  try {
    const cardInfo = await getNfcCardByUid(uid);
    if (!cardInfo) {
      throw new Error("Tarjeta no encontrada o membresía inactiva.");
    }

    const currentBalance = parseFloat(cardInfo.balance || 0);
    let chargeAmount = parseFloat(amount);

    // Si no se pasó monto (cobro rápido NFC), buscamos el precio por defecto en ajustes directamente
    if (isNaN(chargeAmount) || amount === null) {
      const entryPriceRow = await getAsync("SELECT value FROM settings WHERE key = $1", ['nfc_entry_price']);
      chargeAmount = parseFloat(entryPriceRow?.value || "100");
    }

    if (currentBalance < chargeAmount) {
      throw new Error("Saldo insuficiente en la membresía.");
    }

    const newBalance = currentBalance - chargeAmount;

    // Descontar saldo
    await runAsync(
      "UPDATE client_memberships SET balance = $1 WHERE id = $2",
      [newBalance, cardInfo.client_membership_id]
    );

    // Actualizar last_used_at en la tarjeta para auditoría
    await runAsync(
      "UPDATE nfc_cards SET last_used_at = NOW() WHERE id = $1",
      [cardInfo.card_id]
    );

    // Registrar transacción de cobro
    await runAsync(
      `INSERT INTO nfc_transactions 
        (client_membership_id, card_id, type, amount, previous_balance, new_balance, created_by) 
       VALUES ($1, $2, 'charge', $3, $4, $5, $6)`,
      [
        cardInfo.client_membership_id, 
        cardInfo.card_id, 
        chargeAmount, 
        currentBalance, 
        newBalance, 
        userId
      ]
    );

    return { 
      success: true, 
      clientName: cardInfo.client_name,
      newBalance 
    };
  } catch (error) {
    throw error;
  }
}

// Reembolso de saldo
async function refundNfcCard(clientMembershipId, amount, reason, userId) {
  try {
    const membership = await getAsync(
      "SELECT balance, nfc_card_id FROM client_memberships WHERE id = $1", 
      [clientMembershipId]
    );

    if (!membership) {
      throw new Error("Membresía no encontrada.");
    }

    const previousBalance = parseFloat(membership.balance || 0);
    const newBalance = previousBalance + parseFloat(amount);

    // Actualizar balance
    await runAsync(
      "UPDATE client_memberships SET balance = $1 WHERE id = $2",
      [newBalance, clientMembershipId]
    );

    // Registrar reembolso como un ajuste positivo o reembolso
    await runAsync(
      `INSERT INTO nfc_transactions 
        (client_membership_id, card_id, type, amount, previous_balance, new_balance, created_by) 
       VALUES ($1, $2, 'refund', $3, $4, $5, $6)`,
      [
        clientMembershipId, 
        membership.nfc_card_id, 
        parseFloat(amount), 
        previousBalance, 
        newBalance, 
        userId
      ]
    );

    return { success: true, newBalance };
  } catch (error) {
    throw error;
    throw error;
  }
}

// Obtener transacciones de una membresía
async function getNfcTransactions(clientMembershipId) {
  try {
    return await allAsync(
      `SELECT t.*, u.first_name, u.last_name 
       FROM nfc_transactions t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.client_membership_id = $1 
       ORDER BY t.created_at DESC`,
      [clientMembershipId]
    );
  } catch (error) {
    throw error;
    throw error;
  }
}

module.exports = {
  getNfcCardByUid,
  assignNfcCard,
  rechargeNfcCard,
  chargeNfcEntry,
  refundNfcCard,
  getNfcTransactions
};
