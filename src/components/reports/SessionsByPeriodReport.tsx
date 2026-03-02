import { useState, useEffect } from "react";
import { Clock, TrendingUp, FileDown, Printer } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SessionsByPeriodReportProps {
  onBack: () => void;
}

export function SessionsByPeriodReport({
  onBack,
}: SessionsByPeriodReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
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
  const [packageFilter, setPackageFilter] = useState<string>("all");

  useEffect(() => {
    loadReport();
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const result = await window.api.getProductsServices();
      const timePackages = result.filter((p: any) => p.type === "time");
      setPackages(timePackages);
    } catch (err) {
      console.error("Error cargando paquetes:", err);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const packageParam =
        packageFilter && packageFilter !== "all"
          ? parseInt(packageFilter)
          : null;
      const result = await window.api.getSessionsByPeriod(
        startDate,
        endDate,
        packageParam,
      );
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      active: { label: "Activa", color: "bg-green-100 text-green-700" },
      completed: { label: "Completada", color: "bg-blue-100 text-blue-700" },
      cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700" },
    };
    const badge = badges[status] || {
      label: status,
      color: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  const handleExportExcel = () => {
    if (!data) return;

    exportToExcel({
      title: "Reporte de Sesiones por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `sesiones-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Cliente", key: "client_name", width: 25 },
        { header: "Paquete", key: "package_name", width: 25 },
        { header: "Inicio", key: "start_time", format: "datetime", width: 20 },
        { header: "Fin", key: "end_time", format: "datetime", width: 20 },
        { header: "Duración (min)", key: "duration_minutes", width: 15 },
        { header: "Estado", key: "status", width: 15 },
      ],
      data: data.sessions,
      summary: [
        { label: "Total Sesiones", value: data.summary.totalSessions },
        {
          label: "Sesiones Completadas",
          value: data.summary.completedSessions,
        },
        {
          label: "Duración Promedio",
          value: `${data.summary.averageDuration.toFixed(0)} min`,
        },
        { label: "Duración Total", value: `${data.summary.totalDuration} min` },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Sesiones por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `sesiones-${startDate}-${endDate}`,
      columns: [
        { header: "Cliente", key: "client_name" },
        { header: "Paquete", key: "package_name" },
        { header: "Inicio", key: "start_time", format: "datetime" },
        { header: "Duración", key: "duration_minutes" },
        { header: "Estado", key: "status" },
      ],
      data: data.sessions,
      summary: [
        { label: "Total Sesiones", value: data.summary.totalSessions },
        {
          label: "Duración Promedio",
          value: `${data.summary.averageDuration.toFixed(0)} min`,
        },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Sesiones por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `sesiones-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id" },
        { header: "Cliente", key: "client_name" },
        { header: "Paquete", key: "package_name" },
        { header: "Inicio", key: "start_time", format: "datetime" },
        { header: "Fin", key: "end_time", format: "datetime" },
        { header: "Duración", key: "duration_minutes" },
        { header: "Estado", key: "status" },
      ],
      data: data.sessions,
      summary: [
        { label: "Total Sesiones", value: data.summary.totalSessions },
        { label: "Duración Total", value: `${data.summary.totalDuration} min` },
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
            <h1 className="text-3xl font-bold">⏱️ Sesiones por Período</h1>
            <p className="text-sm text-gray-600">
              Análisis de sesiones de juego
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <label className="text-sm font-medium mb-2 block">Paquete</label>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Todos</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
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
                setPackageFilter("all");
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
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-blue-700">
                  Total Sesiones
                </p>
              </div>
              <p className="text-lg font-bold text-blue-900 break-words">
                {data.summary.totalSessions}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-green-700">
                  Completadas
                </p>
              </div>
              <p className="text-lg font-bold text-green-900 break-words">
                {data.summary.completedSessions}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-purple-700">
                  Duración Promedio
                </p>
              </div>
              <p className="text-lg font-bold text-purple-900 break-words">
                {formatDuration(Math.round(data.summary.averageDuration))}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-orange-700">
                  Duración Total
                </p>
              </div>
              <p className="text-lg font-bold text-orange-900 break-words">
                {formatDuration(data.summary.totalDuration)}
              </p>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Sesiones por Día */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Sesiones por Día</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailySessions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Sesiones por Paquete */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                Sesiones por Paquete
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byPackage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    style={{ fontSize: "11px" }}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip />
                  <Bar
                    dataKey="session_count"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Tabla de Sesiones */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Sesiones</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>

            {data.sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay sesiones en este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Paquete
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Inicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Fin
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">
                        Duración
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.sessions.map((session: any) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold">
                          #{session.id}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {session.client_name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {session.package_name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(session.start_time).toLocaleString("es-ES")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {session.end_time
                            ? new Date(session.end_time).toLocaleString("es-ES")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          {session.duration_minutes
                            ? formatDuration(session.duration_minutes)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(session.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
