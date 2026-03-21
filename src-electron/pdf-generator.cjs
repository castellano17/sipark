const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { app, shell } = require("electron");
const api = require("./api.cjs");

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
        `SELECT key, value FROM settings WHERE key IN ('company_name','company_address','company_phone','company_ruc','payment_methods')`,
      );
      const map = {};
      rows.forEach((r) => { map[r.key] = r.value; });
      return {
        businessName: map["company_name"] || "SIPARK",
        businessAddress: map["company_address"] || "",
        businessPhone: map["company_phone"] || "",
        businessRuc: map["company_ruc"] || "",
        paymentMethods: map["payment_methods"] ? JSON.parse(map["payment_methods"]) : null,
      };
    } catch (error) {
      console.error("⚠️ Error obteniendo configuración, usando valores por defecto:", error.message);
      return {
        businessName: "SIPARK",
        businessAddress: "",
        businessPhone: "",
        businessRuc: "",
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
    console.error("Error buscando logo para reporte:", error);
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
    console.error("Error generando PDF de apertura:", error);
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
    console.error("Error generando PDF de cierre:", error);
    throw error;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(amount);
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
    const filename = `membresia_${isTicket ? "ticket" : "factura"}_${timestamp}.pdf`;
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
          console.error("Stream error generating PDF:", err);
          reject(err);
        });

        doc.pipe(stream);

        const membership = pdfData.membership || {};

        // Pie de página automático
        const footerOptions = { 
          printedBy: pdfData.printedBy || "Sistema", 
          footerCenter: `ID Membresía: #${membership.id || "N/A"} - ¡Gracias por su preferencia!` 
        };

        drawPDFHeader(doc, companySettings, { title: isTicket ? "TICKET DE MEMBRESÍA" : "FACTURA DE MEMBRESÍA" });

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
        if (membership.total_hours) doc.text(`N° Entradas: ${membership.total_hours}`);
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

        // Total - destacado
        doc.fontSize(14).font("Helvetica-Bold");
        doc.text("TOTAL PAGADO:", { continued: false });
        doc
          .fontSize(24)
          .fillColor("#2563eb")
          .text(`${formatCurrency(membership.payment_amount || 0)}`, {
            align: "center",
          });
        doc.fillColor("black");
        doc.moveDown(2);

        // Notas si existen
        if (membership.notes) {
          doc.fontSize(10).font("Helvetica").fillColor("#666666");
          doc.text(`Notas: ${membership.notes}`);
          doc.moveDown();
        }

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        finalizePDF(doc, footerOptions);
      } catch (err) {
        clearTimeout(timeout);
        console.error("Internal error in PDF Promise:", err);
        reject(err);
      }
    });
  } catch (error) {
    console.error("Error generando PDF de membresía:", error);
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
      doc.text(`Hora: ${reservationData.event_time}`);
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
    console.error("Error generando PDF de reservación:", error);
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
    console.error("Error generando PDF de cotización:", error);
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
          doc.text(`${item.label}: `, { continued: true }).font("Helvetica-Bold").text(`${item.value}`);
          doc.font("Helvetica");
        });
        doc.moveDown(2);
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
        
        // Calcular anchos dinámicos básicos
        const columnsCount = options.columns.length;
        const colWidth = 510 / columnsCount;

        // Escribir cabeceras
        options.columns.forEach((col, i) => {
            const isRight = col.format === "currency" || col.format === "number";
            doc.text(col.header, columnX, currentY, { width: colWidth - 5, align: isRight ? "right" : "left" });
            columnX += colWidth;
        });

        currentY += 20;

        // Filas de datos
        doc.font("Helvetica").fontSize(9);
        options.data.forEach((row, rowIndex) => {
            // Fondo alterno
            if (rowIndex % 2 !== 0) {
                doc.rect(40, currentY - 6, 515, 20).fill("#f9fafb");
            }
            doc.fillColor("#333333");

            columnX = 45;
            options.columns.forEach(col => {
                let cellValue = row[col.key];
                
                // Formateadores simples
                if (cellValue !== null && cellValue !== undefined) {
                  if (col.format === 'currency') {
                    cellValue = formatCurrency(cellValue);
                  } else if (col.format === 'date') {
                    cellValue = new Date(cellValue).toLocaleDateString("es-ES");
                  } else if (col.format === 'datetime') {
                    cellValue = new Date(cellValue).toLocaleString("es-ES");
                  } else if (col.format === 'number') {
                    cellValue = cellValue.toLocaleString("es-ES");
                  }
                } else {
                  cellValue = "-";
                }

                const isRight = col.format === "currency" || col.format === "number";
                doc.text(String(cellValue), columnX, currentY, { width: colWidth - 5, align: isRight ? "right" : "left" });
                columnX += colWidth;
            });

            currentY += 20;
            
            // Paginación si sobrepasamos el borde inferior
            if (currentY > 750) {
                doc.addPage();
                currentY = 50;
            }
        });
      }

      doc.end();
    });
  } catch (error) {
    console.error("Error generando reporte genérico:", error);
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

      // RESUMEN
      const yResumen = doc.y;
      doc.rect(40, yResumen, 515, 60).fill("#f3f4f6");
      doc.fillColor("black");
      
      doc.y = yResumen + 10;
      doc.fontSize(14).font("Helvetica-Bold").text("RESUMEN", { indent: 10 });
      doc.moveDown(0.5);
      
      doc.fontSize(11).font("Helvetica").text("Efectivo Esperado:", { indent: 10, continued: true });
      doc.font("Helvetica-Bold").text(formatCurrency(data.summary.expectedCash), { align: "right", right: 50 });
      doc.moveDown(0.5);
      
      doc.fontSize(12).font("Helvetica-Bold").text("Ingreso Neto del Día:", { indent: 10, continued: true });
      doc.fillColor(data.summary.netIncome >= 0 ? "#16a34a" : "#dc2626")
         .text(formatCurrency(data.summary.netIncome), { align: "right", right: 50 });
      doc.fillColor("black");
      
      doc.moveDown(3);

      drawPDFFooter(doc, { printedBy: data.printedBy || (data.cashBox ? data.cashBox.opened_by : "Sistema") });
      doc.end();
    });
  } catch (error) {
    console.error("Error generando PDF de Resumen de Caja:", error);
    throw error;
  }
}

module.exports = {
  generateOpeningPDF,
  generateClosingPDF,
  generateMembershipPDF,
  generateReservationPDF,
  generateQuotationPDF,
  generateGenericReport,
  generateDailyCashSummaryPDF,
};
