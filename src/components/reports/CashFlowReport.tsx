import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CashFlowReportProps {
  onBack: () => void;
}

export function CashFlowReport({ onBack }: CashFlowReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await window.api.getCashFlowReport(startDate, endDate);
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
      console.error(err);
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
      title: "Reporte de Flujo de Efectivo",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `flujo-efectivo-${startDate}-${endDate}`,
      columns: [
        { header: "Fecha", key: "date", width: 15 },
        { header: "Ventas", key: "sales", format: "currency", width: 15 },
        {
          header: "Otros Ingresos",
          key: "income",
          format: "currency",
          width: 15,
        },
        { header: "Gastos", key: "expense", format: "currency", width: 15 },
        { header: "Compras", key: "purchase", format: "currency", width: 15 },
        { header: "Flujo Neto", key: "netFlow", format: "currency", width: 15 },
        { header: "Balance", key: "balance", format: "currency", width: 15 },
      ],
      data: data.dailyFlow,
      summary: [
        { label: "Total Ventas", value: data.summary.totalSales },
        { label: "Total Ingresos", value: data.summary.totalIncome },
        { label: "Total Gastos", value: data.summary.totalExpenses },
        { label: "Total Compras", value: data.summary.totalPurchases },
        { label: "Ingreso Neto", value: data.summary.netIncome },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Flujo de Efectivo",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `flujo-efectivo-${startDate}-${endDate}`,
      columns: [
        { header: "Fecha", key: "date" },
        { header: "Ingresos", key: "totalIncome", format: "currency" },
        { header: "Egresos", key: "totalExpense", format: "currency" },
        { header: "Flujo Neto", key: "netFlow", format: "currency" },
      ],
      data: data.dailyFlow,
      summary: [{ label: "Ingreso Neto Total", value: data.summary.netIncome }],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Flujo de Efectivo",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `flujo-efectivo-${startDate}-${endDate}`,
      columns: [
        { header: "Fecha", key: "date" },
        { header: "Ventas", key: "sales", format: "currency" },
        { header: "Ingresos", key: "income", format: "currency" },
        { header: "Gastos", key: "expense", format: "currency" },
        { header: "Compras", key: "purchase", format: "currency" },
        { header: "Flujo Neto", key: "netFlow", format: "currency" },
      ],
      data: data.dailyFlow,
      summary: [
        { label: "Total Ventas", value: data.summary.totalSales },
        { label: "Ingreso Neto", value: data.summary.netIncome },
      ],
    });
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

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">💰 Flujo de Efectivo</h1>
            <p className="text-sm text-gray-600">
              Análisis de entradas y salidas de dinero
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
          <div className="flex items-end gap-2 md:col-span-2">
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-green-700">Ventas</p>
              </div>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(data.summary.totalSales)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-blue-700">
                  Otros Ingresos
                </p>
              </div>
              <p className="text-lg font-bold text-blue-900 break-words">
                {formatCurrency(data.summary.totalIncome)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-red-700">Gastos</p>
              </div>
              <p className="text-lg font-bold text-red-900 break-words">
                {formatCurrency(data.summary.totalExpenses)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-orange-700">Compras</p>
              </div>
              <p className="text-lg font-bold text-orange-900 break-words">
                {formatCurrency(data.summary.totalPurchases)}
              </p>
            </Card>

            <Card
              className={`p-4 bg-gradient-to-br ${
                data.summary.netIncome >= 0
                  ? "from-green-50 to-green-100"
                  : "from-red-50 to-red-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    data.summary.netIncome >= 0 ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p
                  className={`text-xs font-medium ${
                    data.summary.netIncome >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  Ingreso Neto
                </p>
              </div>
              <p
                className={`text-lg font-bold break-words ${
                  data.summary.netIncome >= 0
                    ? "text-green-900"
                    : "text-red-900"
                }`}
              >
                {formatCurrency(data.summary.netIncome)}
              </p>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Flujo Diario */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Flujo Diario</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.dailyFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="totalIncome" name="Ingresos" fill="#10b981" />
                  <Bar dataKey="totalExpense" name="Egresos" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Balance Acumulado */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Balance Acumulado</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Tabla Detallada */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle Diario</h3>
              <div className="flex gap-2">
                <Button
                  className="h-8 w-8 p-0"
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  className="h-8 w-8 p-0"
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  className="h-8 w-8 p-0"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                >
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
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Ventas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Otros Ingresos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Gastos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Compras
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Flujo Neto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.dailyFlow.map((day: any) => (
                    <tr
                      key={
                        typeof day.date === "string"
                          ? day.date
                          : new Date(day.date).toISOString()
                      }
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm">
                        {new Date(day.date).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                        {formatCurrency(day.sales)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">
                        {formatCurrency(day.income)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {formatCurrency(day.expense)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-orange-600">
                        {formatCurrency(day.purchase)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-bold ${
                          day.netFlow >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {day.netFlow >= 0 ? "+" : ""}
                        {formatCurrency(day.netFlow)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(day.balance)}
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
