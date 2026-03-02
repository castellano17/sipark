import { useState, useEffect } from "react";
import { Clock, FileDown, Printer } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SalesByHourProps {
  onBack: () => void;
}

export function SalesByHour({ onBack }: SalesByHourProps) {
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
      const result = await (window.api as any).getSalesByHour(
        startDate,
        endDate,
      );
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🕐 Ventas por Hora</h1>
            <p className="text-sm text-gray-600">
              Análisis de horas pico de ventas
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-green-700">
                  Total Ingresos
                </p>
              </div>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-blue-700">
                  Transacciones
                </p>
              </div>
              <p className="text-lg font-bold text-blue-900 break-words">
                {data.summary.totalTransactions}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-purple-700">Hora Pico</p>
              </div>
              <p className="text-lg font-bold text-purple-900 break-words">
                {formatHour(data.peakHour.hour)} -{" "}
                {formatCurrency(data.peakHour.total_amount)}
              </p>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              Ventas por Hora del Día
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={formatHour}
                  style={{ fontSize: "12px" }}
                />
                <YAxis style={{ fontSize: "12px" }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(hour: number) => formatHour(hour)}
                />
                <Legend />
                <Bar
                  dataKey="total_amount"
                  name="Ventas"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle por Hora</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToExcel({
                      title: "Ventas por Hora",
                      subtitle: `Del ${startDate} al ${endDate}`,
                      filename: `ventas-hora-${startDate}-${endDate}`,
                      columns: [
                        { header: "Hora", key: "hour", width: 15 },
                        {
                          header: "Transacciones",
                          key: "transaction_count",
                          width: 15,
                        },
                        {
                          header: "Total",
                          key: "total_amount",
                          format: "currency",
                          width: 15,
                        },
                      ],
                      data: data.hourlyData.map((h: any) => ({
                        ...h,
                        hour: formatHour(h.hour),
                      })),
                      summary: [
                        {
                          label: "Total Ingresos",
                          value: data.summary.totalRevenue,
                        },
                        {
                          label: "Total Transacciones",
                          value: data.summary.totalTransactions,
                        },
                      ],
                    });
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToPDF({
                      title: "Ventas por Hora",
                      subtitle: `Del ${startDate} al ${endDate}`,
                      filename: `ventas-hora-${startDate}-${endDate}`,
                      columns: [
                        { header: "Hora", key: "hour" },
                        { header: "Transacciones", key: "transaction_count" },
                        {
                          header: "Total",
                          key: "total_amount",
                          format: "currency",
                        },
                      ],
                      data: data.hourlyData.map((h: any) => ({
                        ...h,
                        hour: formatHour(h.hour),
                      })),
                      summary: [
                        {
                          label: "Total Ingresos",
                          value: data.summary.totalRevenue,
                        },
                      ],
                    });
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Hora
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Transacciones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.hourlyData
                    .filter((h: any) => h.transaction_count > 0)
                    .map((hour: any) => (
                      <tr key={hour.hour} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatHour(hour.hour)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {hour.transaction_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                          {formatCurrency(hour.total_amount)}
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
