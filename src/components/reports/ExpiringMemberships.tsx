import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import { FileDown, AlertTriangle, AlertCircle, Clock } from "lucide-react";

interface ExpiringMembershipsProps {
  onBack: () => void;
}

export default function ExpiringMemberships({
  onBack,
}: ExpiringMembershipsProps) {
  const { formatCurrency } = useCurrency();
  const { exportToExcel } = useReportExport();

  const [daysThreshold, setDaysThreshold] = useState(30);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getExpiringMemberships(
        daysThreshold,
      );
      setReportData(data);
    } catch (error) {
      console.error("Error cargando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === "critical") {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Crítico
        </span>
      );
    }
    if (urgency === "warning") {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Advertencia
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Normal
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
            <h1 className="text-3xl font-bold">⏰ Membresías por Vencer</h1>
            <p className="text-sm text-gray-600">
              Alertas de vencimiento próximo
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Días de Anticipación
            </label>
            <Input
              type="number"
              value={daysThreshold}
              onChange={(e) => setDaysThreshold(parseInt(e.target.value) || 30)}
              min="1"
              max="90"
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
                Total por Vencer
              </p>
              <p className="text-lg font-bold text-blue-900">
                {reportData.summary.total}
              </p>
              <Clock className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
              <p className="text-xs font-medium text-red-700 mb-2">
                Críticas (≤7 días)
              </p>
              <p className="text-lg font-bold text-red-900">
                {reportData.summary.critical}
              </p>
              <AlertTriangle className="w-4 h-4 text-red-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <p className="text-xs font-medium text-yellow-700 mb-2">
                Advertencia (8-15 días)
              </p>
              <p className="text-lg font-bold text-yellow-900">
                {reportData.summary.warning}
              </p>
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Ingresos Potenciales
              </p>
              <p className="text-lg font-bold text-purple-900 break-words">
                {formatCurrency(reportData.summary.potentialRevenue)}
              </p>
              <Clock className="w-4 h-4 text-purple-500 mt-2" />
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Membresías</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Membresías por Vencer",
                    subtitle: `Próximos ${daysThreshold} días`,
                    filename: `membresias-por-vencer-${new Date().toISOString().split("T")[0]}`,
                    columns: [
                      { header: "Cliente", key: "client_name", width: 30 },
                      { header: "Email", key: "client_email", width: 25 },
                      { header: "Teléfono", key: "client_phone", width: 15 },
                      {
                        header: "Membresía",
                        key: "membership_name",
                        width: 25,
                      },
                      {
                        header: "Fecha Vencimiento",
                        key: "end_date",
                        width: 15,
                      },
                      {
                        header: "Días Restantes",
                        key: "days_remaining",
                        width: 15,
                      },
                      { header: "Urgencia", key: "urgency", width: 15 },
                      {
                        header: "Precio Renovación",
                        key: "membership_price",
                        format: "currency",
                        width: 15,
                      },
                    ],
                    data: reportData.memberships,
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
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Membresía
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Fecha Vencimiento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Días Restantes
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold">
                      Urgencia
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Precio Renovación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.memberships.map((membership: any) => (
                    <tr key={membership.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">
                          {membership.client_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {membership.client_email || "Sin email"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {membership.client_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">
                          {membership.membership_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {membership.duration_days} días
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(membership.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span
                          className={`font-bold ${
                            membership.urgency === "critical"
                              ? "text-red-600"
                              : membership.urgency === "warning"
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        >
                          {membership.days_remaining} días
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {getUrgencyBadge(membership.urgency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(membership.membership_price)}
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
