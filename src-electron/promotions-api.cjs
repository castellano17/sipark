const { runAsync, getAsync, allAsync } = require("./database-pg.cjs");
const QRCode = require("qrcode");
const { createCanvas } = require("canvas");
const JsBarcode = require("jsbarcode");

const VOUCHER_PREFIX = "SIPARK-VOUCHER:";

// Genera un código alfanumérico único (8 chars)
function generateUniqueCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Genera imagen QR como base64 PNG
async function generateQRBase64(code) {
  try {
    const data = `${VOUCHER_PREFIX}${code}`;
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      width: 200,
      margin: 1,
    });
  } catch (err) {
    throw err;
    return null;
  }
}

// Genera imagen de código de barras Code128 como base64 PNG
function generateBarcodeBase64(code) {
  try {
    const data = `${VOUCHER_PREFIX}${code}`;
    const canvas = createCanvas(400, 100);
    JsBarcode(canvas, data, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: false,
      margin: 5,
    });
    return canvas.toDataURL("image/png");
  } catch (err) {
    throw err;
    return null;
  }
}

// ── CAMPAIGNS ───────────────────────────────────────────────────────────────

async function createCampaign(data) {
  try {
    const {
      name, description, type, benefitValue, benefitPackageId,
      codeCount, maxUsesPerCode, validFrom, validUntil,
      targetAudience, minPurchase, createdBy,
    } = data;

    // Insertar campaña
    const result = await runAsync(
      `INSERT INTO promotion_campaigns
        (name, description, type, benefit_value, benefit_package_id,
         code_count, max_uses_per_code, valid_from, valid_until,
         target_audience, min_purchase, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [name, description, type, benefitValue, benefitPackageId || null,
       codeCount, maxUsesPerCode, validFrom || null, validUntil || null,
       targetAudience || "all", minPurchase || 0, createdBy || null]
    );
    const campaignId = result.rows[0].id;

    // Generar vouchers únicos
    const generated = [];
    let attempts = 0;
    while (generated.length < codeCount && attempts < codeCount * 5) {
      attempts++;
      const code = generateUniqueCode();
      // Verificar unicidad en BD
      const existing = await getAsync(
        "SELECT id FROM promotion_vouchers WHERE code = $1", [code]
      );
      if (existing) continue;

      const [qrData, barcodeData] = await Promise.all([
        generateQRBase64(code),
        generateBarcodeBase64(code),
      ]);

      await runAsync(
        `INSERT INTO promotion_vouchers
          (campaign_id, code, barcode_data, qr_data, max_uses)
         VALUES ($1,$2,$3,$4,$5)`,
        [campaignId, code, barcodeData, qrData, maxUsesPerCode]
      );
      generated.push(code);
    }

    return { success: true, campaignId, codesGenerated: generated.length };
  } catch (err) {
    throw err;
    throw err;
  }
}

async function getCampaigns(status = null) {
  try {
    let sql = `
      SELECT pc.*,
        COUNT(pv.id) as total_vouchers,
        SUM(pv.times_used) as total_redemptions,
        u.username as created_by_name
      FROM promotion_campaigns pc
      LEFT JOIN promotion_vouchers pv ON pv.campaign_id = pc.id
      LEFT JOIN users u ON u.id = pc.created_by
    `;
    const params = [];
    if (status) {
      sql += " WHERE pc.status = $1";
      params.push(status);
    }
    sql += " GROUP BY pc.id, u.username ORDER BY pc.created_at DESC";
    return await allAsync(sql, params);
  } catch (err) {
    throw err;
    throw err;
  }
}

async function getCampaignById(id) {
  try {
    const campaign = await getAsync(
      `SELECT pc.*, u.username as created_by_name
       FROM promotion_campaigns pc
       LEFT JOIN users u ON u.id = pc.created_by
       WHERE pc.id = $1`, [id]
    );
    if (!campaign) return null;

    const vouchers = await allAsync(
      `SELECT pv.*,
        (SELECT COUNT(*) FROM voucher_redemptions vr WHERE vr.voucher_id = pv.id) as redemption_count
       FROM promotion_vouchers pv
       WHERE pv.campaign_id = $1
       ORDER BY pv.created_at ASC`, [id]
    );

    return { ...campaign, vouchers };
  } catch (err) {
    throw err;
    throw err;
  }
}

async function updateCampaignStatus(id, status) {
  try {
    await runAsync(
      "UPDATE promotion_campaigns SET status = $1 WHERE id = $2", [status, id]
    );
    return true;
  } catch (err) {
    throw err;
    throw err;
  }
}

// ── VOUCHERS ─────────────────────────────────────────────────────────────────

async function getVoucherByCode(rawCode) {
  try {
    // Strip el prefijo si lo manda el lector
    const code = rawCode.replace(VOUCHER_PREFIX, "").trim();

    const voucher = await getAsync(
      `SELECT pv.*, pc.name as campaign_name, pc.type, pc.benefit_value,
              pc.benefit_package_id, pc.valid_from, pc.valid_until,
              pc.status as campaign_status, pc.description as campaign_description
       FROM promotion_vouchers pv
       JOIN promotion_campaigns pc ON pc.id = pv.campaign_id
       WHERE pv.code = $1`, [code]
    );

    if (!voucher) return { valid: false, reason: "Voucher no encontrado" };

    const today = new Date().toISOString().split("T")[0];
    if (voucher.campaign_status !== "active")
      return { valid: false, reason: "Campaña inactiva o pausada" };
    if (!voucher.is_active)
      return { valid: false, reason: "Voucher desactivado" };
    if (voucher.times_used >= voucher.max_uses)
      return { valid: false, reason: "Voucher ya agotado" };
    if (voucher.valid_from && today < voucher.valid_from)
      return { valid: false, reason: `Válido desde ${voucher.valid_from}` };
    if (voucher.valid_until && today > voucher.valid_until)
      return { valid: false, reason: "Voucher expirado" };

    return { valid: true, voucher };
  } catch (err) {
    throw err;
    throw err;
  }
}

async function redeemVoucher({ code, saleId, clientId, redeemedBy, benefitApplied, notes }) {
  try {
    const cleanCode = code.replace(VOUCHER_PREFIX, "").trim();

    const voucher = await getAsync(
      "SELECT id, times_used, max_uses FROM promotion_vouchers WHERE code = $1",
      [cleanCode]
    );
    if (!voucher) throw new Error("Voucher no encontrado");
    if (voucher.times_used >= voucher.max_uses) throw new Error("Voucher agotado");

    // Incrementar usos
    await runAsync(
      "UPDATE promotion_vouchers SET times_used = times_used + 1 WHERE id = $1",
      [voucher.id]
    );

    // Si llegó al máximo, desactivar
    if (voucher.times_used + 1 >= voucher.max_uses) {
      await runAsync(
        "UPDATE promotion_vouchers SET is_active = FALSE WHERE id = $1",
        [voucher.id]
      );
    }

    // Registrar redención
    await runAsync(
      `INSERT INTO voucher_redemptions
        (voucher_id, client_id, redeemed_by, sale_id, benefit_applied, notes)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [voucher.id, clientId || null, redeemedBy || null, saleId || null,
       JSON.stringify(benefitApplied || {}), notes || null]
    );

    return { success: true, voucherId: voucher.id };
  } catch (err) {
    throw err;
    throw err;
  }
}

async function getVoucherRedemptions(campaignId) {
  try {
    return await allAsync(
      `SELECT vr.*, pv.code, c.name as client_name,
              u.username as redeemed_by_name, s.total as sale_total
       FROM voucher_redemptions vr
       JOIN promotion_vouchers pv ON pv.id = vr.voucher_id
       LEFT JOIN clients c ON c.id = vr.client_id
       LEFT JOIN users u ON u.id = vr.redeemed_by
       LEFT JOIN sales s ON s.id = vr.sale_id
       WHERE pv.campaign_id = $1
       ORDER BY vr.redeemed_at DESC`, [campaignId]
    );
  } catch (err) {
    throw err;
    throw err;
  }
}

async function deactivateVoucher(voucherId) {
  try {
    await runAsync(
      "UPDATE promotion_vouchers SET is_active = FALSE WHERE id = $1",
      [voucherId]
    );
    return true;
  } catch (err) {
    throw err;
    throw err;
  }
}

// Retorna datos de vouchers para impresión (con QR y barcode)
async function getVouchersForPrint(campaignId, voucherIds = null) {
  try {
    let sql = `
      SELECT pv.id, pv.code, pv.qr_data, pv.barcode_data, pv.max_uses, pv.times_used,
             pc.name as campaign_name, pc.type, pc.benefit_value, pc.valid_until,
             pc.description as campaign_description
      FROM promotion_vouchers pv
      JOIN promotion_campaigns pc ON pc.id = pv.campaign_id
      WHERE pv.campaign_id = $1
    `;
    const params = [campaignId];
    if (voucherIds && voucherIds.length > 0) {
      sql += ` AND pv.id = ANY($2)`;
      params.push(voucherIds);
    }
    sql += " ORDER BY pv.id ASC";
    return await allAsync(sql, params);
  } catch (err) {
    throw err;
    throw err;
  }
}

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaignStatus,
  getVoucherByCode,
  redeemVoucher,
  getVoucherRedemptions,
  deactivateVoucher,
  getVouchersForPrint,
};
