const { execSync } = require("child_process");
const os = require("os");
const { getSetting } = require("./api.cjs");

/**
 * Obtiene la lista de impresoras disponibles en el sistema
 */
function getPrinters() {
  try {
    const platform = os.platform();

    if (platform === "win32") {
      // Windows: usar PowerShell
      const command =
        "Get-Printer | Select-Object -Property Name | ConvertTo-Json";
      const result = execSync(`powershell -Command "${command}"`, {
        encoding: "utf-8",
      });

      const printers = JSON.parse(result);
      const printerList = Array.isArray(printers) ? printers : [printers];

      return printerList.map((p) => ({
        name: p.Name,
        displayName: p.Name,
        isDefault: false,
      }));
    } else if (platform === "darwin" || platform === "linux") {
      // macOS y Linux: usar lpstat
      const result = execSync("lpstat -p -d", { encoding: "utf-8" });
      const lines = result.split("\n").filter((line) => line.trim());

      const printers = lines
        .map((line) => {
          const match = line.match(/(?:printer|impresora)\s+(\S+)/i);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      return printers.map((name) => ({
        name,
        displayName: name,
        isDefault: false,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error al obtener impresoras:", error.message);
    return [];
  }
}

/**
 * Obtiene la impresora predeterminada del sistema
 */
function getDefaultPrinter() {
  try {
    const platform = os.platform();

    if (platform === "win32") {
      // Windows
      const command =
        '(Get-WmiObject -Query "Select * from Win32_Printer Where Default=$true").Name';
      const result = execSync(`powershell -Command "${command}"`, {
        encoding: "utf-8",
      }).trim();

      if (result) {
        return {
          name: result,
          displayName: result,
          isDefault: true,
        };
      }
    } else if (platform === "darwin" || platform === "linux") {
      // macOS y Linux
      const result = execSync("lpstat -d", { encoding: "utf-8" }).trim();
      const match = result.match(/:\s*(.+)/);

      if (match) {
        const name = match[1].trim();
        return {
          name,
          displayName: name,
          isDefault: true,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error al obtener impresora predeterminada:", error.message);
    return null;
  }
}

/**
 * Imprime un ticket de prueba en la impresora especificada
 */
async function printTestTicket(printerName) {
  try {
    const platform = os.platform();
    const fs = require("fs");
    const path = require("path");

    // Cargar configuración de tickets
    let config;
    try {
      const configStr = await getSetting("ticket_config");
      config = configStr ? JSON.parse(configStr) : getDefaultTicketConfig();
    } catch (err) {
      config = getDefaultTicketConfig();
    }

    const ticketContent = generateTicketContent(config, {
      ticketNumber: "00123",
      date: new Date().toLocaleDateString("es-ES"),
      time: new Date().toLocaleTimeString("es-ES"),
      cashier: "Admin",
      items: [
        {
          name: "Paquete Básico",
          quantity: 1,
          price: 3500.0,
          subtotal: 3500.0,
        },
        { name: "Coca Cola 600ml", quantity: 2, price: 25.0, subtotal: 50.0 },
      ],
      subtotal: 3550.0,
      discount: 0,
      total: 3550.0,
      payment: 4000.0,
      change: 450.0,
      paymentMethod: "Efectivo",
    });

    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, "sipark_test_ticket.txt");

    fs.writeFileSync(tempFile, ticketContent, "utf-8");

    if (platform === "win32") {
      // Windows
      const printCommand = `powershell -Command "Print-Document -FilePath '${tempFile}' -PrinterName '${printerName}'"`;
      execSync(printCommand);
    } else if (platform === "darwin" || platform === "linux") {
      // macOS y Linux
      const printCommand = `lp -d ${printerName} "${tempFile}"`;
      execSync(printCommand);
    }

    // Limpiar archivo temporal
    fs.unlinkSync(tempFile);

    return true;
  } catch (error) {
    console.error("Error al imprimir ticket:", error.message);
    return false;
  }
}

/**
 * Abre el cajón de dinero enviando la secuencia ESC/POS
 */
async function openCashDrawer(printerName) {
  if (!printerName) return false;
  try {
    const platform = os.platform();
    const fs = require("fs");
    const path = require("path");
    
    // Secuencia típica ESC/POS para abrir cajón (ESC p m t1 t2)
    // 27 112 0 25 250 (0x1B 0x70 0x00 0x19 0xFA)
    const drawerKick = Buffer.from([27, 112, 0, 25, 250]);
    
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, "sipark_drawer_kick.bin");
    
    fs.writeFileSync(tempFile, drawerKick);

    if (platform === "win32") {
      // Windows
      const printCommand = `powershell -Command "Print-Document -FilePath '${tempFile}' -PrinterName '${printerName}'"`;
      execSync(printCommand);
    } else if (platform === "darwin" || platform === "linux") {
      // macOS y Linux
      const printCommand = `lp -d ${printerName} -o raw "${tempFile}"`;
      execSync(printCommand);
    }

    // Limpiar archivo temporal
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    return true;
  } catch (error) {
    console.error("Error al abrir cajón:", error.message);
    return false;
  }
}

/**
 * Configuración por defecto de tickets
 */
function getDefaultTicketConfig() {
  return {
    businessName: "MI LUDOTECA",
    businessAddress: "Calle Principal #123, Ciudad",
    businessPhone: "+1 234 567 8900",
    businessWebsite: "www.miludoteca.com",
    businessEmail: "info@miludoteca.com",
    taxId: "RFC: ABC123456XYZ",
    showLogo: true,
    showBusinessName: true,
    showAddress: true,
    showPhone: true,
    showWebsite: false,
    showEmail: false,
    showTaxId: true,
    showCashier: true,
    showDateTime: true,
    showTicketNumber: true,
    showThankYouMessage: true,
    headerMessage: "",
    footerMessage: "¡Vuelve pronto!",
    thankYouMessage: "Gracias por tu visita",
    paperWidth: 40,
    fontSize: "normal",
  };
}

/**
 * Genera el contenido del ticket basado en la configuración
 */
function generateTicketContent(config, saleData) {
  const lines = [];
  const width = config.paperWidth;

  const center = (text) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  const line = "=".repeat(width);
  const padRight = (text, total) => {
    return text + " ".repeat(Math.max(0, total - text.length));
  };

  lines.push(line);

  // Logo
  if (config.showLogo) {
    lines.push(center("🎮 🎨 🎪"));
    lines.push("");
  }

  // Nombre del negocio
  if (config.showBusinessName) {
    lines.push(center(config.businessName.toUpperCase()));
    lines.push("");
  }

  // Información de contacto
  if (config.showAddress) {
    lines.push(center(config.businessAddress));
  }
  if (config.showPhone) {
    lines.push(center(`Tel: ${config.businessPhone}`));
  }
  if (config.showWebsite) {
    lines.push(center(config.businessWebsite));
  }
  if (config.showEmail) {
    lines.push(center(config.businessEmail));
  }
  if (config.showTaxId) {
    lines.push(center(config.taxId));
  }

  lines.push(line);

  // Mensaje de encabezado
  if (config.headerMessage) {
    lines.push(center(config.headerMessage));
    lines.push("");
  }

  // Información del ticket
  if (config.showTicketNumber) {
    lines.push(`Ticket: #${saleData.ticketNumber}`);
  }
  if (config.showDateTime) {
    lines.push(`Fecha: ${saleData.date}`);
    lines.push(`Hora: ${saleData.time}`);
  }
  if (config.showCashier) {
    lines.push(`Cajero: ${saleData.cashier}`);
  }

  lines.push("");
  lines.push(line);
  lines.push("DETALLE DE VENTA");
  lines.push(line);
  lines.push("");

  // Items
  saleData.items.forEach((item) => {
    const itemLine = `${item.quantity}x ${item.name}`;
    const priceLine = `$${item.subtotal.toFixed(2)}`;
    const spaces = width - itemLine.length - priceLine.length;
    lines.push(itemLine + " ".repeat(Math.max(1, spaces)) + priceLine);
  });

  lines.push("");
  lines.push(line);

  // Totales
  const addTotal = (label, amount) => {
    const amountStr = `$${amount.toFixed(2)}`;
    const spaces = width - label.length - amountStr.length;
    lines.push(label + " ".repeat(Math.max(1, spaces)) + amountStr);
  };

  addTotal("Subtotal:", saleData.subtotal);
  if (saleData.discount > 0) {
    addTotal("Descuento:", saleData.discount);
  }
  addTotal("TOTAL:", saleData.total);

  lines.push(line);
  lines.push("");

  // Pago
  addTotal(`Pago (${saleData.paymentMethod}):`, saleData.payment);
  if (saleData.change > 0) {
    addTotal("Cambio:", saleData.change);
  }

  lines.push("");

  // Mensaje de agradecimiento
  if (config.showThankYouMessage && config.thankYouMessage) {
    lines.push(line);
    lines.push(center(config.thankYouMessage));
  }

  // Mensaje de pie
  if (config.footerMessage) {
    lines.push(center(config.footerMessage));
  }

  lines.push(line);
  lines.push("");
  lines.push("");

  return lines.join("\n");
}

module.exports = {
  getPrinters,
  getDefaultPrinter,
  printTestTicket,
  openCashDrawer,
  generateTicketContent,
  getDefaultTicketConfig,
};
