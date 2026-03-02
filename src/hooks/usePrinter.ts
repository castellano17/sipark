import { useState, useEffect } from "react";

interface Printer {
  name: string;
  displayName: string;
  isDefault?: boolean;
}

export function usePrinter() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState<Printer | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
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

      if (defaultPrinterData) {
        setSelectedPrinter(defaultPrinterData.name);
        setPrinterStatus("connected");
      } else if (printersList.length > 0) {
        setSelectedPrinter(printersList[0].name);
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

  const printTicket = async (ticketData: {
    saleId: number;
    clientName?: string;
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
      if (!selectedPrinter) {
        console.warn("No hay impresora seleccionada");
        return false;
      }

      // Formatear ticket
      let ticketText = "\n";
      ticketText += "================================\n";
      ticketText += "         SIPARK LUDOTECA        \n";
      ticketText += "================================\n";
      ticketText += `Ticket #${ticketData.saleId}\n`;
      ticketText += `Fecha: ${new Date().toLocaleString("es-ES")}\n`;
      if (ticketData.clientName) {
        ticketText += `Cliente: ${ticketData.clientName}\n`;
      }
      ticketText += "--------------------------------\n";

      // Items
      ticketData.items.forEach((item) => {
        ticketText += `${item.product_name}\n`;
        ticketText += `  ${item.quantity} x $${item.unit_price.toFixed(2)} = $${item.subtotal.toFixed(2)}\n`;
      });

      ticketText += "--------------------------------\n";
      ticketText += `Subtotal:        $${ticketData.subtotal.toFixed(2)}\n`;
      if (ticketData.discount > 0) {
        ticketText += `Descuento:      -$${ticketData.discount.toFixed(2)}\n`;
      }
      ticketText += `TOTAL:           $${ticketData.total.toFixed(2)}\n`;
      ticketText += "--------------------------------\n";
      ticketText += `Método: ${ticketData.paymentMethod.toUpperCase()}\n`;
      if (ticketData.amountReceived) {
        ticketText += `Recibido:        $${ticketData.amountReceived.toFixed(2)}\n`;
        ticketText += `Cambio:          $${(ticketData.change || 0).toFixed(2)}\n`;
      }
      ticketText += "================================\n";
      ticketText += "    ¡Gracias por su compra!    \n";
      ticketText += "================================\n\n\n";

      // Imprimir (por ahora solo log, luego integrar con API de impresora)
      console.log("Imprimiendo ticket:", ticketText);

      // TODO: Integrar con window.api.printTicket cuando esté disponible
      // const result = await window.api.printTicket(selectedPrinter, ticketText);

      return true;
    } catch (error) {
      console.error("Error al imprimir ticket:", error);
      return false;
    }
  };

  const printMembershipTicket = async (membership: any) => {
    try {
      if (!selectedPrinter) {
        console.warn("No hay impresora seleccionada");
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
      ticketText += "--------------------------------\n";
      ticketText += `Membresía: ${membership.membership_name}\n`;
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
      console.log("Imprimiendo ticket en impresora térmica:", ticketText);

      // TODO: Integrar con window.api.printTicket cuando esté disponible
      // await window.api.printTicket(selectedPrinter, ticketText);

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
        },
      };

      await window.api.generateMembershipPDF(pdfData);
      return true;
    } catch (error) {
      console.error("Error al generar PDF de la factura:", error);
      return false;
    }
  };

  return {
    printers,
    defaultPrinter,
    selectedPrinter,
    setSelectedPrinter,
    isLoading,
    printerStatus,
    printTestTicket,
    printTicket,
    printMembershipTicket,
    printMembershipInvoice,
    loadPrinters,
  };
}
