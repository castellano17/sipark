import { useState, useEffect } from "react";
import { Receipt, Printer, FileDown, Calendar, ArrowLeft } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { usePrinter } from "../../hooks/usePrinter";

interface DailyCashSummaryProps {
  onBack: () => void;
}

export function DailyCashSummary({ onBack }: DailyCashSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { formatCurrency } = useCurrency();
  const { error, success } = useNotification();
  const { selectedPrinter } = usePrinter();

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.getDailyCashSummary(
        selectedDate,
      );
      setData(result);
    } catch (err) {
      error("Error al cargar el resumen diario de caja");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      if (!selectedPrinter) {
        error("No hay impresora seleccionada");
        return;
      }

      // Generar texto para impresora térmica
      const ticketContent = document.getElementById("ticket-content");
      if (!ticketContent) {
        error("No se pudo encontrar el contenido");
        return;
      }

      // Extraer texto del contenido
      let ticketText = "\n";
      ticketText += "================================\n";
      ticketText += "   RESUMEN DIARIO DE CAJA\n";
      ticketText += "================================\n";
      ticketText += `Fecha: ${new Date(selectedDate).toLocaleDateString("es-ES")}\n`;
      ticketText += "--------------------------------\n\n";

      if (data.cashBox) {
        ticketText += `Caja #${data.cashBox.id}\n`;
        ticketText += `Apertura: ${formatCurrency(data.summary.openingAmount)}\n\n`;
      }

      ticketText += "VENTAS DEL DIA\n";
      ticketText += `Total Ventas: ${formatCurrency(data.sales.total)}\n`;
      ticketText += `Cantidad: ${data.sales.count}\n\n`;

      ticketText += "Por Metodo de Pago:\n";
      data.sales.byMethod.forEach((method: any) => {
        const methodName =
          method.payment_method === "cash"
            ? "Efectivo"
            : method.payment_method === "card"
              ? "Tarjeta"
              : method.payment_method === "transfer"
                ? "Transferencia"
                : method.payment_method;
        ticketText += `${methodName}: ${formatCurrency(method.total)}\n`;
      });

      if (data.additionalIncome.total > 0) {
        ticketText += "\nINGRESOS ADICIONALES\n";
        ticketText += `Total: ${formatCurrency(data.additionalIncome.total)}\n`;
      }

      if (data.expenses.total > 0) {
        ticketText += "\nGASTOS\n";
        ticketText += `Total: ${formatCurrency(data.expenses.total)}\n`;
      }

      ticketText += "\n================================\n";
      ticketText += "RESUMEN\n";
      ticketText += "================================\n";
      ticketText += `Efectivo Esperado:\n${formatCurrency(data.summary.expectedCash)}\n\n`;
      ticketText += `Ingreso Neto:\n${formatCurrency(data.summary.netIncome)}\n`;
      ticketText += "================================\n\n";
      ticketText += `Generado: ${new Date().toLocaleString("es-ES")}\n`;
      ticketText += "================================\n\n\n";

      // Enviar a impresora térmica...

      // TODO: Integrar con API de impresora cuando esté disponible
      // await window.api.printTicket(selectedPrinter, ticketText);

      success("Ticket enviado a impresora");
    } catch (err) {
      error("Error al imprimir");
    }
  };

  const handleExportPDF = async () => {
    try {
      await (window as any).api.generateDailyCashSummaryPDF({
        data,
        selectedDate
      });
      success("PDF generado exitosamente");
    } catch (err) {
      error("Error al generar PDF");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={onBack} className="print:hidden">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              📋 Resumen Diario de Caja
            </h2>
            <p className="text-sm text-gray-600">
              Corte de caja simplificado para imprimir
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <Button
            onClick={loadReport}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Cargar
          </Button>
        </div>
      </Card>

      {/* Ticket Content */}
      {data && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-2 mb-4 print:hidden">
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Ticket
            </Button>
            <Button
              onClick={handleExportPDF}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Guardar PDF
            </Button>
          </div>

          {/* Ticket Style Content */}
          <div
            id="ticket-content"
            className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto print:shadow-none print:max-w-full"
            style={{ fontFamily: "monospace" }}
          >
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
              <h1 className="text-2xl font-bold mb-2">
                RESUMEN DIARIO DE CAJA
              </h1>
              <p className="text-lg">
                {new Date(selectedDate).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {data.cashBox && (
                <p className="text-sm text-gray-600 mt-2">
                  Caja #{data.cashBox.id} - Abierta por:{" "}
                  {data.cashBox.opened_by}
                </p>
              )}
            </div>

            {/* Opening Amount */}
            {data.cashBox && (
              <div className="mb-4">
                <div className="flex justify-between text-lg">
                  <span>Monto de Apertura:</span>
                  <span className="font-bold">
                    {formatCurrency(data.summary.openingAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Sales Section */}
            <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
              <h2 className="text-xl font-bold mb-3">VENTAS DEL DÍA</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total de Ventas ({data.sales.count}):</span>
                  <span className="font-bold">
                    {formatCurrency(data.sales.total)}
                  </span>
                </div>
                {data.sales.discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(data.sales.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Descuentos:</span>
                      <span>-{formatCurrency(data.sales.discount)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* By Payment Method */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Por Método de Pago:</h3>
                <div className="space-y-1 text-sm">
                  {data.sales.byMethod.map((method: any) => (
                    <div
                      key={method.payment_method}
                      className="flex justify-between"
                    >
                      <span className="capitalize">
                        {method.payment_method === "cash"
                          ? "Efectivo"
                          : method.payment_method === "card"
                            ? "Tarjeta"
                            : method.payment_method === "transfer"
                              ? "Transferencia"
                              : method.payment_method}{" "}
                        ({method.count}):
                      </span>
                      <span>{formatCurrency(method.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Income */}
            {data.additionalIncome.total > 0 && (
              <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <h2 className="text-xl font-bold mb-3">INGRESOS ADICIONALES</h2>
                <div className="space-y-2">
                  {data.additionalIncome.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total Ingresos:</span>
                    <span>{formatCurrency(data.additionalIncome.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Expenses */}
            {data.expenses.total > 0 && (
              <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <h2 className="text-xl font-bold mb-3">GASTOS</h2>
                <div className="space-y-2">
                  {data.expenses.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span className="text-red-600">
                        -{formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total Gastos:</span>
                    <span className="text-red-600">
                      -{formatCurrency(data.expenses.total)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-100 p-4 rounded">
              <h2 className="text-xl font-bold mb-3">RESUMEN</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Efectivo Esperado:</span>
                  <span className="font-bold">
                    {formatCurrency(data.summary.expectedCash)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t-2 border-gray-400 pt-2">
                  <span>Ingreso Neto del Día:</span>
                  <span
                    className={
                      data.summary.netIncome >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatCurrency(data.summary.netIncome)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-gray-400 text-sm text-gray-600">
              <p>Generado el {new Date().toLocaleString("es-ES")}</p>
              <p className="mt-2">*** FIN DEL REPORTE ***</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
