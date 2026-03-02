import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useReportExport } from "../../hooks/useReportExport";
import { FileDown, Clock, CheckCircle, PlayCircle } from "lucide-react";

interface SessionsHistoryProps {
  onBack: () => void;
}

export default function SessionsHistory({ onBack }: SessionsHistoryProps) {
  const { exportToExcel } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getSessionsHistory(
        startDate,
        endDate,
        null,
        statusFilter,
      );
      setReportData(data);
    } catch (error) {
      console.error("Error cargando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (datetime: string | null) => {
    if (!datetime) return "N/A";
    return new Date(datetime).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
          <PlayCircle className="w-3 h-3" />
          Activa
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Completada
      </span>
    );
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
            <h1 className="text-3xl font-bold">📋 Historial de Sesiones</h1>
            <p className="text-sm text-gray-600">
              Registro completo de visitas
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
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <select
              className="w-full p-2 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="completed">Completadas</option>
            </select>
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
                Total Sesiones
              </p>
              <p className="text-lg font-bold text-blue-900">
                {reportData.summary.total}
              </p>
              <Clock className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">Activas</p>
              <p className="text-lg font-bold text-green-900">
                {reportData.summary.active}
              </p>
              <PlayCircle className="w-4 h-4 text-green-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Completadas
              </p>
              <p className="text-lg font-bold text-purple-900">
                {reportData.summary.completed}
              </p>
              <CheckCircle className="w-4 h-4 text-purple-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <p className="text-xs font-medium text-orange-700 mb-2">
                Duración Promedio
              </p>
              <p className="text-lg font-bold text-orange-900">
                {formatMinutes(parseFloat(reportData.summary.averageDuration))}
              </p>
              <Clock className="w-4 h-4 text-orange-500 mt-2" />
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Sesiones</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Historial de Sesiones",
                    subtitle: `Del ${startDate} al ${endDate}`,
                    filename: `historial-sesiones-${startDate}-${endDate}`,
                    columns: [
                      { header: "Fecha", key: "visit_date", width: 15 },
                      { header: "Cliente", key: "client_name", width: 30 },
                      { header: "Email", key: "client_email", width: 25 },
                      { header: "Teléfono", key: "client_phone", width: 15 },
                      {
                        header: "Membresía",
                        key: "membership_name",
                        width: 25,
                      },
                      {
                        header: "Hora Entrada",
                        key: "check_in_time",
                        width: 15,
                      },
                      {
                        header: "Hora Salida",
                        key: "check_out_time",
                        width: 15,
                      },
                      {
                        header: "Duración (min)",
                        key: "duration_minutes",
                        width: 15,
                      },
                      { header: "Estado", key: "status", width: 15 },
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
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Membresía
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Entrada
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Salida
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
                  {reportData.sessions.map((session: any) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(session.visit_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{session.client_name}</div>
                        <div className="text-xs text-gray-500">
                          {session.client_email || "Sin email"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.client_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {session.membership_name || "Sin membresía"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatTime(session.check_in_time)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatTime(session.check_out_time)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {formatMinutes(session.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {getStatusBadge(session.status)}
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
