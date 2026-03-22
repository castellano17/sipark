import { useState, useEffect } from "react";
import {
  Activity,
  FileDown,
  Calendar,
  Search,
  User,
  Filter,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface UserActivityReportProps {
  onBack: () => void;
}

export function UserActivityReport({ onBack }: UserActivityReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [actionType, setActionType] = useState("");

  const { error } = useNotification();
  const { exportToExcel, exportToPDF } = useReportExport();

  useEffect(() => {
    loadUsers();
    loadReport();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await (window as any).api.getUsers();
      setUsers(result || []);
    } catch (err) {
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.getUserActivityReport(
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        selectedUserId,
        actionType || null,
      );
      setData(result);
    } catch (err) {
      error("Error al cargar el reporte de actividad");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    if (!data || !data.activities || data.activities.length === 0) {
      error("No hay datos para exportar");
      return;
    }

    const exportData = data.activities.map((activity: any) => ({
      Fecha: new Date(activity.created_at).toLocaleString("es-ES"),
      Usuario: `${activity.first_name} ${activity.last_name} (${activity.username})`,
      Rol: activity.role,
      Acción: activity.action,
      Detalles: activity.details || "-",
      IP: activity.ip_address || "-",
    }));

    if (format === "excel") {
      exportToExcel(exportData, "actividad-usuarios");
    } else {
      exportToPDF(exportData, "Reporte de Actividad de Usuarios");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          ← Volver
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              🔐 Actividad de Usuarios
            </h2>
            <p className="text-sm text-gray-600">
              Registro de acciones realizadas por usuarios del sistema
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Fin
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Usuario
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedUserId || ""}
              onChange={(e) =>
                setSelectedUserId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Tipo de Acción
            </label>
            <Input
              type="text"
              placeholder="Ej: login, create, update..."
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={loadReport}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </div>
      </Card>

      {data && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Acciones</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.total_actions}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.unique_users}
                  </p>
                </div>
                <User className="w-8 h-8 text-green-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Inicios de Sesión
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.login_count}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Modificaciones</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.update_count}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-orange-600 mt-2" />
              </div>
            </Card>
          </div>

          {/* Activity by User */}
          {data.byUser.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Actividad por Usuario
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.byUser.map((user: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="font-semibold text-gray-800">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                    <p className="text-xs text-gray-500 mb-2">{user.role}</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {user.action_count} acciones
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Activities Table */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Registro de Actividades ({data.activities.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport("excel")}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  onClick={() => handleExport("pdf")}
                  className="bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Detalles
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.activities.map((activity: any) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(activity.created_at).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.first_name} {activity.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{activity.username} - {activity.role}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {activity.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {activity.details || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {activity.ip_address || "-"}
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
