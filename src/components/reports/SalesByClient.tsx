import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import { Download, FileSpreadsheet, Users, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface SalesByClientProps {
  onBack: () => void;
}

export default function SalesByClient({ onBack }: SalesByClientProps) {
  const { formatCurrency } = useCurrency();
  const { exportToExcel, exportToPDF } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [limit, setLimit] = useState(20);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getSalesByClient(
        startDate,
        endDate,
        limit,
      );
      setReportData(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleExportExcel = () => {
    if (!reportData) return;

    const data = reportData.clients.map((c: any) => ({
      Cliente: c.name,
      Email: c.email || "N/A",
      Teléfono: c.phone || "N/A",
      "Total Compras": c.total_purchases,
      "Total Gastado": c.total_spent,
      "Ticket Promedio": c.avg_ticket,
      "% del Total": c.percentage + "%",
      "Última Compra": c.last_purchase,
    }));

    exportToExcel(data, "ventas-por-cliente");
  };

  const handleExportPDF = () => {
    if (!reportData) return;

    const columns = [
      "Cliente",
      "Compras",
      "Total Gastado",
      "Ticket Prom.",
      "% Total",
    ];
    const data = reportData.clients.map((c: any) => [
      c.name,
      c.total_purchases,
      formatCurrency(c.total_spent),
      formatCurrency(c.avg_ticket),
      c.percentage + "%",
    ]);

    exportToPDF(
      "Ventas por Cliente",
      columns,
      data,
      `Período: ${startDate} - ${endDate}`,
    );
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando reporte...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">👥 Ventas por Cliente</h1>
            <p className="text-sm text-gray-600">
              Análisis de ventas por cliente
            </p>
          </div>
        </div>
      </div>

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
            <label className="text-sm font-medium mb-2 block">Límite</label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min="5"
              max="100"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadReport} disabled={loading} className="w-full">
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </Card>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Total Clientes
              </p>
              <p className="text-lg font-bold text-blue-900">
                {reportData.summary.totalClients}
              </p>
              <Users className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Ingresos Totales
              </p>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(reportData.summary.totalRevenue)}
              </p>
              <TrendingUp className="w-4 h-4 text-green-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Ticket Promedio
              </p>
              <p className="text-lg font-bold text-purple-900 break-words">
                {reportData.clients.length > 0
                  ? formatCurrency(
                      reportData.summary.totalRevenue /
                        reportData.clients.reduce(
                          (sum: number, c: any) => sum + c.total_purchases,
                          0,
                        ),
                    )
                  : formatCurrency(0)}
              </p>
              <TrendingUp className="w-4 h-4 text-purple-500 mt-2" />
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              Top Clientes por Ingresos
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.clients.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Bar
                  dataKey="total_spent"
                  fill="#3b82f6"
                  name="Total Gastado"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Clientes</h3>
              <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Email
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Compras
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total Gastado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Ticket Prom.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      % Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Última Compra
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.clients.map((client: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {client.email || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {client.total_purchases}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(client.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(client.avg_ticket)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {client.percentage}%
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(client.last_purchase).toLocaleDateString()}
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
