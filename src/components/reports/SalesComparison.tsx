import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#94a3b8", "#3b82f6"];

interface SalesComparisonProps {
  onBack: () => void;
}

export default function SalesComparison({ onBack }: SalesComparisonProps) {
  const { formatCurrency } = useCurrency();
  const { exportToExcel, exportToPDF } = useReportExport();

  const [period1Start, setPeriod1Start] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });

  const [period1End, setPeriod1End] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(0);
    return date.toISOString().split("T")[0];
  });

  const [period2Start, setPeriod2Start] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });

  const [period2End, setPeriod2End] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getSalesComparison(
        period1Start,
        period1End,
        period2Start,
        period2End,
      );
      setReportData(data);
    } catch (error) {
      console.error("Error cargando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleExportExcel = () => {
    if (!reportData) return;

    const data = [
      {
        Métrica: "Total Ventas",
        "Período 1": reportData.period1.total_sales,
        "Período 2": reportData.period2.total_sales,
        Crecimiento: reportData.growth.sales + "%",
      },
      {
        Métrica: "Ingresos",
        "Período 1": reportData.period1.total_revenue,
        "Período 2": reportData.period2.total_revenue,
        Crecimiento: reportData.growth.revenue + "%",
      },
      {
        Métrica: "Ticket Promedio",
        "Período 1": reportData.period1.avg_ticket,
        "Período 2": reportData.period2.avg_ticket,
        Crecimiento: reportData.growth.avgTicket + "%",
      },
    ];

    exportToExcel(data, "comparativo-ventas");
  };

  const handleExportPDF = () => {
    if (!reportData) return;

    const columns = ["Métrica", "Período 1", "Período 2", "Crecimiento"];
    const data = [
      [
        "Total Ventas",
        reportData.period1.total_sales,
        reportData.period2.total_sales,
        reportData.growth.sales + "%",
      ],
      [
        "Ingresos",
        formatCurrency(reportData.period1.total_revenue),
        formatCurrency(reportData.period2.total_revenue),
        reportData.growth.revenue + "%",
      ],
      [
        "Ticket Promedio",
        formatCurrency(reportData.period1.avg_ticket),
        formatCurrency(reportData.period2.avg_ticket),
        reportData.growth.avgTicket + "%",
      ],
    ];

    exportToPDF("Comparativo de Ventas", columns, data);
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando reporte...</div>
      </div>
    );
  }

  const chartData = reportData
    ? [
        {
          name: "Ventas",
          "Período 1": reportData.period1.total_sales,
          "Período 2": reportData.period2.total_sales,
        },
        {
          name: "Ingresos",
          "Período 1": reportData.period1.total_revenue,
          "Período 2": reportData.period2.total_revenue,
        },
      ]
    : [];

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📊 Comparativo de Ventas</h1>
            <p className="text-sm text-gray-600">
              Comparación entre dos períodos
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Período 1</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Inicio</label>
                <Input
                  type="date"
                  value={period1Start}
                  onChange={(e) => setPeriod1Start(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fin</label>
                <Input
                  type="date"
                  value={period1End}
                  onChange={(e) => setPeriod1End(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Período 2</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Inicio</label>
                <Input
                  type="date"
                  value={period2Start}
                  onChange={(e) => setPeriod2Start(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fin</label>
                <Input
                  type="date"
                  value={period2End}
                  onChange={(e) => setPeriod2End(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <Button onClick={loadReport} disabled={loading} className="w-full mt-4">
          {loading ? "Cargando..." : "Aplicar"}
        </Button>
      </Card>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Crecimiento Ventas
              </p>
              <p className="text-lg font-bold text-blue-900">
                {reportData.growth.sales}%
              </p>
              {parseFloat(reportData.growth.sales) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mt-2" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mt-2" />
              )}
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Crecimiento Ingresos
              </p>
              <p className="text-lg font-bold text-green-900">
                {reportData.growth.revenue}%
              </p>
              {parseFloat(reportData.growth.revenue) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mt-2" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mt-2" />
              )}
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Crecimiento Ticket
              </p>
              <p className="text-lg font-bold text-purple-900">
                {reportData.growth.avgTicket}%
              </p>
              {parseFloat(reportData.growth.avgTicket) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mt-2" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mt-2" />
              )}
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Comparación Visual</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip labelStyle={{ color: "#000" }} />
                <Legend />
                <Bar dataKey="Período 1" fill="#94a3b8" />
                <Bar dataKey="Período 2" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle Comparativo</h3>
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
                      Métrica
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Período 1
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Período 2
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Crecimiento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      Total Ventas
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {reportData.period1.total_sales || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {reportData.period2.total_sales || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                      {reportData.growth.sales}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      Ingresos Totales
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(reportData.period1.total_revenue || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(reportData.period2.total_revenue || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                      {reportData.growth.revenue}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      Ticket Promedio
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(reportData.period1.avg_ticket || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(reportData.period2.avg_ticket || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-purple-600">
                      {reportData.growth.avgTicket}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
