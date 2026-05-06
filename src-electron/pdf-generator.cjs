const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { app, shell } = require("electron");
const api = require("./api.cjs");
const { getAsync, runAsync, allAsync } = require("./database-pg.cjs");

/**
 * Obtiene la configuración de la empresa desde settings
 */
async function getCompanySettings() {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout obteniendo settings")), 5000)
  );

  const fetchPromise = (async () => {
    try {
      const { allAsync } = require("./database-pg.cjs");
      const rows = await allAsync(
        `SELECT key, value FROM settings WHERE key IN ('invoice_config','company_name','company_address','company_phone','company_ruc','payment_methods')`,
      );
      const map = {};
      rows.forEach((r) => { map[r.key] = r.value; });

      // Primary: use invoice_config blob (saved by InvoiceConfig UI)
      if (map["invoice_config"]) {
        try {
          const cfg = JSON.parse(map["invoice_config"]);
          return {
            businessName: cfg.businessName || map["company_name"] || "SIPARK",
            businessAddress: cfg.businessAddress || map["company_address"] || "",
            businessPhone: cfg.businessPhone || map["company_phone"] || "",
            businessRuc: cfg.taxId || map["company_ruc"] || "",
            businessEmail: cfg.businessEmail || "",
            businessWebsite: cfg.businessWebsite || "",
            headerMessage: cfg.headerMessage || "",
            footerMessage: cfg.footerMessage || "",
            paymentMethods: map["payment_methods"] ? JSON.parse(map["payment_methods"]) : null,
          };
        } catch (e) {
          // fall through to individual keys
        }
      }

      // Fallback: individual keys
      return {
        businessName: map["company_name"] || "SIPARK",
        businessAddress: map["company_address"] || "",
        businessPhone: map["company_phone"] || "",
        businessRuc: map["company_ruc"] || "",
        businessEmail: "",
        businessWebsite: "",
        headerMessage: "",
        footerMessage: "",
        paymentMethods: map["payment_methods"] ? JSON.parse(map["payment_methods"]) : null,
      };
    } catch (error) {
      return {
        businessName: "SIPARK",
        businessAddress: "",
        businessPhone: "",
        businessRuc: "",
        businessEmail: "",
        businessWebsite: "",
        headerMessage: "",
        footerMessage: "",
        paymentMethods: null,
      };
    }
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

const fileHandler = require("./file-handler.cjs");

/**
 * Dibuja el encabezado estandarizado
 */
function drawPDFHeader(doc, companySettings, options = {}) {
  const { title = "DOCUMENTO", subtitle = null } = options;
  const MARGIN = 50;
  let currentY = MARGIN;

  // Intentar cargar logo
  let logoPath = null;
  try {
    const logosDir = fileHandler.getLogosPath();
    const extensions = ["png", "jpg", "jpeg"];
    for (const ext of extensions) {
      const p = path.join(logosDir, `invoice-logo.${ext}`);
      if (fs.existsSync(p)) {
        logoPath = p;
        break;
      }
    }
  } catch (error) {
  }

  // Draw Header
  const textLeftX = logoPath ? 140 : MARGIN;
  if (logoPath) {
     doc.image(logoPath, MARGIN, MARGIN, { width: 80, height: 80, fit: [80, 80] });
  }

  // Draw company info
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#333333");
  doc.text(companySettings.businessName, textLeftX, currentY);
  doc.fontSize(10).font("Helvetica").fillColor("#666666");
  currentY += 15;
  if (companySettings.businessAddress) {
    doc.text(companySettings.businessAddress, textLeftX, currentY);
    currentY += 15;
  }
  if (companySettings.businessPhone) {
    doc.text(companySettings.businessPhone, textLeftX, currentY);
    currentY += 15;
  }
  if (companySettings.businessRuc) {
    doc.text(`RUC: ${companySettings.businessRuc}`, textLeftX, currentY);
    currentY += 15;
  }

  // Document Title
  currentY = logoPath ? Math.max(currentY, MARGIN + 100) : currentY + 30;

  doc.fontSize(options.titleSize || 24).font("Helvetica-Bold").fillColor(options.titleColor || "black");
  doc.text(title, MARGIN, currentY, { align: "center" });
  currentY = doc.y;

  if (subtitle) {
    doc.fontSize(12).font("Helvetica").fillColor("#666666");
    doc.text(subtitle, MARGIN, currentY, { align: "center" });
    currentY = doc.y;
  }

  doc.moveDown(1);
  doc.moveTo(MARGIN, doc.y).lineTo(doc.page.width - MARGIN, doc.y).strokeColor(options.titleColor || "#cccccc").stroke();
  doc.moveDown(1.5);

  return doc.y;
}

/**
 * Dibuja el pie de página estandarizado
 */
/**
 * Dibuja el pie de página estandarizado en la página actual
 */
function drawPDFFooter(doc, options = {}) {
  const { printedBy = "Sistema" } = options;
  const MARGIN = 50;
  const pageWidth = doc.page.width;
  const textWidth = pageWidth - MARGIN * 2;
  const footerLineY = doc.page.height - 45;
  const footerTextY = doc.page.height - 35;

  // Guardar estado actual
  const originalY = doc.y;

  // IMPORTANTE: Desactivar temporalmente el auto-salto de página para el footer
  const oldBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  // Línea separadora
  doc.moveTo(MARGIN, footerLineY)
     .lineTo(pageWidth - MARGIN, footerLineY)
     .strokeColor("#cccccc")
     .lineWidth(0.5)
     .stroke();

  doc.fontSize(8).font("Helvetica").fillColor("#888888");

  // Timestamp a la izquierda
  const timestamp = `Generado el ${new Date().toLocaleString("es-ES")}`;
  doc.text(timestamp, MARGIN, footerTextY, {
    width: textWidth / 2,
    align: "left",
    lineBreak: false,
  });

  // Usuario a la derecha
  const userText = `Impreso por: ${printedBy}`;
  doc.text(userText, MARGIN + textWidth / 2, footerTextY, {
    width: textWidth / 2,
    align: "right",
    lineBreak: false,
  });

  // Restaurar estado
  doc.page.margins.bottom = oldBottomMargin;
  doc.y = originalY;
}

/**
 * Finaliza el PDF dibujando los footers en todas las páginas bufferizadas
 */
/**
 * Finaliza el PDF dibujando los footers en todas las páginas bufferizadas,
 * cerrando el documento y opcionalmente abriendo el archivo.
 * @param {PDFDocument} doc - La instancia del documento PDF.
 * @param {object} footerOptions - Opciones para el pie de página.
 * @param {boolean} [openFile=false] - Si se debe abrir el archivo después de generarlo.
 * @param {string} [filepath=null] - Ruta al archivo generado.
 */
function finalizePDF(doc, footerOptions = {}) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawPDFFooter(doc, { 
      ...footerOptions, 
      pageNumber: i + 1, 
      totalPages: range.count 
    });
  }
  doc.end();
}


/**
 * Genera un PDF de apertura de caja
 */
async function generateOpeningPDF(cashBoxData) {
  try {
    const userDataPath = app.getPath("userData");
    const pdfDir = path.join(userDataPath, "pdfs");

    // Crear directorio si no existe
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Obtener configuración de la empresa
    const companySettings = await getCompanySettings();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `apertura_caja_${timestamp}.pdf`;
    const filepath = path.join(pdfDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      stream.on("finish", () => {
        resolve(filepath);
      });

      stream.on("error", reject);

      doc.pipe(stream);

      drawPDFHeader(doc, companySettings, { title: "APERTURA DE CAJA" });

      // Información
      const openedAt = new Date(cashBoxData.opened_at);
      doc.fontSize(12).font("Helvetica");
      doc.text(`Fecha: ${openedAt.toLocaleDateString("es-ES")}`, {
        align: "left",
      });
      doc.text(`Hora: ${openedAt.toLocaleTimeString("es-ES")}`, {
        align: "left",
      });
      doc.text(`Cajero: ${cashBoxData.opened_by}`, { align: "left" });
      doc.text(`ID Caja: #${cashBoxData.id}`, { align: "left" });
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(2);

      // Monto inicial - destacado
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Monto Inicial:", { continued: false });
      doc
        .fontSize(28)
        .fillColor("#2563eb")
        .text(`${formatCurrency(cashBoxData.opening_amount)}`, {
          align: "center",
        });
      doc.fillColor("black");
      doc.moveDown(3);

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(2);

      // Sección de firmas
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("FIRMAS", { align: "center" });
      doc.moveDown(2);

      const signatureY = doc.y;

      // Firma del cajero
      doc.fontSize(10).font("Helvetica");
      doc.text("Cajero que abre:", 80, signatureY);
      doc
        .moveTo(80, signatureY + 50)
        .lineTo(250, signatureY + 50)
        .stroke();
      doc.text(cashBoxData.opened_by, 80, signatureY + 55, {
        width: 170,
        align: "center",
      });

      // Firma del supervisor
      doc.text("Supervisor:", 330, signatureY);
      doc
        .moveTo(330, signatureY + 50)
        .lineTo(500, signatureY + 50)
        .stroke();
      doc.text("_________________", 330, signatureY + 55, {
        width: 170,
        align: "center",
      });

      doc.moveDown(6);

      drawPDFFooter(doc, { printedBy: cashBoxData.opened_by || "Sistema" });
      doc.end();
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Genera un PDF de cierre de caja
 */
async function generateClosingPDF(closeData) {
  try {
    const userDataPath = app.getPath("userData");
    const pdfDir = path.join(userDataPath, "pdfs");

    // Crear directorio si no existe
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Obtener configuración de la empresa
    const companySettings = await getCompanySettings();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `cierre_caja_${timestamp}.pdf`;
    const filepath = path.join(pdfDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, bufferPages: true });
      const stream = fs.createWriteStream(filepath);

      stream.on("finish", () => {
        resolve(filepath);
      });

      stream.on("error", reject);

      doc.pipe(stream);

      const footerOptions = { printedBy: closeData.closed_by || closeData.cashBoxData.opened_by || "Sistema" };

      drawPDFHeader(doc, companySettings, { title: "CUADRE DE CAJA" });

      // Fechas e información
      const openedAt = new Date(closeData.cashBoxData.opened_at);
      const closedAt = new Date();
      doc.fontSize(12).font("Helvetica");
      doc.text(
        `Fecha Apertura: ${openedAt.toLocaleDateString("es-ES")} - ${openedAt.toLocaleTimeString("es-ES")}`,
        { align: "left" },
      );
      doc.text(
        `Fecha Cierre: ${closedAt.toLocaleDateString("es-ES")} - ${closedAt.toLocaleTimeString("es-ES")}`,
        { align: "left" },
      );
      doc.text(`Cajero: ${closeData.cashBoxData.opened_by}`, { align: "left" });
      doc.text(`ID Caja: #${closeData.cashBoxId}`, { align: "left" });
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Detalles financieros
      doc.fontSize(13).font("Helvetica");
      doc.text(`Monto Apertura:`, 80, doc.y, { continued: true });
      doc.text(`${formatCurrency(closeData.openingAmount)}`, {
        align: "right",
      });

      doc
        .fillColor("green")
        .text(`Total Ventas:`, 80, doc.y, { continued: true });
      doc.text(`+${formatCurrency(closeData.salesTotal)}`, { align: "right" });

      doc
        .fillColor("red")
        .text(`Total Gastos:`, 80, doc.y, { continued: true });
      doc.text(`-${formatCurrency(closeData.expensesTotal)}`, {
        align: "right",
      });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Totales
      doc.fillColor("black").fontSize(14);
      doc.text(`Esperado:`, { continued: true });
      doc.text(`${formatCurrency(closeData.expectedAmount)}`, {
        align: "right",
      });

      doc.text(`Contado:`, { continued: true });
      doc.text(`${formatCurrency(closeData.closingAmount)}`, {
        align: "right",
      });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Diferencia
      const difference = closeData.difference;
      const diffColor =
        Math.abs(difference) < 0.005
          ? "green"
          : difference > 0
            ? "blue"
            : "red";
      const diffLabel =
        Math.abs(difference) < 0.005
          ? "✓ CUADRADO"
          : difference > 0
            ? "↑ SOBRANTE"
            : "↓ FALTANTE";

      doc.fillColor(diffColor).fontSize(16);
      doc.text(diffLabel, { align: "center" });
      doc
        .fontSize(20)
        .text(`${difference >= 0 ? "+" : ""}${formatCurrency(difference)}`, {
          align: "center",
        });
      doc.moveDown();

      // Notas si existen
      if (closeData.notes) {
        doc.fillColor("black").fontSize(12).font("Helvetica-Bold");
        doc.text("Notas:", { underline: true });
        doc.font("Helvetica").fontSize(11);
        doc.text(closeData.notes);
        doc.moveDown();
      }

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(2);

      // Sección de firmas
      doc
        .fillColor("black")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("FIRMAS", { align: "center" });
      doc.moveDown(2);

      const signatureY = doc.y;

      // Firma del cajero
      doc.fontSize(10).font("Helvetica");
      doc.text("Cajero que cierra:", 80, signatureY);
      doc
        .moveTo(80, signatureY + 50)
        .lineTo(250, signatureY + 50)
        .stroke();
      doc.text(closeData.cashBoxData.opened_by, 80, signatureY + 55, {
        width: 170,
        align: "center",
      });

      // Firma del supervisor
      doc.text("Supervisor:", 330, signatureY);
      doc
        .moveTo(330, signatureY + 50)
        .lineTo(500, signatureY + 50)
        .stroke();
      doc.text("_________________", 330, signatureY + 55, {
        width: 170,
        align: "center",
      });

      doc.moveDown(2);
      finalizePDF(doc, footerOptions);
    });
  } catch (error) {
    throw error;
  }
}

function formatCurrency(amount) {
  const n = parseFloat(amount);
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(isNaN(n) ? 0 : n);
}

/**
 * Convierte hora de formato 24h (HH:mm) a 12h (hh:mm AM/PM)
 */
function formatTimeTo12h(timeStr) {
  if (!timeStr) return "N/A";
  try {
    // Si ya viene con AM/PM, devolverlo tal cual
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    
    let hours = parseInt(parts[0]);
    const minutes = parts[1].substring(0, 2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // el 0 es 12
    
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
}

// Removiendo la segunda declaración de finalizePDF para evitar conflictos
// (Se consolidó arriba en la línea 158)

/**
 * Genera un PDF de membresía (ticket o factura)
 */
async function generateMembershipPDF(pdfData) {
  try {
    const userDataPath = app.getPath("userData");
    const pdfDir = path.join(userDataPath, "pdfs");

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const companySettings = await getCompanySettings();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const isTicket = pdfData.type === "membership_ticket";
    const isHistory = pdfData.type === "membership_history";
    const filename = `membresia_${isHistory ? "historial" : isTicket ? "ticket" : "factura"}_${timestamp}.pdf`;
    const filepath = path.join(pdfDir, filename);

    return new Promise((resolve, reject) => {
      // Watchdog para evitar cuelgues eternos (10 segundos)
      const timeout = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado generando el PDF"));
      }, 10000);

      try {
        const doc = new PDFDocument({ margin: 50, bufferPages: true });
        const stream = fs.createWriteStream(filepath);

        stream.on("finish", () => {
          clearTimeout(timeout);
          resolve(filepath);
        });

        stream.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        doc.pipe(stream);

        const membership = pdfData.membership || {};

        // Pie de página automático
        const footerOptions = { 
          printedBy: pdfData.printedBy || "Sistema", 
          footerCenter: `ID Membresía: #${membership.id || "N/A"} - ¡Gracias por su preferencia!` 
        };

        drawPDFHeader(doc, companySettings, { title: isHistory ? "HISTORIAL DE MEMBRESÍA" : isTicket ? "TICKET DE MEMBRESÍA" : "FACTURA DE MEMBRESÍA" });

        // Información del cliente
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text("DATOS DEL CLIENTE", { underline: true });
        doc.font("Helvetica").fontSize(11);
        doc.text(`Cliente: ${membership.client_name || "N/A"}`);
        if (membership.id_card) doc.text(`Cédula: ${membership.id_card}`);
        if (membership.phone) doc.text(`Teléfono: ${membership.phone}`);
        doc.moveDown();

        // Información de la membresía
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text("DATOS DE LA MEMBRESÍA", { underline: true });
        doc.font("Helvetica").fontSize(11);
        doc.text(`Tipo: ${membership.membership_name || "N/A"}`);
        if (membership.total_hours) {
          if (pdfData.isReprint) {
            doc.text(`Horas Restantes / N° Entradas: ${membership.total_hours}`);
          } else {
            doc.text(`N° Entradas: ${membership.total_hours}`);
          }
        }
        if (membership.acquisition_date) doc.text(`Adquisición: ${new Date(membership.acquisition_date).toLocaleDateString("es-ES")}`);
        
        let start_date = "N/A";
        let end_date = "N/A";
        try {
          if (membership.start_date) start_date = new Date(membership.start_date).toLocaleDateString("es-ES");
          if (membership.end_date) end_date = new Date(membership.end_date).toLocaleDateString("es-ES");
        } catch (e) {}

        doc.text(`Fecha Inicio: ${start_date}`);
        doc.text(`Fecha Vencimiento: ${end_date}`);
        doc.moveDown();

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Detalles de pago
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text("DETALLES DE PAGO", { underline: true });
        doc.font("Helvetica").fontSize(11);
        doc.text(`Método de Pago: ${(membership.payment_method || "N/A").toUpperCase()}`);
        doc.moveDown();

        // Total o Saldo - destacado
        doc.fontSize(14).font("Helvetica-Bold");
        if (pdfData.isReprint) {
          doc.text("SALDO TOTAL:", { continued: false });
          const saldo = membership.balance !== undefined ? membership.balance : (membership.payment_amount || 0);
          doc
            .fontSize(24)
            .fillColor("#2563eb")
            .text(`${formatCurrency(saldo)}`, {
              align: "center",
            });
        } else {
          doc.text("TOTAL PAGADO:", { continued: false });
          doc
            .fontSize(24)
            .fillColor("#2563eb")
            .text(`${formatCurrency(membership.payment_amount || 0)}`, {
              align: "center",
            });
        }
        doc.fillColor("black");
        doc.moveDown(2);

        // Notas si existen
        if (membership.notes) {
          doc.fontSize(10).font("Helvetica").fillColor("#666666");
          doc.text(`Notas: ${membership.notes}`);
          doc.moveDown();
        }

        // Historial de Transacciones
        if (isHistory && Array.isArray(pdfData.transactions)) {
          doc.moveDown();
          doc.fontSize(12).font("Helvetica-Bold").fillColor("black");
          doc.text("HISTORIAL DE TRANSACCIONES", { underline: true });
          doc.moveDown(0.5);

          if (pdfData.transactions.length === 0) {
            doc.fontSize(10).font("Helvetica-Oblique").fillColor("#666666");
            doc.text("No existen transacciones para esta membresía.");
          } else {
            const tableTop = doc.y;
            const dateX = 50;
            const typeX = 180;
            const amountX = 280;
            const balanceX = 380;
            const userX = 480;

            doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333");
            doc.text("Fecha", dateX, tableTop);
            doc.text("Tipo", typeX, tableTop);
            doc.text("Monto", amountX, tableTop, { width: 80, align: "right" });
            doc.text("Saldo", balanceX, tableTop, { width: 80, align: "right" });
            doc.text("Cajero", userX, tableTop);

            doc.moveTo(dateX, tableTop + 15).lineTo(550, tableTop + 15).stroke();
            let yPosition = tableTop + 25;

            doc.fontSize(9).font("Helvetica");
            pdfData.transactions.forEach((t) => {
              if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
              }
              const tDate = new Date(t.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
              let op = "";
              let amountStr = "";
              let amountColor = "black";
              if (t.type === "charge") {
                op = "Cobro";
                amountStr = `-${formatCurrency(t.amount)}`;
                amountColor = "#dc2626";
              } else if (t.type === "recharge") {
                op = "Recarga";
                amountStr = `+${formatCurrency(t.amount)}`;
                amountColor = "#16a34a";
              } else if (t.type === "refund") {
                op = "Reembolso";
                amountStr = `+${formatCurrency(t.amount)}`;
                amountColor = "#16a34a";
              } else if (t.type === "discount") {
                op = "Descuento";
                amountStr = `-${formatCurrency(t.amount)}`;
                amountColor = "#9333ea";
              } else {
                op = t.type;
                amountStr = formatCurrency(t.amount);
              }

              doc.fillColor("#333333").text(tDate, dateX, yPosition);
              doc.text(op, typeX, yPosition);
              doc.fillColor(amountColor).text(amountStr, amountX, yPosition, { width: 80, align: "right" });
              doc.fillColor("#2563eb").text(formatCurrency(t.new_balance), balanceX, yPosition, { width: 80, align: "right" });
              doc.fillColor("#666666").text(t.first_name ? `${t.first_name} ${t.last_name}` : "Sistema", userX, yPosition);
              
              if (t.notes) {
                yPosition += 12;
                doc.fillColor("#888888").fontSize(8).text(`Detalle: ${t.notes}`, typeX, yPosition);
                doc.fontSize(9);
              }

              yPosition += 20;
            });
          }
          doc.moveDown(2);
          doc.fillColor("black");
        }

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        finalizePDF(doc, footerOptions);
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Genera un PDF de reservación
 */
async function generateReservationPDF(reservationData) {
  try {
    const userDataPath = app.getPath("userData");
    const pdfDir = path.join(userDataPath, "pdfs");

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const companySettings = await getCompanySettings();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `reservacion_${reservationData.id}_${timestamp}.pdf`;
    const filepath = path.join(pdfDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, bufferPages: true });
      const stream = fs.createWriteStream(filepath);

      stream.on("finish", () => {
        resolve(filepath);
      });

      stream.on("error", reject);

      doc.pipe(stream);

      const footerOptions = { 
        printedBy: reservationData.created_by || "Sistema"
      };

      drawPDFHeader(doc, companySettings, { title: "RESERVACIÓN", titleColor: "#2563eb" });

      // Estado
      const statusText =
        reservationData.status === "pending"
          ? "PENDIENTE"
          : reservationData.status === "confirmed"
            ? "CONFIRMADA"
            : "CANCELADA";
      const statusColor =
        reservationData.status === "pending"
          ? "#eab308"
          : reservationData.status === "confirmed"
            ? "#16a34a"
            : "#dc2626";

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(statusColor)
        .text(`Estado: ${statusText}`, { align: "center" });
      doc.moveDown(2);

      // Información del cliente
      doc.fontSize(16).font("Helvetica-Bold").fillColor("black");
      doc.text("INFORMACIÓN DEL CLIENTE");
      doc.moveDown(0.5);

      doc.fontSize(12).font("Helvetica").fillColor("#333333");
      doc.text(`Nombre: ${reservationData.client_name}`);
      doc.text(`Teléfono: ${reservationData.client_phone}`);
      if (reservationData.client_email) {
        doc.text(`Email: ${reservationData.client_email}`);
      }
      doc.moveDown(1.5);

      // Información del evento
      doc.fontSize(16).font("Helvetica-Bold").fillColor("black");
      doc.text("INFORMACIÓN DEL EVENTO");
      doc.moveDown(0.5);

      doc.fontSize(12).font("Helvetica").fillColor("#333333");
      const eventDate = new Date(reservationData.event_date);
      doc.text(
        `Fecha: ${eventDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
      );
      doc.text(`Hora: ${formatTimeTo12h(reservationData.event_time)}`);
      doc.moveDown(1.5);

      // Paquete seleccionado
      doc.fontSize(16).font("Helvetica-Bold").fillColor("black");
      doc.text("PAQUETE SELECCIONADO");
      doc.moveDown(0.5);

      doc.fontSize(12).font("Helvetica").fillColor("#333333");
      doc.text(reservationData.package_name);
      doc.moveDown(1.5);

      // Resumen de pagos
      doc.fontSize(16).font("Helvetica-Bold").fillColor("black");
      doc.text("RESUMEN DE PAGOS");
      doc.moveDown(0.5);

      const startX = 50;
      const startY = doc.y;

      // Línea superior
      doc
        .moveTo(startX, startY)
        .lineTo(550, startY)
        .strokeColor("#cccccc")
        .stroke();

      doc.y = startY + 10;

      // Total
      doc.fontSize(12).font("Helvetica").fillColor("#333333");
      doc.text("Total:", startX + 10, doc.y);
      doc.text(
        `$${Number(reservationData.total_amount).toFixed(2)}`,
        startX + 400,
        doc.y,
        { width: 100, align: "right" },
      );
      doc.moveDown(0.5);

      // Anticipo
      doc.text("Anticipo:", startX + 10, doc.y);
      doc.text(
        `$${Number(reservationData.deposit_amount).toFixed(2)}`,
        startX + 400,
        doc.y,
        { width: 100, align: "right" },
      );
      doc.moveDown(0.5);

      // Línea separadora
      const lineY = doc.y + 5;
      doc
        .moveTo(startX, lineY)
        .lineTo(550, lineY)
        .strokeColor("#cccccc")
        .stroke();

      doc.y = lineY + 10;

      // Pendiente
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#dc2626");
      doc.text("Pendiente:", startX + 10, doc.y);
      doc.text(
        `$${(Number(reservationData.total_amount) - Number(reservationData.deposit_amount)).toFixed(2)}`,
        startX + 400,
        doc.y,
        { width: 100, align: "right" },
      );
      doc.moveDown(1.5);

      // Notas
      if (reservationData.notes) {
        doc.fontSize(16).font("Helvetica-Bold").fillColor("black");
        doc.text("NOTAS", startX, doc.y);
        doc.moveDown(0.5);

        doc.fontSize(11).font("Helvetica").fillColor("#666666");
        doc.text(reservationData.notes, startX, doc.y, {
          width: 500,
          align: "justify",
        });
        doc.moveDown(1.5);
      }

      finalizePDF(doc, footerOptions);
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Genera un PDF de cotización
 */
async function generateQuotationPDF(quotationData) {
  try {
    const userDataPath = app.getPath("userData");
    const pdfDir = path.join(userDataPath, "pdfs");

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const companySettings = await getCompanySettings();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `cotizacion_${quotationData.quotation_number}_${timestamp}.pdf`;
    const filepath = path.join(pdfDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, bufferPages: true });
      const stream = fs.createWriteStream(filepath);

      stream.on("finish", () => {
        resolve(filepath);
      });

      stream.on("error", reject);

      doc.pipe(stream);

      // Configurar pie de página automático para todas las páginas
      const footerOptions = { printedBy: quotationData.printedBy || "Sistema" };

      drawPDFHeader(doc, companySettings, { title: "COTIZACIÓN", titleColor: "#9333ea" });

      // Número y fecha
      doc.fontSize(12).font("Helvetica").fillColor("#333333");
      doc.text(`Número: ${quotationData.quotation_number}`);
      doc.text(
        `Fecha: ${new Date(quotationData.created_at).toLocaleDateString("es-ES")}`,
      );
      if (quotationData.valid_until) {
        doc.text(
          `Válida hasta: ${new Date(quotationData.valid_until).toLocaleDateString("es-ES")}`,
        );
      }
      doc.moveDown(1.5);

      // Información del cliente
      doc.fontSize(14).font("Helvetica-Bold").fillColor("black");
      doc.text("CLIENTE");
      doc.moveDown(0.5);

      doc.fontSize(11).font("Helvetica").fillColor("#333333");
      doc.text(`Nombre: ${quotationData.client_name}`);
      if (quotationData.client_phone) {
        doc.text(`Teléfono: ${quotationData.client_phone}`);
      }
      if (quotationData.client_email) {
        doc.text(`Email: ${quotationData.client_email}`);
      }
      if (quotationData.client_address) {
        doc.text(`Dirección: ${quotationData.client_address}`);
      }
      doc.moveDown(1.5);

      // Tabla de items
      doc.fontSize(14).font("Helvetica-Bold").fillColor("black");
      doc.text("DETALLE");
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const itemX = 50;
      const qtyX = 320;
      const priceX = 380;
      const totalX = 480;

      // Encabezados de tabla
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#666666");
      doc.text("Descripción", itemX, tableTop);
      doc.text("Cant.", qtyX, tableTop, { width: 50, align: "center" });
      doc.text("Precio", priceX, tableTop, { width: 80, align: "right" });
      doc.text("Subtotal", totalX, tableTop, { width: 80, align: "right" });

      // Línea debajo de encabezados
      doc
        .moveTo(itemX, tableTop + 15)
        .lineTo(560, tableTop + 15)
        .strokeColor("#cccccc")
        .stroke();

      let yPosition = tableTop + 25;

      // Items
      doc.fontSize(10).font("Helvetica").fillColor("#333333");
      quotationData.items.forEach((item) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.text(item.description, itemX, yPosition, { width: 260 });
        doc.text(item.quantity.toString(), qtyX, yPosition, {
          width: 50,
          align: "center",
        });
        doc.text(`$${Number(item.unit_price).toFixed(2)}`, priceX, yPosition, {
          width: 80,
          align: "right",
        });
        doc.text(`$${Number(item.subtotal).toFixed(2)}`, totalX, yPosition, {
          width: 80,
          align: "right",
        });

        yPosition += 25;
      });

      // Línea antes de totales
      yPosition += 10;
      doc
        .moveTo(itemX, yPosition)
        .lineTo(560, yPosition)
        .strokeColor("#cccccc")
        .stroke();

      yPosition += 15;

      // Totales
      doc.fontSize(11).font("Helvetica").fillColor("#333333");

      // Subtotal
      doc.text("Subtotal:", priceX, yPosition, { width: 80, align: "right" });
      doc.text(`$${Number(quotationData.subtotal).toFixed(2)}`, totalX, yPosition, {
        width: 80,
        align: "right",
      });
      yPosition += 20;

      // Descuento
      if (quotationData.discount > 0) {
        doc
          .fillColor("#16a34a")
          .text("Descuento:", priceX, yPosition, { width: 80, align: "right" });
        doc.text(`-$${Number(quotationData.discount).toFixed(2)}`, totalX, yPosition, {
          width: 80,
          align: "right",
        });
        yPosition += 20;
        doc.fillColor("#333333");
      }

      // Impuesto
      if (quotationData.tax > 0) {
        doc.text("Impuesto:", priceX, yPosition, { width: 80, align: "right" });
        doc.text(`$${Number(quotationData.tax).toFixed(2)}`, totalX, yPosition, {
          width: 80,
          align: "right",
        });
        yPosition += 20;
      }

      // Línea antes del total
      doc
        .moveTo(priceX, yPosition)
        .lineTo(560, yPosition)
        .strokeColor("#333333")
        .lineWidth(2)
        .stroke();

      yPosition += 15;

      // Total
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#9333ea");
      doc.text("TOTAL:", priceX, yPosition, { width: 80, align: "right" });
      doc.text(`$${Number(quotationData.total).toFixed(2)}`, totalX, yPosition, {
        width: 80,
        align: "right",
      });

      // Notas
      if (quotationData.notes) {
        yPosition += 40;
        doc.fontSize(12).font("Helvetica-Bold").fillColor("black");
        doc.text("NOTAS", itemX, yPosition);
        yPosition += 20;

        doc.fontSize(10).font("Helvetica").fillColor("#666666");
        doc.text(quotationData.notes, itemX, yPosition, {
          width: 500,
          align: "justify",
        });
      }

      // Formas de pago (si hay en companySettings)
      const pm = companySettings.paymentMethods;
      const hasBankAccounts = pm && Array.isArray(pm.bankAccounts) && pm.bankAccounts.length > 0;
      const hasPaymentMethods = pm && (pm.checkPayeeName || hasBankAccounts);
      if (hasPaymentMethods) {
        yPosition = doc.y + 30;
        if (yPosition > 660) { doc.addPage(); yPosition = 50; }

        doc.fontSize(12).font("Helvetica-Bold").fillColor("#333333");
        doc.text("FORMAS DE PAGO", itemX, yPosition);
        yPosition += 18;

        doc.moveTo(itemX, yPosition).lineTo(560, yPosition).strokeColor("#e5e7eb").lineWidth(1).stroke();
        yPosition += 10;

        doc.fontSize(10).font("Helvetica").fillColor("#333333");

        // Efectivo
        doc.font("Helvetica-Bold").text("• Efectivo", itemX, yPosition);
        yPosition += 18;

        // Cheque
        if (pm.checkPayeeName) {
          doc.font("Helvetica-Bold").text("• Cheque a nombre de:", itemX, yPosition, { continued: true });
          doc.font("Helvetica").text(` ${pm.checkPayeeName}`);
          yPosition = doc.y + 4;
        }

        // Transferencias (una por cuenta bancaria)
        let bankAccounts = Array.isArray(pm.bankAccounts) ? pm.bankAccounts : [];
        if (bankAccounts.length === 0 && pm.bankName && pm.bankAccountNumber) {
          bankAccounts = [{
            bankName: pm.bankName,
            bankAccountType: pm.bankAccountType || "cordobas",
            bankAccountNumber: pm.bankAccountNumber,
            bankAccountHolder: pm.bankAccountHolder || ""
          }];
        }
        if (bankAccounts.length > 0) {
          doc.font("Helvetica-Bold").text("• Transferencia bancaria:", itemX, yPosition);
          yPosition = doc.y + 4;

          bankAccounts.forEach((acct, idx) => {
            if (yPosition > 660) { doc.addPage(); yPosition = 50; }
            const typeLabel = acct.bankAccountType === "dolares" ? "USD" : "NIO";
            const lineParts = [`  ${acct.bankName} (${typeLabel}) — Cta: ${acct.bankAccountNumber}`];
            if (acct.bankAccountHolder) lineParts.push(`A nombre de: ${acct.bankAccountHolder}`);
            doc.font("Helvetica").text(lineParts.join("  |  "), itemX + 8, yPosition, { width: 500 });
            yPosition = doc.y + 3;
          });
        }
      }

      finalizePDF(doc, footerOptions);
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Genera un reporte PDF genérico (tablas y resúmenes)
 */
async function generateGenericReport(options) {
  try {
    const userDataPath = app.getPath("userData");
    const pdfDir = path.join(userDataPath, "pdfs");

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const companySettings = await getCompanySettings();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${options.filename || "reporte"}_${timestamp}.pdf`;
    const filepath = path.join(pdfDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const stream = fs.createWriteStream(filepath);

      stream.on("finish", () => resolve(filepath));
      stream.on("error", reject);

      doc.pipe(stream);

      let tableYOffset = drawPDFHeader(doc, companySettings, { 
        title: options.title || "REPORTE", 
        subtitle: options.subtitle,
        titleSize: 18 
      });

      drawPDFFooter(doc, { printedBy: options.printedBy || "Sistema" });
      
      doc.on('pageAdded', () => {
        drawPDFFooter(doc, { printedBy: options.printedBy || "Sistema" });
      });

      // Resumen
      if (options.summary && options.summary.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").fillColor("black").text("RESUMEN");
        doc.moveDown(0.5);
        
        doc.fontSize(10).font("Helvetica").fillColor("#333333");
        options.summary.forEach(item => {
          const valueText = typeof item.value === 'number' ? formatCurrency(item.value) : item.value;
          doc.text(`${item.label}: `, { continued: true }).font("Helvetica-Bold").text(`${valueText}`);
          doc.font("Helvetica");
        });
        doc.moveDown(1.5);
      }

      // Tabla
      if (options.columns && options.data) {
        const tableTop = doc.y;
        doc.font("Helvetica-Bold").fontSize(10).fillColor("white");

        // Dibujar barra de encabezados de la tabla
        doc.rect(40, tableTop, 515, 20).fill("#3b82f6");
        doc.fillColor("white");

        let currentY = tableTop + 6;
        let columnX = 45;
        
        // Calcular anchos proporcionales
        const totalWidthUnit = options.columns.reduce((sum, col) => sum + (col.width || 15), 0);
        const availableWidth = 505; // 515 total - 10 margen
        const getColWidth = (col) => ((col.width || 15) / totalWidthUnit) * availableWidth;

        // Escribir cabeceras
        options.columns.forEach((col, i) => {
            const isRight = col.format === "currency" || col.format === "number";
            const colWidth = getColWidth(col);
            doc.text(col.header, columnX, currentY, { 
                width: colWidth - 5, 
                align: isRight ? "right" : "left",
                lineBreak: false // Evitar saltos de línea en cabeceras para no romper la tabla
            });
            columnX += colWidth;
        });

        currentY += 20;

        // Filas de datos
        doc.font("Helvetica").fontSize(9);
        options.data.forEach((row, rowIndex) => {
            // Pre-formatear valores y calcular altura máxima de la fila
            let rowHeight = 20; // Altura mínima
            const formattedRow = {};
            
            options.columns.forEach(col => {
                let cellValue = row[col.key];
                if (cellValue !== null && cellValue !== undefined) {
                  if (col.format === 'currency') cellValue = formatCurrency(cellValue);
                  else if (col.format === 'date') cellValue = new Date(cellValue).toLocaleDateString("es-ES");
                  else if (col.format === 'datetime') cellValue = new Date(cellValue).toLocaleString("es-ES");
                  else if (col.format === 'number') cellValue = cellValue.toLocaleString("es-ES");
                } else {
                  cellValue = "-";
                }
                formattedRow[col.key] = String(cellValue);
                
                const colWidth = getColWidth(col);
                const textHeight = doc.heightOfString(formattedRow[col.key], { width: colWidth - 8 });
                if (textHeight + 10 > rowHeight) {
                    rowHeight = textHeight + 10;
                }
            });

            // Salto de página si es necesario antes de dibujar la fila
            if (currentY + rowHeight > 750) {
                doc.addPage();
                currentY = 50;
            }

            // Fondo alterno
            if (rowIndex % 2 !== 0) {
                doc.rect(40, currentY - 6, 515, rowHeight).fill("#f9fafb");
            }
            doc.fillColor("#333333");

            columnX = 45;
            options.columns.forEach(col => {
                const isRight = col.format === "currency" || col.format === "number";
                const colWidth = getColWidth(col);
                doc.text(formattedRow[col.key], columnX, currentY, { 
                  width: colWidth - 8, 
                  align: isRight ? "right" : "left"
                });
                columnX += colWidth;
            });

            currentY += rowHeight;
        });

        // Fila de Totales al final de la tabla
        const hasCurrency = options.columns.some(col => col.format === 'currency');
        if (hasCurrency) {
          doc.moveTo(40, currentY - 4).lineTo(555, currentY - 4).strokeColor("#3b82f6").lineWidth(1).stroke();
          doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e3a8a");
          
          let colX = 45;
          options.columns.forEach((col, idx) => {
            const colWidth = getColWidth(col);
            if (col.format === 'currency') {
              const total = options.data.reduce((sum, row) => sum + (Number(row[col.key]) || 0), 0);
              doc.text(formatCurrency(total), colX, currentY, { width: colWidth - 8, align: "right" });
            } else if (idx === 0) {
              doc.text("TOTAL GENERAL", colX, currentY);
            }
            colX += colWidth;
          });
        }
      }

      doc.end();
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Genera el PDF del Resumen Diario de Caja
 */
async function generateDailyCashSummaryPDF(data, selectedDate) {
  try {
    const userDataPath = app.getPath("userData");
    const pdfDir = path.join(userDataPath, "pdfs");

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const companySettings = await getCompanySettings();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `resumen-caja-${selectedDate}_${timestamp}.pdf`;
    const filepath = path.join(pdfDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      stream.on("finish", () => {
        resolve(filepath);
      });

      stream.on("error", reject);

      doc.pipe(stream);

      // Fecha
      const [year, month, day] = selectedDate.split('-');
      const formattedDate = new Date(year, month - 1, day).toLocaleDateString("es-ES", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
      drawPDFHeader(doc, companySettings, { title: "RESUMEN DIARIO DE CAJA", subtitle: formattedDate, titleSize: 18 });

      // Información de caja
      if (data.cashBox) {
        doc.fontSize(10).font("Helvetica").text(`Caja #${data.cashBox.id} - Abierta por: ${data.cashBox.opened_by}`);
        
        doc.fontSize(11).font("Helvetica-Bold").text("Monto de Apertura: ", { continued: true });
        doc.font("Helvetica").text(formatCurrency(data.summary.openingAmount), { align: "right" });
        doc.moveDown(0.5);
      }

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cccccc").stroke();
      doc.moveDown(1);
      doc.fillColor("black");

      // VENTAS DEL DÍA
      doc.fontSize(14).font("Helvetica-Bold").text("VENTAS DEL DÍA");
      doc.moveDown(0.5);
      
      doc.fontSize(11).font("Helvetica").text(`Total de Ventas (${data.sales.count}):`, { continued: true });
      doc.font("Helvetica-Bold").text(formatCurrency(data.sales.total), { align: "right" });
      
      if (data.sales.discount > 0) {
        doc.fontSize(10).font("Helvetica").fillColor("#666666");
        doc.text("Subtotal:", { indent: 20, continued: true });
        doc.text(formatCurrency(data.sales.subtotal), { align: "right" });
        
        doc.text("Descuentos:", { indent: 20, continued: true });
        doc.text(`-${formatCurrency(data.sales.discount)}`, { align: "right" });
      }
      doc.moveDown(1);
      doc.fillColor("black");

      // Por método de pago
      doc.fontSize(11).font("Helvetica-Bold").text("Por Método de Pago:");
      doc.fontSize(10).font("Helvetica");
      data.sales.byMethod.forEach((method) => {
        const methodName = method.payment_method === "cash" ? "Efectivo"
            : method.payment_method === "card" ? "Tarjeta"
            : method.payment_method === "transfer" ? "Transferencia"
            : method.payment_method;
        doc.text(`${methodName} (${method.count}):`, { indent: 15, continued: true });
        doc.text(formatCurrency(method.total), { align: "right" });
      });
      doc.moveDown(1);

      // DETALLE DE VENTAS (productos)
      if (data.sales.items && data.sales.items.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("DETALLE DE VENTAS");
        doc.moveDown(0.5);

        const MARGIN = 50;
        const colW = [40, 60, 330, 70]; // ID, Tipo, Productos, Total
        const tableTop = doc.y;

        // Encabezado de tabla
        doc.rect(MARGIN, tableTop, 500, 18).fill("#3b82f6");
        doc.fillColor("white").fontSize(9).font("Helvetica-Bold");
        let cx = MARGIN + 4;
        ["ID", "Tipo", "Productos", "Total"].forEach((h, i) => {
          const align = i === 3 ? "right" : "left";
          doc.text(h, cx, tableTop + 4, { width: colW[i] - 4, align, lineBreak: false });
          cx += colW[i];
        });

        let rowY = tableTop + 18;
        doc.fontSize(8).font("Helvetica");

        data.sales.items.forEach((sale, idx) => {
          const typeName = sale.sale_type === "membership" ? "Membresía"
            : sale.sale_type === "package" ? "Paquete" : "Producto";
          const products = sale.products || "-";
          const rowH = Math.max(18, doc.heightOfString(products, { width: colW[2] - 8 }) + 8);

          if (rowY + rowH > 730) {
            doc.addPage();
            rowY = 50;
          }

          if (idx % 2 !== 0) {
            doc.rect(MARGIN, rowY, 500, rowH).fill("#f9fafb");
          }
          doc.fillColor("#333333");

          cx = MARGIN + 4;
          doc.text(`#${sale.id}`, cx, rowY + 4, { width: colW[0] - 4, lineBreak: false });
          cx += colW[0];
          doc.text(typeName, cx, rowY + 4, { width: colW[1] - 4, lineBreak: false });
          cx += colW[1];
          doc.text(products, cx, rowY + 4, { width: colW[2] - 8 });
          cx += colW[2];
          doc.text(formatCurrency(sale.total), MARGIN + 4 + colW[0] + colW[1] + colW[2], rowY + 4, { width: colW[3] - 4, align: "right", lineBreak: false });

          rowY += rowH;
        });

        doc.y = rowY + 8;
        doc.moveDown(0.5);
      }

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cccccc").stroke();
      doc.moveDown(1);

      // INGRESOS ADICIONALES
      if (data.additionalIncome.total > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("INGRESOS ADICIONALES");
        doc.moveDown(0.5);
        
        doc.fontSize(10).font("Helvetica");
        data.additionalIncome.items.forEach((item) => {
          doc.text(item.description, { continued: true });
          doc.text(formatCurrency(item.amount), { align: "right" });
        });
        
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica-Bold").text("Total Ingresos:", { continued: true });
        doc.text(formatCurrency(data.additionalIncome.total), { align: "right" });
        doc.moveDown(1);
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cccccc").stroke();
        doc.moveDown(1);
      }

      // GASTOS
      if (data.expenses.total > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("GASTOS");
        doc.moveDown(0.5);
        
        doc.fontSize(10).font("Helvetica");
        data.expenses.items.forEach((item) => {
          doc.text(item.description, { continued: true });
          doc.fillColor("#dc2626").text(`-${formatCurrency(item.amount)}`, { align: "right" });
          doc.fillColor("black");
        });
        
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica-Bold").text("Total Gastos:", { continued: true });
        doc.fillColor("#dc2626").text(`-${formatCurrency(data.expenses.total)}`, { align: "right" });
        doc.fillColor("black");
        doc.moveDown(1);
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cccccc").stroke();
        doc.moveDown(1);
      }

      // RESUMEN — caja con fondo gris, altura dinámica
      const yResumen = doc.y;
      const RMARGIN = 50;
      const RWIDTH = 500;

      // Dibujar rect con altura suficiente (80px para 2 filas + título)
      doc.rect(RMARGIN, yResumen, RWIDTH, 82).fill("#f3f4f6");
      doc.fillColor("#1e3a8a").fontSize(14).font("Helvetica-Bold");
      doc.text("RESUMEN", RMARGIN, yResumen + 10, { width: RWIDTH, align: "center" });

      // Fila 1: Efectivo Esperado
      const y1 = yResumen + 34;
      doc.fontSize(11).font("Helvetica").fillColor("#333333");
      doc.text("Efectivo Esperado:", RMARGIN + 10, y1, { lineBreak: false });
      doc.font("Helvetica-Bold").text(
        formatCurrency(data.summary.expectedCash),
        RMARGIN, y1,
        { width: RWIDTH - 10, align: "right", lineBreak: false }
      );

      // Separador
      doc.moveTo(RMARGIN + 10, yResumen + 54)
         .lineTo(RMARGIN + RWIDTH - 10, yResumen + 54)
         .strokeColor("#9ca3af").lineWidth(0.5).stroke();

      // Fila 2: Ingreso Neto del Día
      const y2 = yResumen + 60;
      const netColor = data.summary.netIncome >= 0 ? "#16a34a" : "#dc2626";
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#333333");
      doc.text("Ingreso Neto del Día:", RMARGIN + 10, y2, { lineBreak: false });
      doc.fillColor(netColor).fontSize(13).text(
        formatCurrency(data.summary.netIncome),
        RMARGIN, y2,
        { width: RWIDTH - 10, align: "right", lineBreak: false }
      );
      doc.fillColor("black");

      doc.y = yResumen + 92;
      doc.moveDown(1);

      drawPDFFooter(doc, { printedBy: data.printedBy || (data.cashBox ? data.cashBox.opened_by : "Sistema") });
      doc.end();
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Genera una FACTURA FORMAL para una reservación
 */
async function generateReservationInvoicePDF(data) {
  try {
    const userDataPath = app.getPath("userData");
    const pdfDir = path.join(userDataPath, "pdfs");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    
    // Obtener configuración de facturación específica
    const settingsRow = await getAsync("SELECT value FROM settings WHERE key = 'invoice_config'");
    const config = settingsRow ? JSON.parse(settingsRow.value) : null;
    
    // Obtener configuración general como respaldo
    const generalSettingsRows = await allAsync(
      `SELECT key, value FROM settings WHERE key IN ('company_name','company_address','company_phone','company_ruc')`
    );
    const general = {};
    generalSettingsRows.forEach(r => general[r.key] = r.value);

    // Priorizar config de factura, si no, usar general
    const bizName = config?.businessName || general['company_name'] || "SIPARK";
    const bizAddress = config?.businessAddress || general['company_address'] || "";
    const bizPhone = config?.businessPhone || general['company_phone'] || "";
    const bizRuc = config?.taxId || general['company_ruc'] || "";
    
    // Obtener número de factura actual y aumentarlo
    const invoiceNumRow = await getAsync("SELECT value FROM settings WHERE key = 'invoice_next_number'");
    let invoiceNumber = invoiceNumRow ? parseInt(invoiceNumRow.value) : 1;
    
    // Actualizar el correlativo para la próxima
    if (invoiceNumRow) {
      await runAsync("UPDATE settings SET value = ? WHERE key = 'invoice_next_number'", [invoiceNumber + 1]);
    } else {
      await runAsync("INSERT INTO settings (key, value) VALUES ('invoice_next_number', ?)", [invoiceNumber + 1]);
    }

    const filename = `factura_res_${data.id}_${invoiceNumber}.pdf`;
    const filepath = path.join(pdfDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, bufferPages: true, size: "LETTER" });
      const stream = fs.createWriteStream(filepath);
      stream.on("finish", () => resolve(filepath));
      stream.on("error", reject);
      doc.pipe(stream);

      const MARGIN = 50;
      const primaryColor = config?.primaryColor || "#2563eb";

      // --- ENCABEZADO ---
      let logoPath = null;
      try {
        const logosDir = fileHandler.getLogosPath();
        const p = path.join(logosDir, "invoice-logo.png");
        if (fs.existsSync(p)) logoPath = p;
      } catch (e) {}

      if (logoPath) {
        doc.image(logoPath, MARGIN, MARGIN, { width: 80 });
      }

      const headerX = logoPath ? 145 : MARGIN;
      const infoWidth = 250; // Limitar ancho para no chocar con "FACTURA"
      
      doc.fillColor("#333333").font("Helvetica-Bold").fontSize(18);
      doc.text(bizName, headerX, MARGIN, { width: infoWidth });
      
      doc.font("Helvetica").fontSize(9).fillColor("#666666");
      // La dirección ahora tiene un ancho limitado y crece hacia abajo
      doc.text(bizAddress, headerX, doc.y, { width: infoWidth, align: "left" });
      doc.text(`Tel: ${bizPhone}`, headerX, doc.y);
      doc.text(`RUC: ${bizRuc}`, headerX, doc.y);

      // Título FACTURA y Número (esto se queda a la derecha)
      const currentY = doc.y; // Guardar posición para no perder el flujo
      doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(26);
      doc.text("FACTURA", 400, MARGIN, { align: "right" });
      doc.fillColor("#333333").fontSize(16);
      doc.text(`N° ${String(invoiceNumber).padStart(6, '0')}`, 400, doc.y, { align: "right" });
      doc.font("Helvetica").fontSize(10).fillColor("#666666");
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 400, doc.y, { align: "right" });
      
      doc.y = currentY; // Restaurar posición para la línea separadora

      const lineY = Math.max(doc.y + 15, 150);
      doc.moveTo(MARGIN, lineY).lineTo(560, lineY).strokeColor(primaryColor).lineWidth(2).stroke();

      // --- DATOS DEL CLIENTE ---
      doc.y = lineY + 20;
      doc.fillColor("#333333").font("Helvetica-Bold").fontSize(12);
      doc.text("DATOS DEL CLIENTE", MARGIN, doc.y);
      doc.font("Helvetica").fontSize(11);
      doc.text(`Nombre: ${data.client_name}`);
      doc.text(`Identificación: ${data.client_id_card || "N/A"}`);
      doc.text(`Teléfono: ${data.client_phone || "N/A"}`);
      doc.text(`Email: ${data.client_email || "N/A"}`);

      // --- DETALLE DEL SERVICIO ---
      doc.y = 260;
      const tableTop = doc.y;
      
      // Encabezado de tabla
      doc.fillColor(primaryColor).rect(MARGIN, tableTop, 510, 20).fill();
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
      doc.text("CANT.", MARGIN + 10, tableTop + 6);
      doc.text("DESCRIPCIÓN", MARGIN + 60, tableTop + 6);
      doc.text("PRECIO UNIT.", MARGIN + 350, tableTop + 6, { width: 80, align: "right" });
      doc.text("TOTAL", MARGIN + 430, tableTop + 6, { width: 80, align: "right" });

      doc.y = tableTop + 30;
      doc.fillColor("#333333").font("Helvetica").fontSize(10);
      
      const totalAmount = Number(data.total_amount);
      const depositAmount = Number(data.deposit_amount || 0);
      const discount = Number(data.discount || 0);
      const subtotal = totalAmount + discount;

      // Línea de item (Paquete)
      const itemY = doc.y;
      doc.text("1", MARGIN + 10, itemY);
      
      // Formatear fecha para que no salga en inglés
      let formattedEventDate = data.event_date;
      try {
        const d = new Date(data.event_date);
        // Sumar un día o ajustar si es necesario, pero toLocaleDateString suele bastar
        formattedEventDate = d.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      } catch (e) {}

      doc.text(`${data.package_name} - Evento: ${formattedEventDate} ${formatTimeTo12h(data.event_time)}`, MARGIN + 60, itemY, { width: 280 });
      doc.text(`$${subtotal.toFixed(2)}`, MARGIN + 350, itemY, { width: 80, align: "right" });
      doc.text(`$${subtotal.toFixed(2)}`, MARGIN + 430, itemY, { width: 80, align: "right" });

      doc.moveDown(1);
      doc.moveTo(MARGIN, doc.y).lineTo(560, doc.y).strokeColor("#eeeeee").lineWidth(1).stroke();

      // --- TOTALES ---
      doc.y += 20;
      const totalsX = 350;
      doc.fontSize(11).font("Helvetica");
      
      // Mostrar Subtotal solo si hay descuento
      if (discount > 0) {
        doc.text("Subtotal:", totalsX, doc.y);
        doc.text(`$${subtotal.toFixed(2)}`, 450, doc.y, { align: "right", width: 100 });
        doc.y += 15;
        
        doc.fillColor("#dc2626");
        doc.text("Descuento:", totalsX, doc.y);
        doc.text(`-$${discount.toFixed(2)}`, 450, doc.y, { align: "right", width: 100 });
        doc.y += 20;
        doc.fillColor("#333333");
      }

      doc.font("Helvetica-Bold").fontSize(16).fillColor(primaryColor);
      doc.text("TOTAL NETO:", totalsX, doc.y);
      doc.text(`$${totalAmount.toFixed(2)}`, 450, doc.y, { align: "right", width: 100 });
      
      doc.y += 25;
      doc.fontSize(10).font("Helvetica").fillColor("#666666");
      doc.text(`Monto Pagado: $${depositAmount.toFixed(2)}`, totalsX, doc.y, { align: "right", width: 200 });

      // --- SECCIÓN DE FIRMAS ---
      doc.y = 620;
      const signatureWidth = 180;
      const signatureY = doc.y;

      // Entregué Conforme
      doc.moveTo(MARGIN + 20, signatureY).lineTo(MARGIN + 20 + signatureWidth, signatureY).strokeColor("#333333").lineWidth(0.5).stroke();
      doc.fontSize(10).font("Helvetica-Bold").text("Entregué Conforme", MARGIN + 20, signatureY + 10, { width: signatureWidth, align: "center" });

      // Recibí Conforme
      doc.moveTo(560 - MARGIN - signatureWidth, signatureY).lineTo(560 - MARGIN, signatureY).stroke();
      doc.text("Recibí Conforme", 560 - MARGIN - signatureWidth, signatureY + 10, { width: signatureWidth, align: "center" });

      // --- PIE DE PÁGINA ---
      doc.y = 710;
      doc.fillColor("#666666").font("Helvetica").fontSize(9);
      doc.text(config?.footerMessage || "¡Gracias por su preferencia!", MARGIN, doc.y, { align: "center" });
      
      if (config?.bankInfo) {
        doc.moveDown(0.5);
        doc.fontSize(8).text(config.bankInfo, MARGIN, doc.y, { align: "center", width: 510 });
      }

      drawPDFFooter(doc, { printedBy: data.printedBy || "Sistema" });
      doc.end();
    });
  } catch (error) {
    console.error("Error factura:", error);
    throw error;
  }
}

module.exports = {
  generateOpeningPDF,
  generateClosingPDF,
  generateMembershipPDF,
  generateReservationPDF,
  generateReservationInvoicePDF,
  generateQuotationPDF,
  generateGenericReport,
  generateDailyCashSummaryPDF,
};
