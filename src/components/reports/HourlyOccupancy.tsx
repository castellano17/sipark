import { useState, useEffect } from "react";
import { Clock, FileDown, Users } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
  Bar,
} from "recharts";

interface HourlyOccupancyProps {
  onBack: () => void;
}

export function HourlyOccupancy({ onBack }: HourlyOccupancyProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { error } = useNotification();
  const { exportToExcel, exportToPDF } = useReportExport();

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
      const result = await (window.api as any).getHourlyOccupancy(
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
            <h1 className="text-3xl font-bold">📊 Ocupación por Hora</h1>
            <p className="text-sm text-gray-600">
              Análisis de ocupación y horas pico
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-indigo-700">
                  Total Sesiones
                </p>
              </div>
              <p className="text-lg font-bold text-indigo-900 break-words">
                {data.summary.totalSessions}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-blue-700">
                  Promedio por Hora
                </p>
              </div>
              <p className="text-lg font-bold text-blue-900 break-words">
                {data.summary.avgSessionsPerHour}
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
                {data.summary.peakHour}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-orange-700">
                  Sesiones en Hora Pico
                </p>
              </div>
              <p className="text-lg font-bold text-orange-900 break-words">
                {data.summary.peakHourSessions}
              </p>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              Ocupación por Hora del Día
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={data.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour_label"
                  style={{ fontSize: "12px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" style={{ fontSize: "12px" }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="session_count"
                  name="Sesiones"
                  fill="#6366f1"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avg_duration"
                  name="Duración Promedio (min)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
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
                    if (!data?.hourlyData || data.hourlyData.length === 0) {
                      error("No hay datos para exportar");
                      return;
                    }
                    exportToExcel({
                      title: "Ocupación por Hora",
                      subtitle: `Del ${startDate} al ${endDate}`,
                      filename: `ocupacion-hora-${startDate}-${endDate}`,
                      columns: [
                        { header: "Hora", key: "hour_label", width: 15 },
                        {
                          header: "Sesiones",
                          key: "session_count",
                          width: 15,
                        },
                        {
                          header: "Duración Promedio (min)",
                          key: "avg_duration",
                          width: 20,
                        },
                      ],
                      data: data.hourlyData,
                      summary: [
                        {
                          label: "Total Sesiones",
                          value: data.summary.totalSessions,
                        },
                        {
                          label: "Promedio por Hora",
                          value: data.summary.avgSessionsPerHour,
                        },
                        {
                          label: "Hora Pico",
                          value: data.summary.peakHour,
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
                    if (!data?.hourlyData || data.hourlyData.length === 0) {
                      error("No hay datos para exportar");
                      return;
                    }
                    exportToPDF({
                      title: "Ocupación por Hora",
                      subtitle: `Del ${startDate} al ${endDate}`,
                      filename: `ocupacion-hora-${startDate}-${endDate}`,
                      columns: [
                        { header: "Hora", key: "hour_label" },
                        { header: "Sesiones", key: "session_count" },
                        {
                          header: "Duración Promedio (min)",
                          key: "avg_duration",
                        },
                      ],
                      data: data.hourlyData,
                      summary: [
                        {
                          label: "Total Sesiones",
                          value: data.summary.totalSessions,
                        },
                        {
                          label: "Hora Pico",
                          value: data.summary.peakHour,
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
                      Sesiones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Duración Promedio (min)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.hourlyData
                    .filter((h: any) => h.session_count > 0)
                    .map((hour: any) => (
                      <tr key={hour.hour} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {hour.hour_label}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {hour.session_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-indigo-600">
                          {Number(hour.avg_duration).toFixed(1)}
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
