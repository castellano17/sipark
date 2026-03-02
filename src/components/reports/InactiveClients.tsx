import { useState, useEffect } from "react";
import { UserX, FileDown } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface InactiveClientsProps {
  onBack: () => void;
}

export function InactiveClients({ onBack }: InactiveClientsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel } = useReportExport();

  const [days, setDays] = useState(30);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window.api as any).getInactiveClients(days);
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
            <h1 className="text-3xl font-bold">😴 Clientes Inactivos</h1>
            <p className="text-sm text-gray-600">
              Clientes sin actividad reciente
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Días de inactividad
            </label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              min="1"
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={loadReport} disabled={loading} className="flex-1">
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <p className="text-xs font-medium text-orange-700 mb-2">
                Clientes Inactivos
              </p>
              <p className="text-lg font-bold text-orange-900">
                {data.summary.totalInactive}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Clientes Inactivos</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Clientes Inactivos",
                    subtitle: `Más de ${days} días sin actividad`,
                    filename: `clientes-inactivos-${days}dias`,
                    columns: [
                      { header: "Cliente", key: "name", width: 30 },
                      { header: "Email", key: "email", width: 25 },
                      { header: "Teléfono", key: "phone", width: 15 },
                      { header: "Última Visita", key: "last_visit", width: 15 },
                      {
                        header: "Días Inactivo",
                        key: "days_inactive",
                        width: 15,
                      },
                      {
                        header: "Total Gastado",
                        key: "total_spent",
                        format: "currency",
                        width: 15,
                      },
                    ],
                    data: data.clients,
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
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Última Visita
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Días Inactivo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total Gastado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.clients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{client.email || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {client.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {client.last_visit
                          ? new Date(client.last_visit).toLocaleDateString(
                              "es-ES",
                            )
                          : "Nunca"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            client.days_inactive === null
                              ? "bg-red-100 text-red-700"
                              : client.days_inactive > 90
                                ? "bg-red-100 text-red-700"
                                : client.days_inactive > 60
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {client.days_inactive === null
                            ? "Nunca"
                            : `${client.days_inactive} días`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(client.total_spent || 0)}
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
