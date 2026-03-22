import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  FileDown,
  Printer,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SalesByPeriodProps {
  onBack: () => void;
}

export function SalesByPeriod({ onBack }: SalesByPeriodProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { formatCurrency } = useCurrency();
  const { error, success } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  // Filtros
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primer día del mes
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [paymentMethod, setPaymentMethod] = useState("all");

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await window.api.getSalesByPeriod(
        startDate,
        endDate,
        paymentMethod,
      );
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  };

  const handleExportExcel = () => {
    if (!data) return;

    exportToExcel({
      title: "Reporte de Ventas por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Fecha", key: "timestamp", format: "datetime", width: 20 },
        { header: "Cliente", key: "client_name", width: 25 },
        { header: "Método", key: "payment_method", width: 15 },
        { header: "Subtotal", key: "subtotal", format: "currency", width: 15 },
        { header: "Descuento", key: "discount", format: "currency", width: 15 },
        { header: "Total", key: "total", format: "currency", width: 15 },
      ],
      data: data.sales,
      summary: [
        { label: "Total Ventas", value: data.summary.total_revenue },
        { label: "Total Transacciones", value: data.summary.total_sales },
        { label: "Ticket Promedio", value: data.summary.average_ticket },
        { label: "Total Descuentos", value: data.summary.total_discount },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Ventas por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id" },
        { header: "Fecha", key: "timestamp", format: "datetime" },
        { header: "Cliente", key: "client_name" },
        { header: "Método", key: "payment_method" },
        { header: "Total", key: "total", format: "currency" },
      ],
      data: data.sales,
      summary: [
        { label: "Total Ventas", value: data.summary.total_revenue },
        { label: "Total Transacciones", value: data.summary.total_sales },
        { label: "Ticket Promedio", value: data.summary.average_ticket },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Ventas por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id" },
        { header: "Fecha", key: "timestamp", format: "datetime" },
        { header: "Cliente", key: "client_name" },
        { header: "Método", key: "payment_method" },
        { header: "Subtotal", key: "subtotal", format: "currency" },
        { header: "Descuento", key: "discount", format: "currency" },
        { header: "Total", key: "total", format: "currency" },
      ],
      data: data.sales,
      summary: [
        { label: "Total Ventas", value: data.summary.total_revenue },
        { label: "Total Transacciones", value: data.summary.total_sales },
        { label: "Ticket Promedio", value: data.summary.average_ticket },
        { label: "Total Descuentos", value: data.summary.total_discount },
      ],
    });
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

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

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📊 Ventas por Período</h1>
            <p className="text-sm text-gray-600">
              Análisis detallado de ventas por rango de fechas
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Método de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={loadReport} disabled={loading} className="flex-1">
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(
                  new Date(new Date().setDate(1)).toISOString().split("T")[0],
                );
                setEndDate(new Date().toISOString().split("T")[0]);
                setPaymentMethod("all");
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-green-700">
                  Total Ventas
                </p>
              </div>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(data.summary.total_revenue)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-blue-700">
                  Transacciones
                </p>
              </div>
              <p className="text-lg font-bold text-blue-900 break-words">
                {data.summary.total_sales}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-purple-700">
                  Ticket Promedio
                </p>
              </div>
              <p className="text-lg font-bold text-purple-900 break-words">
                {formatCurrency(data.summary.average_ticket)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-orange-700">
                  Descuentos
                </p>
              </div>
              <p className="text-lg font-bold text-orange-900 break-words">
                {formatCurrency(data.summary.total_discount)}
              </p>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Gráfico de Ventas por Día */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Ventas por Día</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Gráfico por Método de Pago */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Por Método de Pago</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.paymentMethodBreakdown}
                    dataKey="total"
                    nameKey="payment_method"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) =>
                      `${entry.payment_method}: ${formatCurrency(entry.total)}`
                    }
                  >
                    {data.paymentMethodBreakdown.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Tabla de Ventas */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Ventas</h3>
              <div className="flex gap-2">
                <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
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
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Método
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Descuento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.sales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">#{sale.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(sale.timestamp).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm">{sale.client_name}</td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {sale.payment_method}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(sale.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {sale.discount > 0
                          ? `-${formatCurrency(sale.discount)}`
                          : "-"}
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
        </>
      )}
    </div>
  );
}
