import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useReportExport } from "../../hooks/useReportExport";
import { FileDown, Clock } from "lucide-react";
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

interface AverageSessionDurationProps {
  onBack: () => void;
}

export default function AverageSessionDuration({
  onBack,
}: AverageSessionDurationProps) {
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

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getAverageSessionDuration(
        startDate,
        endDate,
      );
      setReportData(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

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
            <h1 className="text-3xl font-bold">
              ⏱️ Duración Promedio de Sesiones
            </h1>
            <p className="text-sm text-gray-600">
              Análisis de tiempo de sesiones
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Total Sesiones
              </p>
              <p className="text-lg font-bold text-blue-900">
                {reportData.summary.totalSessions}
              </p>
              <Clock className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Duración Promedio General
              </p>
              <p className="text-lg font-bold text-green-900">
                {formatMinutes(
                  parseFloat(reportData.summary.overallAvgDuration),
                )}
              </p>
              <Clock className="w-4 h-4 text-green-500 mt-2" />
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              Duración Promedio de Visitas
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.sessions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="package_name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  label={{
                    value: "Minutos",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip labelStyle={{ color: "#000" }} />
                <Legend />
                <Bar
                  dataKey="avg_duration_minutes"
                  fill="#3b82f6"
                  name="Duración Promedio"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Visitas</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Duración Promedio de Sesiones",
                    subtitle: `Del ${startDate} al ${endDate}`,
                    filename: `duracion-sesiones-${startDate}-${endDate}`,
                    columns: [
                      { header: "Tipo", key: "package_name", width: 30 },
                      {
                        header: "Total Sesiones",
                        key: "total_sessions",
                        width: 15,
                      },
                      {
                        header: "Duración Promedio (min)",
                        key: "avg_duration_minutes",
                        width: 20,
                      },
                      {
                        header: "Duración Mínima (min)",
                        key: "min_duration_minutes",
                        width: 20,
                      },
                      {
                        header: "Duración Máxima (min)",
                        key: "max_duration_minutes",
                        width: 20,
                      },
                    ],
                    data: reportData.sessions,
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
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total Sesiones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Duración Promedio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Duración Mínima
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Duración Máxima
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.sessions.map((session: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {session.package_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {session.total_sessions}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatMinutes(session.avg_duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatMinutes(session.min_duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatMinutes(session.max_duration_minutes)}
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
