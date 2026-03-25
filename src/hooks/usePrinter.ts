import { useState, useEffect } from "react";

/**
 * Convierte una imagen en base64 al formato ESC/POS rasterizado (GS v 0).
 * La imagen es escalada a max 384px de ancho (80mm / 203dpi), y convertida a 1-bit.
 */
async function logoToEscPos(base64: string, maxWidth = 384): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const ratio = Math.min(maxWidth / img.width, 1);
        const w = Math.floor(img.width * ratio);
        const h = Math.floor(img.height * ratio);
        const byteWidth = Math.ceil(w / 8);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);

        // ESC/POS GS v 0: \x1D\x76\x30 mode xL xH yL yH [data]
        const xL = byteWidth & 0xff;
        const xH = (byteWidth >> 8) & 0xff;
        const yL = h & 0xff;
        const yH = (h >> 8) & 0xff;
        let header = `\x1D\x76\x30\x00${String.fromCharCode(xL, xH, yL, yH)}`;

        let pixels = "";
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < byteWidth; col++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
              const x = col * 8 + bit;
              if (x < w) {
                const idx = (row * w + x) * 4;
                const r = imageData.data[idx];
                const g = imageData.data[idx + 1];
                const b = imageData.data[idx + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                if (lum < 128) byte |= (1 << (7 - bit));
              }
            }
            pixels += String.fromCharCode(byte);
          }
        }
        resolve(header + pixels + "\n");
      } catch {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = base64;
  });
}

interface Printer {
  name: string;
  displayName: string;
  isDefault?: boolean;
}

export function usePrinter() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState<Printer | null>(null);
  const [ticketPrinter, setTicketPrinter] = useState<string>("");
  const [normalPrinter, setNormalPrinter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [printerStatus, setPrinterStatus] = useState<
    "connected" | "disconnected"
  >("disconnected");

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      setIsLoading(true);
      const printersList = await window.api.getPrinters();
      setPrinters(printersList);

      const defaultPrinterData = await window.api.getDefaultPrinter();
      setDefaultPrinter(defaultPrinterData);

      const tp = await window.api.getSetting("ticket_printer");
      const np = await window.api.getSetting("normal_printer");

      if (tp) setTicketPrinter(tp);
      else if (defaultPrinterData) setTicketPrinter(defaultPrinterData.name);
      else if (printersList.length > 0) setTicketPrinter(printersList[0].name);

      if (np) setNormalPrinter(np);
      else if (defaultPrinterData) setNormalPrinter(defaultPrinterData.name);
      else if (printersList.length > 0) setNormalPrinter(printersList[0].name);

      if (printersList.length > 0) {
        setPrinterStatus("connected");
      } else {
        setPrinterStatus("disconnected");
      }
    } catch (error) {
      setPrinterStatus("disconnected");
    } finally {
      setIsLoading(false);
    }
  };

  const printTestTicket = async (printerName: string) => {
    try {
      const result = await window.api.printTestTicket(printerName);
      return result;
    } catch (error: any) {
      console.error("Error en printTestTicket:", error);
      throw error;
    }
  };

  const printTestNormal = async (printerName: string) => {
    try {
      const result = await (window as any).api.printTestNormal(printerName);
      return result;
    } catch (error: any) {
      console.error("Error en printTestNormal:", error);
      throw error;
    }
  };

  const openDrawer = async (reason = "Apertura por venta/operación") => {
    try {
      if (!ticketPrinter) return false;
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      const userId = currentUser.id || 1;

      return await (window as any).api.openCashDrawer({
        printerName: ticketPrinter,
        userId,
        reason,
      });
    } catch (error) {
      return false;
    }
  };

  const printTicket = async (ticketData: {
    saleId: number;
    clientName?: string;
    cashierName?: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    amountReceived?: number;
    change?: number;
  }) => {
    try {
      if (!ticketPrinter) {
        return false;
      }

      let config: any = null;
      let currencySymbol = "C$";
      try {
        const saved = await window.api.getSetting("ticket_config");
        if (saved) config = JSON.parse(saved);
        
        const primary = await window.api.getSetting("currency_primary");
        if (primary === "USD") currencySymbol = "$";
        else if (primary === "NIO") currencySymbol = "C$";
      } catch { /* usa defaults si no hay config */ }

      const businessName  = config?.businessName  || "MI LUDOTECA";
      const businessAddress = config?.businessAddress || "";
      const businessPhone  = config?.businessPhone  || "";
      const width          = config?.paperWidth    || 48;
      const headerMessage  = config?.headerMessage  || "";
      const footerMessage  = config?.footerMessage  || "¡Vuelve pronto!";
      const thankYouMsg    = config?.thankYouMessage || "¡Gracias por su compra!";

      const showBusinessName = config?.showBusinessName ?? true;
      const showAddress      = config?.showAddress      ?? true;
      const showPhone        = config?.showPhone        ?? true;
      const showTicketNumber = config?.showTicketNumber ?? true;
      const showDateTime     = config?.showDateTime     ?? true;
      const showCashier      = config?.showCashier      ?? true;
      const showThankYou     = config?.showThankYouMessage ?? true;
      const showLogo         = config?.showLogo ?? true;

      // Cargar logo del ticket como ESC/POS rasterizado
      let logoEscPos = "";
      if (showLogo) {
        try {
          const base64Logo = await (window as any).api.getLogo("ticket");
          if (base64Logo) {
            logoEscPos = await logoToEscPos(base64Logo, 384);
          }
        } catch {}
      }

      const line = "=".repeat(width);
      const dash = "-".repeat(width);
      const center = (text: string) => {
        const pad = Math.max(0, Math.floor((width - text.length) / 2));
        return " ".repeat(pad) + text;
      };

      const paymentMethodMap: Record<string, string> = {
        cash: "EFECTIVO",
        card: "TARJETA",
        transfer: "TRANSFERENCIA",
      };
      const methodLabel = paymentMethodMap[ticketData.paymentMethod] || ticketData.paymentMethod.toUpperCase();

      const INIT_SEQ = "\x1B\x40\x1C\x2E\x1B\x74\x10";
      const CUT_SEQ = "\x1D\x56\x00";

      let text = INIT_SEQ + "\n";
      if (logoEscPos) text += logoEscPos;
      text += line + "\n";
      if (showBusinessName) text += center(businessName.toUpperCase()) + "\n";
      if (showAddress && businessAddress) text += center(businessAddress) + "\n";
      if (showPhone && businessPhone) text += center(`Tel: ${businessPhone}`) + "\n";
      if (headerMessage) text += center(headerMessage) + "\n";
      text += line + "\n";
      if (showTicketNumber) text += `Ticket #${ticketData.saleId}\n`;
      if (showDateTime) text += `Fecha: ${new Date().toLocaleString("es-ES")}\n`;
      if (showCashier && ticketData.cashierName) text += `Cajero: ${ticketData.cashierName}\n`;
      if (ticketData.clientName) text += `Cliente: ${ticketData.clientName}\n`;
      text += dash + "\n";

      // Items
      ticketData.items.forEach((item) => {
        text += `${item.product_name}\n`;
        text += `  ${item.quantity} x ${currencySymbol}${Number(item.unit_price).toFixed(2)} = ${currencySymbol}${Number(item.subtotal).toFixed(2)}\n`;
      });

      text += dash + "\n";
      text += `Subtotal:        ${currencySymbol}${Number(ticketData.subtotal).toFixed(2)}\n`;
      if (ticketData.discount > 0) {
        text += `Descuento:      -${currencySymbol}${Number(ticketData.discount).toFixed(2)}\n`;
      }
      text += `TOTAL:           ${currencySymbol}${Number(ticketData.total).toFixed(2)}\n`;
      text += dash + "\n";
      text += `Método: ${methodLabel}\n`;
      if (ticketData.paymentMethod.toLowerCase() === 'cash' || ticketData.paymentMethod.toLowerCase() === 'efectivo') {
        const received = ticketData.amountReceived !== undefined && !isNaN(ticketData.amountReceived) ? ticketData.amountReceived : ticketData.total;
        const changeAmount = ticketData.change !== undefined && !isNaN(ticketData.change) ? ticketData.change : 0;
        text += `Recibido:        ${currencySymbol}${Number(received).toFixed(2)}\n`;
        text += `Cambio:          ${currencySymbol}${Number(changeAmount).toFixed(2)}\n`;
      } else if (ticketData.amountReceived !== undefined && !isNaN(ticketData.amountReceived)) {
        text += `Recibido:        ${currencySymbol}${Number(ticketData.amountReceived).toFixed(2)}\n`;
        text += `Cambio:          ${currencySymbol}${Number(ticketData.change || 0).toFixed(2)}\n`;
      }
      text += line + "\n";
      if (showThankYou) text += center(thankYouMsg) + "\n";
      if (footerMessage) text += center(footerMessage) + "\n";
      text += line + "\n\n\n";

      // ESC/POS Barcode (Code 39)
      const saleIdStr = String(ticketData.saleId);
      text += "\x1D\x68\x50"; // Height 80
      text += "\x1D\x77\x03"; // Width 3
      text += "\x1D\x48\x02"; // HRI character below
      text += `\x1D\x6B\x04${saleIdStr}\x00`; // Code 39
      text += "\n\n\n\n\n\n";

      text += CUT_SEQ;

      // Verificar modo impresión
      let printerMode = "test";
      try {
        printerMode = (await window.api.getSetting("printer_mode")) || "test";
      } catch { /* default test */ }

      if (printerMode === "real") {
        // Modo real: enviar a impresora física
        try {
          await (window as any).api.printTicket(ticketPrinter, text);
        } catch (err) {
        }
      } else {
        // Modo prueba: solo consola
      }

      // Abrir cajón si está en modo real
      if (printerMode === "real") {
        await openDrawer();
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  const printMembershipTicket = async (membership: any) => {
    try {
      if (!ticketPrinter) {
        return false;
      }

      let currencySymbol = "C$";
      try {
        const primary = await window.api.getSetting("currency_primary");
        if (primary === "USD") currencySymbol = "$";
        else if (primary === "NIO") currencySymbol = "C$";
      } catch {}

      const INIT_SEQ = "\x1B\x40\x1C\x2E\x1B\x74\x10";
      const CUT_SEQ = "\x1D\x56\x00";

      const width = 48;
      const line = "=".repeat(width);
      const dash = "-".repeat(width);
      const center = (text: string) => {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return " ".repeat(padding) + text;
      };

      // Formatear ticket para impresora térmica
      let ticketText = INIT_SEQ + "\n";
      ticketText += line + "\n";
      ticketText += center("SIPARK LUDOTECA") + "\n";
      ticketText += line + "\n";
      ticketText += `TICKET DE MEMBRESÍA\n`;
      ticketText += `Fecha: ${new Date().toLocaleString("es-ES")}\n`;
      ticketText += dash + "\n";
      ticketText += `Cliente: ${membership.client_name}\n`;
      if (membership.phone) ticketText += `Tel: ${membership.phone}\n`;
      if (membership.id_card) ticketText += `Ced: ${membership.id_card}\n`;
      ticketText += dash + "\n";
      ticketText += `Membresía: ${membership.membership_name}\n`;
      if (membership.total_hours) ticketText += `Horas: ${membership.total_hours}\n`;
      ticketText += `Inicio: ${new Date(membership.start_date).toLocaleDateString("es-ES")}\n`;
      ticketText += `Vence: ${new Date(membership.end_date).toLocaleDateString("es-ES")}\n`;
      ticketText += dash + "\n";
      const paymentMethodMap: Record<string, string> = {
        cash: "EFECTIVO",
        card: "TARJETA",
        transfer: "TRANSFERENCIA",
      };
      const methodLabel = paymentMethodMap[membership.payment_method] || (membership.payment_method || "EFECTIVO").toUpperCase();

      ticketText += `Método: ${methodLabel}\n`;
      ticketText += `TOTAL: ${currencySymbol}${Number(membership.payment_amount).toFixed(2)}\n`;
      ticketText += line + "\n";
      ticketText += center("¡Gracias por su compra!") + "\n";
      ticketText += line + "\n\n\n\n";
      ticketText += CUT_SEQ;
      // Imprimir en impresora térmica

      try {
        await (window as any).api.printTicket(ticketPrinter, ticketText);
      } catch (err) {
      }

      // Abrir el cajón al finalizar la membresía
      await openDrawer();

      return true;
    } catch (error) {
      return false;
    }
  };

  const printMembershipInvoice = async (membership: any) => {
    try {
      // Generar PDF de la factura de membresía
      const pdfData = {
        type: "membership_invoice",
        membership: {
          id: membership.id,
          client_name: membership.client_name,
          membership_name: membership.membership_name,
          start_date: membership.start_date,
          end_date: membership.end_date,
          payment_amount: membership.payment_amount,
          payment_method: membership.payment_method,
          notes: membership.notes,
          phone: membership.phone,
          id_card: membership.id_card,
          total_hours: membership.total_hours,
          acquisition_date: membership.acquisition_date,
        },
      };

      await (window as any).api.generateMembershipPDF(pdfData);
      return true;
    } catch (error: any) {
      throw error; // Re-lanzar para que el modal/botón maneje el error
    }
  };

  return {
    printers,
    defaultPrinter,
    ticketPrinter,
    normalPrinter,
    setTicketPrinter,
    setNormalPrinter,
    isLoading,
    printerStatus,
    openDrawer,
    printTestTicket,
    printTestNormal,
    printTicket,
    printMembershipTicket,
    printMembershipInvoice,
    loadPrinters,
  };
}
