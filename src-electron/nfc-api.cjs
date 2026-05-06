function normalizeUid(uid) {
  if (!uid || typeof uid !== 'string') return '';
  return uid.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
}

// Registrar uso de membresía de descuento
async function registerDiscountMembershipUse(clientMembershipId, discountAmount) {
  // Validar que la membresía esté activa y asociada a una tarjeta
  const membership = await getAsync(
    `SELECT id FROM client_memberships WHERE id = $1 AND status = 'active' AND nfc_card_id IS NOT NULL`,
    [clientMembershipId]
  );
  if (!membership) {
    // No registrar si la membresía no es válida o no está activa
    return;
  }
  await runAsync(
    `INSERT INTO membership_discount_uses (client_membership_id, discount_amount, used_at)
     VALUES ($1, $2, NOW())`,
    [clientMembershipId, discountAmount]
  );
}

const { runAsync, getAsync, allAsync } = require("./database-pg.cjs");

// Obtener detalles de la membresía con su tarjeta NFC
async function getNfcCardByUid(uid) {
  try {
    const cleanUid = normalizeUid(uid);
    console.log('[NFC] Buscando tarjeta con UID normalizado:', cleanUid);
    const query = `
      SELECT
        c.id as card_id,
        c.uid,
        c.client_id,
        cm.id as client_membership_id,
        cm.balance,
        cm.status as membership_status,
        cl.name as client_name,
        m.name as membership_name,
        m.discount_percentage
      FROM nfc_cards c
      JOIN client_memberships cm ON cm.nfc_card_id = c.id
      JOIN clients cl ON c.client_id = cl.id
      JOIN memberships m ON cm.membership_id = m.id
      WHERE c.uid = $1 AND c.is_active = TRUE AND cm.status = 'active'
      LIMIT 1
    `;
    return await getAsync(query, [cleanUid]);
  } catch (error) {
    throw error;
  }
}

// Asignar una tarjeta a una membresía de cliente
async function assignNfcCard(clientMembershipId, uid, clientId) {
  try {
    const cleanUid = normalizeUid(uid);
    // Buscar si existe una tarjeta activa con ese UID
    const existing = await getAsync("SELECT id FROM nfc_cards WHERE uid = $1 AND is_active = TRUE", [cleanUid]);
    if (existing) {
      // Verificar si está asociada a alguna membresía activa
      const activeMembership = await getAsync(
        `SELECT id FROM client_memberships WHERE nfc_card_id = $1 AND status = 'active'`,
        [existing.id]
      );
      if (activeMembership) {
        throw new Error("Esta tarjeta NFC ya está asignada y activa.");
      }
      // Si no está asociada, reutilizarla
      await runAsync(
        "UPDATE nfc_cards SET client_id = $1 WHERE id = $2",
        [clientId, existing.id]
      );
      await runAsync(
        "UPDATE client_memberships SET nfc_card_id = $1 WHERE id = $2",
        [existing.id, clientMembershipId]
      );
      return { success: true, cardId: existing.id };
    }

    // Si no existe, crear una nueva tarjeta
    const result = await runAsync(
      "INSERT INTO nfc_cards (uid, client_id, is_active) VALUES ($1, $2, TRUE) RETURNING id",
      [cleanUid, clientId]
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
      try {
        const row = await getAsync("SELECT value FROM settings WHERE key = $1", ['nfc_entry_price']);
        chargeAmount = parseFloat(row?.value || "100");
      } catch (e) {
        chargeAmount = 100; // Fallback extremo
      }
    }

    if (currentBalance < chargeAmount) {
      throw new Error(`Saldo insuficiente en la membresía de ${cardInfo.client_name}`);
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

    // NUEVO: Crear sesión automática para que aparezca la "card" de tiempo en el Dashboard
    try {
      // Intentar obtener el duration_minutes por defecto de la membresía o usar 60
      let duration = 60;
      // Podríamos buscar si la membresía tiene un paquete asociado con duración
      const membership = await getAsync(`
        SELECT m.name FROM client_memberships cm 
        JOIN memberships m ON cm.membership_id = m.id 
        WHERE cm.id = $1`, [cardInfo.client_membership_id]);
      
      // Si el nombre sugiere tiempo, podríamos ajustarlo, pero por ahora usamos 60min o un ajuste global
      // Podríamos incluso usar el "nfc_entry_price" para buscar un paquete que cueste eso
      
      const startTime = new Date().toISOString(); 
      await runAsync(
        "INSERT INTO active_sessions (client_id, start_time, duration_minutes, status, is_paid, children_count) VALUES ($1, $2, $3, $4, $5, $6)",
        [cardInfo.client_id, startTime, duration, "active", true, 1]
      );
    } catch (sessionErr) {
      console.error("Error creando sesión automática desde NFC:", sessionErr);
    }

    return { 
      success: true, 
      clientName: cardInfo.client_name,
      newBalance,
      chargedAmount: chargeAmount
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
  }
}

// Obtener transacciones de una membresía
async function getNfcTransactions(clientMembershipId) {
  try {
    const txs = await allAsync(
      `SELECT t.id, t.client_membership_id, t.card_id, t.type, t.amount, t.previous_balance, t.new_balance, t.related_sale_id, t.created_by, t.created_at, '' as notes, u.first_name, u.last_name 
       FROM nfc_transactions t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.client_membership_id = $1`,
      [clientMembershipId]
    );

    const discounts = await allAsync(
      `SELECT 
         mdu.id, 
         mdu.client_membership_id, 
         NULL as card_id, 
         'discount' as type, 
         mdu.discount_amount as amount, 
         0 as previous_balance, 
         0 as new_balance, 
         mdu.sale_id as related_sale_id, 
         s.user_id as created_by, 
         mdu.used_at as created_at, 
         COALESCE((
           SELECT string_agg(product_name || ' x' || quantity, ', ')
           FROM sale_items si WHERE si.sale_id = mdu.sale_id
         ), 'Descuento en compra') as notes, 
         u.first_name, 
         u.last_name
       FROM membership_discount_uses mdu
       LEFT JOIN sales s ON mdu.sale_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE mdu.client_membership_id = $1`,
      [clientMembershipId]
    );

    const combined = [...txs, ...discounts];
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return combined;
  } catch (error) {
    throw error;
  }
}

// Verificar si un UID está disponible para asignar (solo lectura, sin crear registros)
async function checkNfcCardAvailable(uid) {
  try {
    const cleanUid = normalizeUid(uid);
    if (!cleanUid) return { available: false, reason: 'UID inválido o vacío.' };
    const existing = await getAsync(
      "SELECT id FROM nfc_cards WHERE uid = $1 AND is_active = TRUE",
      [cleanUid]
    );
    if (!existing) return { available: true };
    const activeMembership = await getAsync(
      "SELECT id FROM client_memberships WHERE nfc_card_id = $1 AND status = 'active'",
      [existing.id]
    );
    if (activeMembership) {
      return { available: false, reason: 'Esta tarjeta NFC ya está asignada a una membresía activa.' };
    }
    return { available: true };
  } catch (error) {
    throw error;
  }
}

// Migración al arranque: normalizar UIDs que tengan dos puntos (formato manual/simulador)
(async () => {
  try {
    const cards = await allAsync("SELECT id, uid FROM nfc_cards WHERE uid LIKE '%:%'");
    for (const card of cards) {
      const normalized = normalizeUid(card.uid);
      if (normalized !== card.uid) {
        await runAsync("UPDATE nfc_cards SET uid = $1 WHERE id = $2", [normalized, card.id]);
        console.log(`[NFC Migration] UID normalizado: ${card.uid} → ${normalized}`);
      }
    }
    if (cards.length > 0) {
      console.log(`[NFC Migration] Completado. ${cards.length} tarjeta(s) normalizadas.`);
    }
  } catch (err) {
    console.error('[NFC Migration] Error al normalizar UIDs:', err);
  }
})();

module.exports = {
  getNfcCardByUid,
  assignNfcCard,
  rechargeNfcCard,
  chargeNfcEntry,
  refundNfcCard,
  getNfcTransactions,
  registerDiscountMembershipUse,
  checkNfcCardAvailable,
};
