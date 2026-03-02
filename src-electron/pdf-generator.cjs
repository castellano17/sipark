const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const api = require("./api.cjs");

/**
 * Obtiene la configuración de la empresa desde settings
 */
async function getCompanySettings() {
  try {
    // Intentar obtener la configuración del ticket primero
    const ticketConfig = await api.getSetting("ticket_config");
    if (ticketConfig) {
      const config = JSON.parse(ticketConfig);
      return {
        businessName: config.businessName || "Mi Negocio",
        businessAddress: config.businessAddress || "",
        businessPhone: config.businessPhone || "",
      };
    }

    // Si no hay configuración de ticket, intentar configuración de factura
    const invoiceConfig = await api.getSetting("invoice_config");
    if (invoiceConfig) {
      const config = JSON.parse(invoiceConfig);
      return {
        businessName: config.businessName || "Mi Negocio",
        businessAddress: config.businessAddress || "",
        businessPhone: config.businessPhone || "",
      };
    }

    // Valores por defecto si no hay configuración
    return {
      businessName: "Mi Negocio",
      businessAddress: "",
      businessPhone: "",
    };
  } catch (error) {
    console.error("Error obteniendo configuración:", error);
    return {
      businessName: "Mi Negocio",
      businessAddress: "",
      businessPhone: "",
    };
  }
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

      // Encabezado con nombre de la empresa
      doc.fontSize(10).font("Helvetica").fillColor("#666666");
      doc.text(companySettings.businessName, { align: "center" });
      if (companySettings.businessAddress) {
        doc.text(companySettings.businessAddress, { align: "center" });
      }
      if (companySettings.businessPhone) {
        doc.text(companySettings.businessPhone, { align: "center" });
      }
      doc.moveDown();

      // Título
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("black")
        .text("APERTURA DE CAJA", { align: "center" });
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

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

      // Pie de página
      doc.fontSize(9).font("Helvetica").fillColor("#666666");
      doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, {
        align: "center",
      });

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
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      stream.on("finish", () => {
        resolve(filepath);
      });

      stream.on("error", reject);

      doc.pipe(stream);

      // Encabezado con nombre de la empresa
      doc.fontSize(10).font("Helvetica").fillColor("#666666");
      doc.text(companySettings.businessName, { align: "center" });
      if (companySettings.businessAddress) {
        doc.text(companySettings.businessAddress, { align: "center" });
      }
      if (companySettings.businessPhone) {
        doc.text(companySettings.businessPhone, { align: "center" });
      }
      doc.moveDown();

      // Título
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("black")
        .text("CUADRE DE CAJA", { align: "center" });
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

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

      doc.moveDown(6);

      // Pie de página
      doc.fillColor("#666666").fontSize(9).font("Helvetica");
      doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, {
        align: "center",
      });

      doc.end();
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

/**
 * Genera un PDF de membresía (ticket o factura)
 */
async function generateMembershipPDF(pdfData) {
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
    const isTicket = pdfData.type === "membership_ticket";
    const filename = `membresia_${isTicket ? "ticket" : "factura"}_${timestamp}.pdf`;
    const filepath = path.join(pdfDir, filename);

    // Validar y establecer valores por defecto
    const membership = {
      id: pdfData.membership.id || "N/A",
      client_name: pdfData.membership.client_name || "Cliente",
      membership_name: pdfData.membership.membership_name || "Membresía",
      start_date: pdfData.membership.start_date || new Date().toISOString(),
      end_date: pdfData.membership.end_date || new Date().toISOString(),
      payment_amount: pdfData.membership.payment_amount || 0,
      payment_method: pdfData.membership.payment_method || "efectivo",
      notes: pdfData.membership.notes || "",
    };

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      stream.on("finish", () => {
        // Abrir el PDF automáticamente
        require("electron").shell.openPath(filepath);
        resolve(filepath);
      });

      stream.on("error", reject);

      doc.pipe(stream);

      // Encabezado con nombre de la empresa
      doc.fontSize(10).font("Helvetica").fillColor("#666666");
      doc.text(companySettings.businessName, { align: "center" });
      if (companySettings.businessAddress) {
        doc.text(companySettings.businessAddress, { align: "center" });
      }
      if (companySettings.businessPhone) {
        doc.text(companySettings.businessPhone, { align: "center" });
      }
      doc.moveDown();

      // Título
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("black")
        .text(isTicket ? "TICKET DE MEMBRESÍA" : "FACTURA DE MEMBRESÍA", {
          align: "center",
        });
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Información del cliente
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("DATOS DEL CLIENTE", { underline: true });
      doc.font("Helvetica").fontSize(11);
      doc.text(`Cliente: ${membership.client_name}`);
      doc.moveDown();

      // Información de la membresía
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("DATOS DE LA MEMBRESÍA", { underline: true });
      doc.font("Helvetica").fontSize(11);
      doc.text(`Tipo: ${membership.membership_name}`);
      doc.text(
        `Fecha Inicio: ${new Date(membership.start_date).toLocaleDateString("es-ES")}`,
      );
      doc.text(
        `Fecha Vencimiento: ${new Date(membership.end_date).toLocaleDateString("es-ES")}`,
      );
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Detalles de pago
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("DETALLES DE PAGO", { underline: true });
      doc.font("Helvetica").fontSize(11);
      doc.text(`Método de Pago: ${membership.payment_method.toUpperCase()}`);
      doc.moveDown();

      // Total - destacado
      doc.fontSize(14).font("Helvetica-Bold");
      doc.text("TOTAL PAGADO:", { continued: false });
      doc
        .fontSize(24)
        .fillColor("#2563eb")
        .text(`${formatCurrency(membership.payment_amount)}`, {
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

      // Pie de página
      doc.fontSize(9).font("Helvetica").fillColor("#666666");
      doc.text(`Fecha de emisión: ${new Date().toLocaleString("es-ES")}`, {
        align: "center",
      });
      doc.text(`ID Membresía: #${membership.id}`, { align: "center" });
      doc.moveDown();
      doc.text("¡Gracias por su preferencia!", { align: "center" });

      doc.end();
    });
  } catch (error) {
    console.error("Error generando PDF de membresía:", error);
    throw error;
  }
}

module.exports = {
  generateOpeningPDF,
  generateClosingPDF,
  generateMembershipPDF,
};
