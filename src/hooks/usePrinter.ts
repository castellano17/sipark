import { useState, useEffect } from "react";

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
    // Verificar estado de impresoras cada 5 segundos
    const interval = setInterval(loadPrinters, 5000);
    return () => clearInterval(interval);
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
      console.error("Error al cargar impresoras:", error);
      setPrinterStatus("disconnected");
    } finally {
      setIsLoading(false);
    }
  };

  const printTestTicket = async (printerName: string) => {
    try {
      const result = await window.api.printTestTicket(printerName);
      return result;
    } catch (error) {
      console.error("Error al imprimir ticket de prueba:", error);
      return false;
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
      console.error("Error al abrir cajón de dinero:", error);
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
        console.warn("No hay impresora de tickets seleccionada");
        return false;
      }

      // Cargar configuración del ticket guardada por el usuario
      let config: any = null;
      try {
        const saved = await window.api.getSetting("ticket_config");
        if (saved) config = JSON.parse(saved);
      } catch { /* usa defaults si no hay config */ }

      const businessName  = config?.businessName  || "MI LUDOTECA";
      const businessAddress = config?.businessAddress || "";
      const businessPhone  = config?.businessPhone  || "";
      const width          = config?.paperWidth    || 40;
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

      let text = "\n";
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
        text += `  ${item.quantity} x $${Number(item.unit_price).toFixed(2)} = $${Number(item.subtotal).toFixed(2)}\n`;
      });

      text += dash + "\n";
      text += `Subtotal:        $${Number(ticketData.subtotal).toFixed(2)}\n`;
      if (ticketData.discount > 0) {
        text += `Descuento:      -$${Number(ticketData.discount).toFixed(2)}\n`;
      }
      text += `TOTAL:           $${Number(ticketData.total).toFixed(2)}\n`;
      text += dash + "\n";
      text += `Método: ${methodLabel}\n`;
      if (ticketData.amountReceived) {
        text += `Recibido:        $${Number(ticketData.amountReceived).toFixed(2)}\n`;
        text += `Cambio:          $${Number(ticketData.change || 0).toFixed(2)}\n`;
      }
      text += line + "\n";
      if (showThankYou) text += center(thankYouMsg) + "\n";
      if (footerMessage) text += center(footerMessage) + "\n";
      text += line + "\n\n\n";

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
          console.warn("Error al enviar a impresora, mostrando en consola:", err);
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
      console.error("Error al imprimir ticket:", error);
      return false;
    }
  };

  const printMembershipTicket = async (membership: any) => {
    try {
      if (!ticketPrinter) {
        console.warn("No hay impresora de tickets seleccionada");
        return false;
      }

      // Formatear ticket para impresora térmica
      let ticketText = "\n";
      ticketText += "================================\n";
      ticketText += "         SIPARK LUDOTECA        \n";
      ticketText += "================================\n";
      ticketText += `TICKET DE MEMBRESÍA\n`;
      ticketText += `Fecha: ${new Date().toLocaleString("es-ES")}\n`;
      ticketText += "--------------------------------\n";
      ticketText += `Cliente: ${membership.client_name}\n`;
      if (membership.phone) ticketText += `Tel: ${membership.phone}\n`;
      if (membership.id_card) ticketText += `Ced: ${membership.id_card}\n`;
      ticketText += "--------------------------------\n";
      ticketText += `Membresía: ${membership.membership_name}\n`;
      if (membership.total_hours) ticketText += `Horas: ${membership.total_hours}\n`;
      ticketText += `Inicio: ${new Date(membership.start_date).toLocaleDateString("es-ES")}\n`;
      ticketText += `Vence: ${new Date(membership.end_date).toLocaleDateString("es-ES")}\n`;
      ticketText += "--------------------------------\n";
      ticketText += `Método: ${(membership.payment_method || "EFECTIVO").toUpperCase()}\n`;
      ticketText += `TOTAL: ${new Intl.NumberFormat("es-NI", {
        style: "currency",
        currency: "NIO",
      }).format(membership.payment_amount)}\n`;
      ticketText += "================================\n";
      ticketText += "    ¡Gracias por su compra!    \n";
      ticketText += "================================\n\n\n";

      // Imprimir en impresora térmica

      try {
        await (window as any).api.printTicket(ticketPrinter, ticketText);
      } catch (err) {
        console.warn("Error al enviar a impresora, mostrando en consola:", err);
      }

      // Abrir el cajón al finalizar la membresía
      await openDrawer();

      return true;
    } catch (error) {
      console.error("Error al imprimir ticket:", error);
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
      console.error("Error al generar PDF de la factura:", error);
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
    printTicket,
    printMembershipTicket,
    printMembershipInvoice,
    loadPrinters,
  };
}
