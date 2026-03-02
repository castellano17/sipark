import { useState, useEffect } from "react";
import {
  Shield,
  FileDown,
  Calendar,
  Search,
  User,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface SalesAuditReportProps {
  onBack: () => void;
}

export function SalesAuditReport({ onBack }: SalesAuditReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [userId, setUserId] = useState<number | null>(null);
  const [action, setAction] = useState("");

  const { formatCurrency } = useCurrency();
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
      const result = await (window as any).api.getSalesAuditReport(
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        userId,
        action || null,
      );
      setData(result);
    } catch (err) {
      console.error("Error cargando reporte:", err);
      error("Error al cargar el reporte de auditoría de ventas");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    if (!data || !data.audits || data.audits.length === 0) {
      error("No hay datos para exportar");
      return;
    }

    const exportData = data.audits.map((audit: any) => ({
      Fecha: new Date(audit.created_at).toLocaleString("es-ES"),
      "ID Venta": audit.sale_id,
      Cliente: audit.client_name,
      "Total Venta": audit.sale_total,
      Acción: audit.action,
      Razón: audit.reason || "-",
      Detalles: audit.details || "-",
      Usuario: `${audit.first_name} ${audit.last_name}`,
    }));

    if (format === "excel") {
      exportToExcel(exportData, "auditoria-ventas");
    } else {
      exportToPDF(exportData, "Reporte de Auditoría de Ventas");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
          <Shield className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              🔐 Ventas Canceladas/Modificadas
            </h2>
            <p className="text-sm text-gray-600">
              Auditoría de ventas con cambios o anulaciones
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              value={userId || ""}
              onChange={(e) =>
                setUserId(e.target.value ? Number(e.target.value) : null)
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
              Acción
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="cancelled">Cancelada</option>
              <option value="modified">Modificada</option>
              <option value="refunded">Reembolsada</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={loadReport}
              className="bg-red-600 hover:bg-red-700 w-full"
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
                  <p className="text-sm text-gray-600 mb-1">Total Auditorías</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.total_audits}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Canceladas</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.cancelled_count}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-red-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Modificadas</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.modified_count}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-yellow-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reembolsadas</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.refunded_count}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-600 mt-2" />
              </div>
            </Card>
          </div>

          {/* Audits Table */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Registro de Auditorías ({data.audits.length})
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
                      ID Venta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Razón
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.audits.map((audit: any) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(audit.created_at).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{audit.sale_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {audit.client_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(audit.sale_total)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            audit.action === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : audit.action === "modified"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {audit.action === "cancelled"
                            ? "Cancelada"
                            : audit.action === "modified"
                              ? "Modificada"
                              : audit.action === "refunded"
                                ? "Reembolsada"
                                : audit.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {audit.reason || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {audit.first_name} {audit.last_name}
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
