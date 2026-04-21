const { execSync } = require("child_process");
const os = require("os");
const { getSetting } = require("./api.cjs");

function getWindowsRawPrintScriptPath(app) {
  const fs = require("fs");
  const path = require("path");
  const printDir = path.join(app.getPath("userData"), "print_temp");
  if (!fs.existsSync(printDir)) fs.mkdirSync(printDir, { recursive: true });
  
  const scriptPath = path.join(printDir, "raw_print.ps1");
  if (!fs.existsSync(scriptPath)) {
    const scriptContent = `param([string]$printerName, [string]$filePath)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinterHelper {
    [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);
    [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
    [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDatatype;
    }
    public static bool SendBytesToPrinter(string szPrinterName, IntPtr pBytes, int dwCount) {
        IntPtr hPrinter = new IntPtr(0);
        DOCINFOA di = new DOCINFOA();
        bool bSuccess = false;
        di.pDocName = "SIPARK Document";
        di.pDatatype = "RAW";
        if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    int dwWritten = 0;
                    bSuccess = WritePrinter(hPrinter, pBytes, dwCount, out dwWritten);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return bSuccess;
    }
    public static bool SendFileToPrinter(string szPrinterName, string szFileName) {
        bool bSuccess = false;
        System.IO.FileStream fs = new System.IO.FileStream(szFileName, System.IO.FileMode.OpenOrCreate);
        System.IO.BinaryReader br = new System.IO.BinaryReader(fs);
        byte[] bytes = new byte[fs.Length];
        IntPtr pUnmanagedBytes = new IntPtr(0);
        int nLength = Convert.ToInt32(fs.Length);
        bytes = br.ReadBytes(nLength);
        pUnmanagedBytes = Marshal.AllocCoTaskMem(nLength);
        Marshal.Copy(bytes, 0, pUnmanagedBytes, nLength);
        bSuccess = SendBytesToPrinter(szPrinterName, pUnmanagedBytes, nLength);
        Marshal.FreeCoTaskMem(pUnmanagedBytes);
        fs.Close();
        return bSuccess;
    }
}
"@

$result = [RawPrinterHelper]::SendFileToPrinter($printerName, $filePath)
if (-not $result) {
    throw "Error sending raw bytes to printer $printerName"
}`;
    // Escribir y sobrescribir siempre para asegurar la última versión del script
    fs.writeFileSync(scriptPath, scriptContent, "utf-8");
  }
  return scriptPath;
}

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
      // Windows - usar Get-Printer en lugar de WMI
      const command =
        'Get-Printer | Where-Object {$_.Default -eq $true} | Select-Object -ExpandProperty Name';
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
    return null;
  }
}

/**
 * Imprime un ticket de prueba en la impresora especificada
 */
async function printTestTicket(printerName) {
  const fs = require("fs");
  const path = require("path");
  const { app } = require("electron");

  try {
    const platform = os.platform();

    // Cargar configuración de tickets
    let config;
    try {
      const configStr = await getSetting("ticket_config");
      config = configStr ? JSON.parse(configStr) : getDefaultTicketConfig();
    } catch (err) {
      config = getDefaultTicketConfig();
    }

    try {
      const primary = await getSetting("currency_primary");
      if (primary === "NIO") config.currencySymbol = "C$";
      else if (primary === "USD") config.currencySymbol = "$";
      else config.currencySymbol = "C$"; // Default to C$ if not set
    } catch {
      config.currencySymbol = "C$"; // Default to C$ on error
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

    // Usar el directorio de datos del usuario en lugar de tmp para mayor compatibilidad en macOS
    const printDir = path.join(app.getPath("userData"), "print_temp");
    if (!fs.existsSync(printDir)) fs.mkdirSync(printDir, { recursive: true });
    
    const tempFile = path.join(printDir, `test_ticket_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, ticketContent, "latin1");

    if (platform === "win32") {
      const scriptPath = getWindowsRawPrintScriptPath(app);
      const printCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -printerName "${printerName.replace(/"/g, '\\"')}" -filePath "${tempFile}"`;
      try {
        execSync(printCommand, { windowsHide: true });
      } catch (e) {
        console.error(`Error de impresión Windows: ${e.message}`);
        throw new Error(`Error al acceder a la impresora "${printerName}". Si es una impresora virtual, PDF o de demostración, puede no soportar impresión en segundo plano. (Detalle: ${e.message})`);
      }
    } else if (platform === "darwin" || platform === "linux") {
      // Usar la ruta absoluta a lp para evitar problemas de PATH
      const lpPath = "/usr/bin/lp";
      const printCommand = `"${lpPath}" -d "${printerName}" -o raw "${tempFile}"`;
      try {
        execSync(printCommand, { stdio: 'pipe' });
      } catch (e) {
        const errorMsg = e.stderr ? e.stderr.toString() : e.message;
        console.error(`Error de impresión lp: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    }

    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    return true;
  } catch (error) {
    console.error("Error en printTestTicket:", error);
    // Relanzar el error para que llegue al frontend si es posible (depende de cómo se llame)
    throw error;
  }
}

/**
 * Imprime texto simple en una impresora (para tickets térmicos)
 */
async function printTicket(printerName, content) {
  if (!printerName) return false;
  const fs = require("fs");
  const path = require("path");
  const { app } = require("electron");

  try {
    const platform = os.platform();

    const printDir = path.join(app.getPath("userData"), "print_temp");
    if (!fs.existsSync(printDir)) fs.mkdirSync(printDir, { recursive: true });

    const tempFile = path.join(printDir, `sipark_ticket_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, content, "latin1");

    if (platform === "win32") {
      const scriptPath = getWindowsRawPrintScriptPath(app);
      const printCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -printerName "${printerName.replace(/"/g, '\\"')}" -filePath "${tempFile}"`;
      try {
        execSync(printCommand, { windowsHide: true });
      } catch (e) {
        console.error(`Error de impresión Windows: ${e.message}`);
        throw new Error(`Error al acceder a la impresora "${printerName}". Si es una impresora virtual, PDF o de demostración, puede no soportar impresión en segundo plano. (Detalle: ${e.message})`);
      }
    } else if (platform === "darwin" || platform === "linux") {
      const lpPath = "/usr/bin/lp";
      // Intento 1: Con -o raw (para térmicas)
      try {
        execSync(`"${lpPath}" -d "${printerName}" -o raw "${tempFile}"`, { stdio: 'pipe' });
      } catch (e) {
        // Intento 2: Sin -o raw (para matriciales/estándar)
        console.warn("Fallo con -o raw, reintentando sin él...");
        try {
          execSync(`"${lpPath}" -d "${printerName}" "${tempFile}"`, { stdio: 'pipe' });
        } catch (e2) {
          const errorMsg = e2.stderr ? e2.stderr.toString() : e2.message;
          throw new Error(errorMsg);
        }
      }
    }

    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    return true;
  } catch (error) {
    console.error("Error en printTicket:", error);
    throw error;
  }
}

/**
 * Abre el cajón de dinero enviando la secuencia ESC/POS
 */
async function openCashDrawer(printerName) {
  if (!printerName) return false;
  const fs = require("fs");
  const path = require("path");
  const { app } = require("electron");

  try {
    const platform = os.platform();
    
    const drawerKick = Buffer.from([27, 112, 0, 25, 250]);
    
    const printDir = path.join(app.getPath("userData"), "print_temp");
    if (!fs.existsSync(printDir)) fs.mkdirSync(printDir, { recursive: true });

    const tempFile = path.join(printDir, "sipark_drawer_kick.bin");
    fs.writeFileSync(tempFile, drawerKick);

    if (platform === "win32") {
      const scriptPath = getWindowsRawPrintScriptPath(app);
      const printCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -printerName "${printerName.replace(/"/g, '\\"')}" -filePath "${tempFile}"`;
      try {
        execSync(printCommand, { windowsHide: true });
      } catch (e) {
        console.error(`Error de apertura de cajón Windows: ${e.message}`);
        // No lanzamos error para no interrumpir el flujo si solo falla el cajón
      }
    } else if (platform === "darwin" || platform === "linux") {
      const lpPath = "/usr/bin/lp";
      try {
        execSync(`"${lpPath}" -d "${printerName}" -o raw "${tempFile}"`, { stdio: 'pipe' });
      } catch (e) {
        const errorMsg = e.stderr ? e.stderr.toString() : e.message;
        throw new Error(errorMsg);
      }
    }

    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    return true;
  } catch (error) {
    console.error("Error en openCashDrawer:", error);
    throw error;
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
    paperWidth: 48,
    fontSize: "normal",
  };
}

/**
 * Genera el contenido del ticket basado en la configuración
 */
function generateTicketContent(config, saleData) {
  const INIT_SEQ = "\x1B\x40\x1C\x2E\x1B\x74\x10";
  const CUT_SEQ = "\x1D\x56\x00";
  const lines = [INIT_SEQ];
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
    const priceLine = `${config.currencySymbol || "$"}${item.subtotal.toFixed(2)}`;
    const spaces = width - itemLine.length - priceLine.length;
    lines.push(itemLine + " ".repeat(Math.max(1, spaces)) + priceLine);
  });

  lines.push("");
  lines.push(line);

  // Totales
  const addTotal = (label, amount) => {
    const amountStr = `${config.currencySymbol || "$"}${amount.toFixed(2)}`;
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

  lines.push("");
  lines.push("");
  lines.push(CUT_SEQ);

  return lines.join("\n");
}

/**
 * Imprime un archivo PDF en la impresora especificada
 */
async function printPDF(printerName, pdfPath) {
  if (!printerName || !pdfPath) return false;
  try {
    const platform = os.platform();
    
    if (platform === "win32") {
      const command = `Start-Process -FilePath "${pdfPath}" -Verb PrintTo -ArgumentList "${printerName}" -WindowStyle Hidden`;
      execSync(`powershell -Command "${command}"`);
    } else if (platform === "darwin" || platform === "linux") {
      const lpPath = "/usr/bin/lp";
      try {
        execSync(`"${lpPath}" -d "${printerName}" "${pdfPath}"`, { stdio: 'pipe' });
      } catch (e) {
        const errorMsg = e.stderr ? e.stderr.toString() : e.message;
        throw new Error(errorMsg);
      }
    }
    return true;
  } catch (error) {
    console.error("Error en printPDF:", error);
    throw error;
  }
}

/**
 * Imprime una página de prueba simple en una impresora normal (matricial/tinta/láser)
 */
async function printTestNormal(printerName) {
  if (!printerName) return false;
  const fs = require("fs");
  const path = require("path");
  const { app } = require("electron");

  try {
    const platform = os.platform();
    
    const INIT_SEQ = "\x1B\x40\x1C\x2E\x1B\x74\x10";
    const CUT_SEQ = "\x1D\x56\x00";

    const content = INIT_SEQ + `
================================================
           PRUEBA DE IMPRESIÓN SIPARK
================================================
Fecha: ${new Date().toLocaleString("es-ES")}
Impresora: ${printerName}
Estado: FUNCIONANDO CORRECTAMENTE

Este es un ticket de prueba para validar la
comunicación con la impresora matricial o
estándar configurada en el sistema.

             SOPORTE TÉCNICO SIPARK
================================================
\n\n\n\n` + CUT_SEQ;

    const printDir = path.join(app.getPath("userData"), "print_temp");
    if (!fs.existsSync(printDir)) fs.mkdirSync(printDir, { recursive: true });

    const tempFile = path.join(printDir, `test_normal_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, content, "latin1");

    if (platform === "win32") {
      const scriptPath = getWindowsRawPrintScriptPath(app);
      const printCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -printerName "${printerName.replace(/"/g, '\\"')}" -filePath "${tempFile}"`;
      try {
        execSync(printCommand, { windowsHide: true });
      } catch (e) {
        throw new Error(`Error al acceder a la impresora "${printerName}". Si es una impresora virtual, PDF o de demostración, puede no soportar impresión en segundo plano. (Detalle: ${e.message})`);
      }
    } else if (platform === "darwin" || platform === "linux") {
      const lpPath = "/usr/bin/lp";
      try {
        execSync(`"${lpPath}" -d "${printerName}" "${tempFile}"`, { stdio: 'pipe' });
      } catch (e) {
        const errorMsg = e.stderr ? e.stderr.toString() : e.message;
        throw new Error(errorMsg);
      }
    }

    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    return true;
  } catch (error) {
    console.error("Error en printTestNormal:", error);
    throw error;
  }
}

module.exports = {
  getPrinters,
  getDefaultPrinter,
  printTestTicket,
  printTicket,
  printPDF,
  printTestNormal,
  openCashDrawer,
  generateTicketContent,
  getDefaultTicketConfig,
};
