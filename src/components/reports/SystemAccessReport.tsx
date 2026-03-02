import { useState, useEffect } from "react";
import {
  Shield,
  FileDown,
  Calendar,
  Search,
  User,
  ArrowLeft,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface SystemAccessReportProps {
  onBack: () => void;
}

export function SystemAccessReport({ onBack }: SystemAccessReportProps) {
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
      console.error("Error cargando usuarios:", err);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.getSystemAccessReport(
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        selectedUserId,
      );
      setData(result);
    } catch (err) {
      console.error("Error cargando reporte:", err);
      error("Error al cargar el reporte de accesos");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    if (!data || !data.accesses || data.accesses.length === 0) {
      error("No hay datos para exportar");
      return;
    }

    const exportOptions = {
      title: "Reporte de Accesos al Sistema",
      subtitle: `Período: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      filename: "accesos-sistema",
      columns: [
        {
          header: "Fecha",
          key: "created_at",
          width: 20,
          format: "datetime" as const,
        },
        { header: "Usuario", key: "username", width: 20 },
        { header: "Nombre", key: "full_name", width: 25 },
        { header: "Rol", key: "role", width: 15 },
        { header: "Acción", key: "action", width: 20 },
        { header: "Detalles", key: "details", width: 30 },
        { header: "IP", key: "ip_address", width: 15 },
      ],
      data: data.accesses.map((access: any) => ({
        created_at: access.created_at,
        username: access.username,
        full_name: `${access.first_name} ${access.last_name}`,
        role: access.role,
        action: access.action,
        details: access.details || "-",
        ip_address: access.ip_address || "-",
      })),
      summary: [
        { label: "Total Accesos", value: data.totals.total_accesses },
        { label: "Usuarios Únicos", value: data.totals.unique_users },
      ],
    };

    if (format === "excel") {
      exportToExcel(exportOptions);
    } else {
      exportToPDF(exportOptions);
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
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              🔐 Accesos al Sistema
            </h2>
            <p className="text-sm text-gray-600">
              Log de inicios de sesión y accesos
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
          <div className="flex items-end">
            <Button
              onClick={loadReport}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Accesos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.total_accesses}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Usuarios Únicos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.unique_users}
                  </p>
                </div>
                <User className="w-8 h-8 text-green-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Exitosos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.successful_logins}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-green-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fallidos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.failed_logins}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-red-600 mt-2" />
              </div>
            </Card>
          </div>

          {/* Access by User */}
          {data.byUser.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Accesos por Usuario
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
                    <p className="text-2xl font-bold text-blue-600">
                      {user.access_count} accesos
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Último:{" "}
                      {new Date(user.last_access).toLocaleString("es-ES")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Access Table */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Registro de Accesos ({data.accesses.length})
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
                  {data.accesses.map((access: any) => (
                    <tr key={access.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(access.created_at).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            {access.first_name} {access.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{access.username} - {access.role}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            access.action.includes("fail") ||
                            access.action.includes("error")
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {access.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {access.details || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {access.ip_address || "-"}
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
