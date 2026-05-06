import { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  FileDown,
  Printer,
  Calendar,
  Search,
  RefreshCw,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import { usePrinter } from "../../hooks/usePrinter";

interface CashBoxReportProps {
  onBack: () => void;
}

// Helper: badge de tipo de venta
function SaleTypeBadge({ type }: { type: string }) {
  if (type === "membership") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
        🪪 Membresía
      </span>
    );
  }
  if (type === "package") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
        📦 Paquete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
      🛒 Producto
    </span>
  );
}

const getTypeName = (type: string) => {
  if (type === "membership") return "Membresía";
  if (type === "package") return "Paquete";
  return "Producto";
};

export function CashBoxReport({ onBack }: CashBoxReportProps) {
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [data, setData] = useState<any>(null);
  const [cashBoxes, setCashBoxes] = useState<any[]>([]);
  const [selectedCashBoxId, setSelectedCashBoxId] = useState<number | null>(
    null,
  );
  const [showSelector, setShowSelector] = useState(true);
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");

  // Filtros para búsqueda
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Últimos 7 días
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { formatCurrency } = useCurrency();
  const { error, success } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();
  const { printRawText } = usePrinter();

  const loadCashBoxes = async () => {
    try {
      setLoadingList(true);
      const boxes = (await window.api.getCashBoxes?.()) || [];

      // Filtrar por rango de fechas
      const filtered = boxes.filter((box: any) => {
        const date = new Date(box.opened_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const boxDate = `${year}-${month}-${day}`;

        return boxDate >= startDate && boxDate <= endDate;
      });

      filtered.sort((a: any, b: any) => {
        return (
          new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
        );
      });

      setCashBoxes(filtered);
    } catch (err) {
      error("Error cargando cajas");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCashBoxes();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadCashBoxes();
    }
  }, [startDate, endDate]);

  const loadReport = async (cashBoxId: number) => {
    try {
      setLoading(true);
      const result = await window.api.getCashBoxReport(cashBoxId);
      setData(result);
      setSelectedCashBoxId(cashBoxId);
      setShowSelector(false);
    } catch (err) {
      error("Error cargando reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelector = () => {
    setShowSelector(true);
    setData(null);
    setSelectedCashBoxId(null);
    setSaleTypeFilter("all");
  };

  const mapSales = (sales: any[]) =>
    sales.map((s: any) => ({
      ...s,
      sale_type: getTypeName(s.sale_type),
      payment_method:
        s.payment_method === "cash" ? "Efectivo"
        : s.payment_method === "card" ? "Tarjeta"
        : s.payment_method === "transfer" ? "Transferencia"
        : s.payment_method,
    }));

  const handleExportExcel = () => {
    if (!data) return;

    const filteredSales =
      saleTypeFilter === "all"
        ? data.sales
        : data.sales.filter((s: any) => s.sale_type === saleTypeFilter);

    exportToExcel({
      title: "Reporte de Caja",
      subtitle: `Caja #${data.cashBox.id} - ${new Date(data.cashBox.opened_at).toLocaleDateString("es-ES")}`,
      filename: `caja-${data.cashBox.id}`,
      columns: [
        { header: "ID Venta", key: "id", width: 10 },
        { header: "Hora", key: "timestamp", format: "datetime", width: 20 },
        { header: "Cliente", key: "client_name", width: 25 },
        { header: "Productos", key: "products", width: 40 },
        { header: "Tipo", key: "sale_type", width: 15 },
        { header: "Método", key: "payment_method", width: 15 },
        { header: "Total", key: "total", format: "currency", width: 15 },
      ],
      data: mapSales(filteredSales),
      summary: [
        { label: "Monto Inicial", value: data.cashBox.opening_amount },
        { label: "Ventas en Efectivo", value: data.totals.cashSales },
        { label: "Ingresos Adicionales", value: data.totals.incomeMovements },
        { label: "Gastos", value: data.totals.expenseMovements },
        { label: "Efectivo Esperado", value: data.totals.expectedCash },
        { label: "Efectivo Real", value: data.totals.actualCash },
        { label: "Diferencia", value: data.totals.difference },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    const filteredSales =
      saleTypeFilter === "all"
        ? data.sales
        : data.sales.filter((s: any) => s.sale_type === saleTypeFilter);

    exportToPDF({
      title: "Reporte de Caja",
      subtitle: `Caja #${data.cashBox.id} - ${new Date(data.cashBox.opened_at).toLocaleDateString("es-ES")}`,
      filename: `caja-${data.cashBox.id}`,
      columns: [
        { header: "ID", key: "id" },
        { header: "Hora", key: "timestamp", format: "datetime" },
        { header: "Cliente", key: "client_name" },
        { header: "Productos", key: "products" },
        { header: "Tipo", key: "sale_type" },
        { header: "Método", key: "payment_method" },
        { header: "Total", key: "total", format: "currency" },
      ],
      data: mapSales(filteredSales),
      summary: [
        { label: "Monto Inicial", value: data.cashBox.opening_amount },
        { label: "Efectivo Esperado", value: data.totals.expectedCash },
        { label: "Efectivo Real", value: data.totals.actualCash },
        { label: "Diferencia", value: data.totals.difference },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    const filteredSales =
      saleTypeFilter === "all"
        ? data.sales
        : data.sales.filter((s: any) => s.sale_type === saleTypeFilter);

    printReport({
      title: "Reporte de Caja",
      subtitle: `Caja #${data.cashBox.id} - ${new Date(data.cashBox.opened_at).toLocaleDateString("es-ES")}`,
      filename: `caja-${data.cashBox.id}`,
      columns: [
        { header: "ID", key: "id" },
        { header: "Hora", key: "timestamp", format: "datetime" },
        { header: "Cliente", key: "client_name" },
        { header: "Productos", key: "products" },
        { header: "Tipo", key: "sale_type" },
        { header: "Método", key: "payment_method" },
        { header: "Total", key: "total", format: "currency" },
      ],
      data: mapSales(filteredSales),
      summary: [
        { label: "Monto Inicial", value: data.cashBox.opening_amount },
        { label: "Ventas en Efectivo", value: data.totals.cashSales },
        { label: "Efectivo Esperado", value: data.totals.expectedCash },
        { label: "Efectivo Real", value: data.totals.actualCash },
        { label: "Diferencia", value: data.totals.difference },
      ],
    });
  };

  const handleReprintCloseTicket = async () => {
    if (!data || data.cashBox.status !== "closed") return;

    const cb = data.cashBox;
    const openedAt = new Date(cb.opened_at);
    const closedAt = cb.closed_at ? new Date(cb.closed_at) : new Date();

    const validSales = data.sales;
    const timeSales = validSales.filter((s: any) => s.sale_type === "package");
    const productSales = validSales.filter((s: any) => s.sale_type === "product");
    const membershipSales = validSales.filter((s: any) => s.sale_type === "membership");
    const mixedSales = validSales.filter(
      (s: any) => s.sale_type !== "package" && s.sale_type !== "product" && s.sale_type !== "membership"
    );

    const timeTotal = timeSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const productTotal = productSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const membershipTotal = membershipSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const mixedTotal = mixedSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);

    let ticketText = "\n";
    ticketText += "================================\n";
    ticketText += "   REIMPRESION CUADRE DE CAJA  \n";
    ticketText += "================================\n";
    ticketText += `Apertura: ${openedAt.toLocaleString("es-ES")}\n`;
    ticketText += `Cierre:   ${closedAt.toLocaleString("es-ES")}\n`;
    ticketText += `Cajero: ${cb.opened_by}\n`;
    ticketText += `ID Caja: #${cb.id}\n`;
    ticketText += "--------------------------------\n";
    ticketText += `(+) APERTURA:    ${formatCurrency(cb.opening_amount)}\n`;
    ticketText += `(+) VENTAS:      ${formatCurrency(data.totals.salesTotal)}\n`;
    if (timeTotal > 0) ticketText += `    - Entradas:  ${formatCurrency(timeTotal)}\n`;
    if (productTotal > 0) ticketText += `    - Productos: ${formatCurrency(productTotal)}\n`;
    if (membershipTotal > 0) ticketText += `    - Membres.:  ${formatCurrency(membershipTotal)}\n`;
    if (mixedTotal > 0) ticketText += `    - Otros:     ${formatCurrency(mixedTotal)}\n`;
    ticketText += `(-) GASTOS:     -${formatCurrency(data.totals.expenseMovements)}\n`;
    ticketText += "--------------------------------\n";
    ticketText += `Esperado:        ${formatCurrency(cb.expected_amount || data.totals.expectedCash)}\n`;
    ticketText += `Contado:         ${formatCurrency(cb.closing_amount)}\n`;
    ticketText += "--------------------------------\n";

    const diff = Number(cb.difference ?? 0);
    const diffSign = diff >= 0 ? "+" : "";
    ticketText += `Diferencia:      ${diffSign}${formatCurrency(diff)}\n`;
    if (Math.abs(diff) < 0.005) {
      ticketText += "(CUADRADO)\n";
    } else {
      ticketText += diff > 0 ? "(SOBRANTE)\n" : "(FALTANTE)\n";
    }

    ticketText += "================================\n";
    ticketText += `Ventas realizadas: ${validSales.length}\n`;
    ticketText += "================================\n";

    if (cb.notes) {
      ticketText += `Notas: ${cb.notes}\n`;
      ticketText += "================================\n";
    }

    ticketText += "\n";
    ticketText += "Firmas:\n\n";
    ticketText += `Cajero: ${cb.opened_by}\n`;
    ticketText += "_______________________\n\n";
    ticketText += "Supervisor:\n";
    ticketText += "_______________________\n\n\n";

    const printed = await printRawText(ticketText);
    if (printed) {
      success("Ticket de cierre reimpreso");
    } else {
      success("Ticket generado (verifique impresora)");
    }
  };

  const handleReprintClosePDF = async () => {
    if (!data || data.cashBox.status !== "closed") return;
    const cb = data.cashBox;
    try {
      await (window as any).api.generateClosingPDF({
        cashBoxId: cb.id,
        cashBoxData: { opened_at: cb.opened_at, opened_by: cb.opened_by },
        salesList: data.sales,
        openingAmount: cb.opening_amount,
        salesTotal: data.totals.salesTotal,
        expensesTotal: data.totals.expenseMovements,
        expectedAmount: cb.expected_amount || data.totals.expectedCash,
        closingAmount: cb.closing_amount,
        difference: cb.difference ?? data.totals.difference,
        notes: cb.notes || "",
      });
      success("PDF de cierre generado");
    } catch {
      error("Error generando PDF de cierre");
    }
  };

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  // Vista de selección de caja
  if (showSelector) {
    return (
      <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              ← Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">💰 Reporte de Caja</h1>
              <p className="text-sm text-gray-600">
                Selecciona una caja para ver su reporte detallado
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Cajas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button
                onClick={() => loadCashBoxes()}
                disabled={loadingList}
                className="flex-1"
              >
                {loadingList ? "Buscando..." : "Buscar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() - 7);
                  setStartDate(date.toISOString().split("T")[0]);
                  setEndDate(new Date().toISOString().split("T")[0]);
                }}
              >
                Últimos 7 días
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            Cajas Encontradas ({cashBoxes.length})
          </h3>

          {loadingList ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando cajas...</p>
            </div>
          ) : cashBoxes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No se encontraron cajas</p>
              <p className="text-sm mt-2">Intenta con otro rango de fechas</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Fecha Apertura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Abierta Por
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Monto Inicial
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cashBoxes.map((box) => (
                    <tr key={box.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold">
                        #{box.id}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(box.opened_at).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm">{box.opened_by}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(box.opening_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${box.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {box.status === "open" ? "Abierta" : "Cerrada"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" onClick={() => loadReport(box.id)}>
                          Ver Reporte
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Filtrado de ventas en memoria para la tabla de detalle
  const filteredSales = data
    ? saleTypeFilter === "all"
      ? data.sales
      : data.sales.filter((s: any) => s.sale_type === saleTypeFilter)
    : [];

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToSelector}>
            ← Cambiar Caja
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              💰 Reporte de Caja #{selectedCashBoxId}
            </h1>
            <p className="text-sm text-gray-600">
              {data &&
                new Date(data.cashBox.opened_at).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </p>
          </div>
        </div>
      </div>

      {data && data.cashBox.status === "closed" && (
        <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-blue-800">Reimprimir Cierre de Caja</p>
              <p className="text-sm text-blue-600">
                Cerrada el {data.cashBox.closed_at ? new Date(data.cashBox.closed_at).toLocaleString("es-ES") : "—"}
                {data.cashBox.closed_by ? ` por ${data.cashBox.closed_by}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReprintClosePDF}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                <Printer className="w-4 h-4" />
                PDF Cierre
              </Button>
              <Button
                onClick={handleReprintCloseTicket}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reimprimir Ticket
              </Button>
            </div>
          </div>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Información de Apertura
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Abierta por:</span>
                  <span className="font-semibold">
                    {data.cashBox.opened_by}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha/Hora:</span>
                  <span className="font-semibold">
                    {new Date(data.cashBox.opened_at).toLocaleString("es-ES")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Inicial:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(data.cashBox.opening_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${data.cashBox.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    {data.cashBox.status === "open" ? "Abierta" : "Cerrada"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-600" />
                Resumen de Caja
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Ventas:</span>
                  <span className="font-semibold">
                    {formatCurrency(data.totals.salesTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ventas en Efectivo:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(data.totals.cashSales)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ingresos:</span>
                  <span className="font-semibold text-green-600">
                    +{formatCurrency(data.totals.incomeMovements)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gastos:</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(data.totals.expenseMovements)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-sm text-blue-700 font-medium mb-1">
                Efectivo Esperado
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {formatCurrency(data.totals.expectedCash)}
              </p>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-sm text-green-700 font-medium mb-1">
                Efectivo Real
              </p>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(data.totals.actualCash)}
              </p>
            </Card>
            <Card
              className={`p-6 bg-gradient-to-br ${data.totals.difference === 0 ? "from-gray-50 to-gray-100" : data.totals.difference > 0 ? "from-green-50 to-green-100" : "from-red-50 to-red-100"}`}
            >
              <p
                className={`text-sm font-medium mb-1 ${data.totals.difference === 0 ? "text-gray-700" : data.totals.difference > 0 ? "text-green-700" : "text-red-700"}`}
              >
                Diferencia
              </p>
              <p
                className={`text-3xl font-bold ${data.totals.difference === 0 ? "text-gray-900" : data.totals.difference > 0 ? "text-green-900" : "text-red-900"}`}
              >
                {data.totals.difference > 0 ? "+" : ""}
                {formatCurrency(data.totals.difference)}
              </p>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              Ventas por Método de Pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.paymentSummary.map((method: any) => (
                <div
                  key={method.payment_method}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <p className="text-sm text-gray-600 capitalize mb-1">
                    {method.payment_method === "cash"
                      ? "Efectivo"
                      : method.payment_method === "card"
                        ? "Tarjeta"
                        : method.payment_method === "transfer"
                          ? "Transferencia"
                          : method.payment_method}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(method.total)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {method.count} transacciones
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-lg">Detalle de Ventas</h3>
                <select
                  value={saleTypeFilter}
                  onChange={(e) => setSaleTypeFilter(e.target.value)}
                  className="px-3 py-1 border rounded text-sm bg-white"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="product">🛒 Producto</option>
                  <option value="package">📦 Paquete</option>
                  <option value="membership">🪪 Membresía</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FileDown className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FileDown className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Productos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Método
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">#{sale.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(sale.timestamp).toLocaleTimeString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm">{sale.client_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {sale.products || (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SaleTypeBadge type={sale.sale_type || "product"} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {sale.payment_method === "cash"
                          ? "Efectivo"
                          : sale.payment_method === "card"
                            ? "Tarjeta"
                            : sale.payment_method === "transfer"
                              ? "Transferencia"
                              : sale.payment_method}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {data.movements.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                Movimientos de Efectivo
              </h3>
              <div className="space-y-2">
                {data.movements.map((movement: any) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      {movement.type === "income" ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{movement.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(movement.timestamp).toLocaleString("es-ES")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${movement.type === "income" ? "text-green-600" : "text-red-600"}`}
                    >
                      {movement.type === "income" ? "+" : "-"}
                      {formatCurrency(movement.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
