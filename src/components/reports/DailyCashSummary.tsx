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

const getSaleTypeLabel = (type: string) => {
  if (type === 'membership') return '🪪 Memb';
  if (type === 'package') return '📦 Paq';
  return '🛒 Prod';
};

const getPaymentMethodLabel = (method: string) => {
  if (method === 'cash') return 'Efectivo';
  if (method === 'card') return 'Tarjeta';
  if (method === 'transfer') return 'Transferencia';
  return method;
};

export function DailyCashSummary({ onBack }: DailyCashSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const { formatCurrency } = useCurrency();
  const { error, success } = useNotification();
  const { ticketPrinter, printRawText } = usePrinter();

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
      if (!ticketPrinter) {
        error("No hay impresora seleccionada");
        return;
      }

      let text = "\n";
      text += "================================\n";
      text += "   RESUMEN DIARIO DE CAJA\n";
      text += "================================\n";
      text += `Fecha: ${new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES")}\n`;
      text += "--------------------------------\n\n";

      if (data.cashBox) {
        text += `Caja #${data.cashBox.id}\n`;
        text += `Apertura: ${formatCurrency(data.summary.openingAmount)}\n\n`;
      }

      text += "RESUMEN DE VENTAS\n";
      text += `Total Ventas: ${formatCurrency(data.sales.total)}\n`;
      text += `Cantidad: ${data.sales.count}\n\n`;

      text += "POR METODO DE PAGO:\n";
      data.sales.byMethod.forEach((method: any) => {
        text += `${getPaymentMethodLabel(method.payment_method)}: ${formatCurrency(method.total)}\n`;
      });

      if (data.sales.items && data.sales.items.length > 0) {
        text += "\nDETALLE DE VENTAS:\n";
        text += "------------------------------------------------\n";
        data.sales.items.forEach((sale: any) => {
          const id = `#${sale.id}`.padEnd(5);
          const type = (sale.sale_type === 'membership' ? 'Memb' : sale.sale_type === 'package' ? 'Paq ' : 'Prod').padEnd(5);
          const rawTotal = formatCurrency(sale.total);
          const totalStr = rawTotal.padStart(9);
          // 48 chars total: 5(id)+5(type)+products+9(total) = 19 + products → 29 chars for products
          const products = (sale.products || '-').substring(0, 29).padEnd(29);
          text += `${id}${type}${products}${totalStr}\n`;
        });
        text += "------------------------------------------------\n";
      }

      if (data.additionalIncome.total > 0) {
        text += "\nINGRESOS ADICIONALES\n";
        text += `Total: ${formatCurrency(data.additionalIncome.total)}\n`;
      }

      if (data.expenses.total > 0) {
        text += "\nGASTOS\n";
        text += `Total: ${formatCurrency(data.expenses.total)}\n`;
      }

      text += "\n================================\n";
      text += "TOTALES FINALES\n";
      text += "================================\n";
      text += `Efectivo Esperado: ${formatCurrency(data.summary.expectedCash)}\n`;
      text += `Ingreso Neto:     ${formatCurrency(data.summary.netIncome)}\n`;
      if (data.cashBox) {
        text += "--------------------------------\n";
        text += `Monto Inicial:    ${formatCurrency(data.cashBox.opening_amount)}\n`;
        if (data.cashBox.closing_amount != null) {
          text += `Monto Contado:    ${formatCurrency(data.cashBox.closing_amount)}\n`;
          const diff = Number(data.cashBox.difference ?? 0);
          if (Math.abs(diff) < 0.005) {
            text += "Diferencia:       CUADRADO\n";
          } else {
            text += `Diferencia:       ${diff > 0 ? "+" : ""}${formatCurrency(diff)} ${diff > 0 ? "(SOBRANTE)" : "(FALTANTE)"}\n`;
          }
        } else {
          text += "Estado:           Caja Abierta\n";
        }
      }
      text += "================================\n\n";
      text += `Generado: ${new Date().toLocaleString("es-ES")}\n`;
      text += "================================\n\n\n";

      await printRawText(text);
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
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={onBack} className="print:hidden">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📋 Resumen Diario de Caja</h2>
            <p className="text-sm text-gray-600">Corte de caja simplificado para imprimir</p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" /> Fecha
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })()}
            />
          </div>
          <Button onClick={loadReport} className="bg-blue-600 hover:bg-blue-700">Cargar</Button>
        </div>
      </Card>

      {data && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 print:hidden">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Imprimir Ticket
            </Button>
            <Button onClick={handleExportPDF} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <FileDown className="w-4 h-4" /> Guardar PDF
            </Button>
          </div>

          <div
            id="ticket-content"
            className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto print:shadow-none print:max-w-full"
            style={{ fontFamily: "monospace" }}
          >
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
              <h1 className="text-2xl font-bold mb-2">RESUMEN DIARIO DE CAJA</h1>
              <p className="text-lg">{new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              {data.cashBox && (
                <p className="text-sm text-gray-600 mt-2">Caja #{data.cashBox.id} - Abierta por: {data.cashBox.opened_by}</p>
              )}
            </div>

            <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
              <h2 className="text-xl font-bold mb-3">VENTAS DEL DÍA</h2>
              <div className="space-y-2">
                <div className="flex justify-between"><span>Total ({data.sales.count}):</span><span className="font-bold">{formatCurrency(data.sales.total)}</span></div>
                {data.sales.discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Descuentos:</span><span>-{formatCurrency(data.sales.discount)}</span></div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Por Método de Pago:</h3>
                <div className="space-y-1 text-sm">
                  {data.sales.byMethod.map((method: any) => (
                    <div key={method.payment_method} className="flex justify-between">
                      <span className="capitalize">{getPaymentMethodLabel(method.payment_method)} ({method.count}):</span>
                      <span>{formatCurrency(method.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {data.sales.items && data.sales.items.length > 0 && (
              <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <h2 className="text-xl font-bold mb-3">DETALLE DE VENTAS</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 pr-2">ID</th>
                        <th className="text-left py-1 pr-2">Tipo</th>
                        <th className="text-left py-1 pr-2">Productos</th>
                        <th className="text-right py-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.items.map((sale: any) => (
                        <tr key={sale.id} className="border-b border-dashed border-gray-200">
                          <td className="py-1 pr-2 whitespace-nowrap">#{sale.id}</td>
                          <td className="py-1 pr-2 whitespace-nowrap">{getSaleTypeLabel(sale.sale_type)}</td>
                          <td className="py-1 pr-2 text-xs text-gray-700">{sale.products || '-'}</td>
                          <td className="py-1 text-right whitespace-nowrap">{formatCurrency(sale.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(data.additionalIncome.total > 0 || data.expenses.total > 0) && (
              <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                {data.additionalIncome.total > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2">INGRESOS ADICIONALES</h3>
                    {data.additionalIncome.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm"><span>{item.description}</span><span>{formatCurrency(item.amount)}</span></div>
                    ))}
                  </div>
                )}
                {data.expenses.total > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">GASTOS</h3>
                    {data.expenses.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm"><span>{item.description}</span><span className="text-red-600">-{formatCurrency(item.amount)}</span></div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-100 p-4 rounded">
              <h2 className="text-xl font-bold mb-3 text-center tracking-widest">RESUMEN</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="whitespace-nowrap text-sm">Efectivo Esperado:</span>
                  <span className="font-bold whitespace-nowrap">{formatCurrency(data.summary.expectedCash)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t-2 border-gray-400 pt-3">
                  <span className="whitespace-nowrap font-bold text-base">Ingreso Neto del Día:</span>
                  <span className={`font-bold text-lg whitespace-nowrap ${data.summary.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(data.summary.netIncome)}
                  </span>
                </div>
                {data.cashBox && (
                  <>
                    <div className="flex items-center justify-between gap-4 border-t-2 border-gray-400 pt-3">
                      <span className="whitespace-nowrap text-sm">Monto Inicial de Caja:</span>
                      <span className="font-bold whitespace-nowrap">{formatCurrency(data.cashBox.opening_amount)}</span>
                    </div>
                    {data.cashBox.closing_amount != null && (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <span className="whitespace-nowrap text-sm">Monto Contado:</span>
                          <span className="font-bold whitespace-nowrap">{formatCurrency(data.cashBox.closing_amount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="whitespace-nowrap text-sm">Diferencia:</span>
                          {Math.abs(Number(data.cashBox.difference ?? 0)) < 0.005 ? (
                            <span className="font-bold text-green-600 whitespace-nowrap">CUADRADO ✓</span>
                          ) : (
                            <span className={`font-bold whitespace-nowrap ${Number(data.cashBox.difference) > 0 ? "text-green-600" : "text-red-600"}`}>
                              {Number(data.cashBox.difference) > 0 ? "+" : ""}
                              {formatCurrency(data.cashBox.difference)}
                              {Number(data.cashBox.difference) > 0 ? " (SOBRANTE)" : " (FALTANTE)"}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    {data.cashBox.status === "open" && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="whitespace-nowrap text-sm">Estado:</span>
                        <span className="font-bold text-green-600 whitespace-nowrap">Caja Abierta</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

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
