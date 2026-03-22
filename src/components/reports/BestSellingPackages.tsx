import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import { FileDown, Package } from "lucide-react";
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

interface BestSellingPackagesProps {
  onBack: () => void;
}

export default function BestSellingPackages({
  onBack,
}: BestSellingPackagesProps) {
  const { formatCurrency } = useCurrency();
  const { exportToExcel } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getBestSellingPackages(
        startDate,
        endDate,
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

  if (loading && !reportData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <h1 className="text-3xl font-bold">🎁 Paquetes Más Vendidos</h1>
            <p className="text-sm text-gray-600">
              Análisis de ventas de paquetes
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Total Paquetes
              </p>
              <p className="text-lg font-bold text-blue-900">
                {reportData.summary.totalPackages}
              </p>
              <Package className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Total Vendidos
              </p>
              <p className="text-lg font-bold text-green-900">
                {reportData.summary.totalSold}
              </p>
              <Package className="w-4 h-4 text-green-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Ingresos Totales
              </p>
              <p className="text-lg font-bold text-purple-900 break-words">
                {formatCurrency(reportData.summary.totalRevenue)}
              </p>
              <Package className="w-4 h-4 text-purple-500 mt-2" />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                Distribución de Ventas
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.packages}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.times_sold}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="times_sold"
                  >
                    {reportData.packages.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                Ingresos por Paquete
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.packages}>
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
                  <Bar dataKey="total_revenue" fill="#3b82f6" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Paquetes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Paquetes Más Vendidos",
                    subtitle: `Del ${startDate} al ${endDate}`,
                    filename: `paquetes-vendidos-${startDate}-${endDate}`,
                    columns: [
                      { header: "Paquete", key: "name", width: 30 },
                      {
                        header: "Duración (días)",
                        key: "duration_days",
                        width: 15,
                      },
                      {
                        header: "Precio",
                        key: "price",
                        format: "currency",
                        width: 15,
                      },
                      { header: "Veces Vendido", key: "times_sold", width: 15 },
                      {
                        header: "Ingresos Totales",
                        key: "total_revenue",
                        format: "currency",
                        width: 20,
                      },
                      { header: "% del Total", key: "percentage", width: 10 },
                    ],
                    data: reportData.packages,
                  });
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Paquete
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Duración (días)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Veces Vendido
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Ingresos Totales
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      % del Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.packages.map((pkg: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {pkg.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {pkg.duration_days}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(pkg.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {pkg.times_sold}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(pkg.total_revenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {pkg.percentage}%
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
