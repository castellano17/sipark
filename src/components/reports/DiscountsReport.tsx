import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import {
  FileDown,
  TrendingDown,
  Percent,
  DollarSign,
  ShoppingCart,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

interface DiscountsReportProps {
  onBack: () => void;
}

export default function DiscountsReport({ onBack }: DiscountsReportProps) {
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

  const [minDiscount, setMinDiscount] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getDiscountsReport(
        startDate,
        endDate,
        minDiscount,
        maxDiscount,
      );
      setReportData(data);
    } catch (error) {
      console.error("Error cargando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      </div>
    );
  }

  const rangesData = reportData
    ? [
        { name: "Bajo (<10%)", value: reportData.ranges.low, color: "#3b82f6" },
        {
          name: "Medio (10-25%)",
          value: reportData.ranges.medium,
          color: "#10b981",
        },
        {
          name: "Alto (25-50%)",
          value: reportData.ranges.high,
          color: "#f59e0b",
        },
        {
          name: "Muy Alto (≥50%)",
          value: reportData.ranges.veryHigh,
          color: "#ef4444",
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
            <h1 className="text-3xl font-bold">🏷️ Descuentos Aplicados</h1>
            <p className="text-sm text-gray-600">
              Análisis de descuentos otorgados
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
            <label className="text-sm font-medium mb-2 block">
              Descuento Mínimo
            </label>
            <Input
              type="number"
              value={minDiscount}
              onChange={(e) => setMinDiscount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Ventas con Descuento
              </p>
              <p className="text-lg font-bold text-blue-900">
                {reportData.summary.totalDiscountedSales}
              </p>
              <ShoppingCart className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
              <p className="text-xs font-medium text-red-700 mb-2">
                Total Descontado
              </p>
              <p className="text-lg font-bold text-red-900 break-words">
                {formatCurrency(reportData.summary.totalDiscount)}
              </p>
              <TrendingDown className="w-4 h-4 text-red-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Descuento Promedio
              </p>
              <p className="text-lg font-bold text-purple-900 break-words">
                {formatCurrency(parseFloat(reportData.summary.averageDiscount))}
              </p>
              <DollarSign className="w-4 h-4 text-purple-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <p className="text-xs font-medium text-orange-700 mb-2">
                % sobre Ventas
              </p>
              <p className="text-lg font-bold text-orange-900">
                {reportData.summary.discountPercentageOfSales}%
              </p>
              <Percent className="w-4 h-4 text-orange-500 mt-2" />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                Distribución por Rango
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rangesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {rangesData.map((entry, index) => (
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
                Descuentos por Rango
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rangesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip labelStyle={{ color: "#000" }} />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Cantidad" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Descuentos</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Descuentos Aplicados",
                    subtitle: `Del ${startDate} al ${endDate}`,
                    filename: `descuentos-${startDate}-${endDate}`,
                    columns: [
                      { header: "Fecha", key: "timestamp", width: 20 },
                      { header: "Cliente", key: "client_name", width: 30 },
                      { header: "Email", key: "client_email", width: 25 },
                      { header: "Teléfono", key: "client_phone", width: 15 },
                      {
                        header: "Subtotal",
                        key: "subtotal",
                        format: "currency",
                        width: 15,
                      },
                      {
                        header: "Descuento",
                        key: "discount",
                        format: "currency",
                        width: 15,
                      },
                      {
                        header: "% Descuento",
                        key: "discount_percentage",
                        width: 15,
                      },
                      {
                        header: "Total",
                        key: "total",
                        format: "currency",
                        width: 15,
                      },
                      {
                        header: "Método Pago",
                        key: "payment_method",
                        width: 15,
                      },
                    ],
                    data: reportData.discounts,
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
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Descuento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      % Desc.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Método
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.discounts.map((discount: any) => (
                    <tr key={discount.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(discount.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">
                          {discount.client_name || "Cliente General"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {discount.client_email || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(discount.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                        -{formatCurrency(discount.discount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span
                          className={`font-bold ${
                            discount.discount_percentage >= 50
                              ? "text-red-600"
                              : discount.discount_percentage >= 25
                                ? "text-orange-600"
                                : discount.discount_percentage >= 10
                                  ? "text-yellow-600"
                                  : "text-blue-600"
                          }`}
                        >
                          {Number(discount.discount_percentage).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(discount.total)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {discount.payment_method || "N/A"}
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
