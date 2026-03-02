import { useState, useEffect } from "react";
import { Users, FileDown } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface FrequentClientsProps {
  onBack: () => void;
}

export function FrequentClients({ onBack }: FrequentClientsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [minVisits, setMinVisits] = useState(5);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window.api as any).getFrequentClients(
        startDate,
        endDate,
        minVisits,
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
            <h1 className="text-3xl font-bold">👥 Clientes Frecuentes</h1>
            <p className="text-sm text-gray-600">Clientes con más visitas</p>
          </div>
        </div>
      </div>

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
            <label className="text-sm font-medium mb-2 block">
              Mínimo Visitas
            </label>
            <Input
              type="number"
              value={minVisits}
              onChange={(e) => setMinVisits(parseInt(e.target.value) || 5)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Total Clientes
              </p>
              <p className="text-lg font-bold text-blue-900">
                {data.summary.totalClients}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Total Visitas
              </p>
              <p className="text-lg font-bold text-green-900">
                {data.summary.totalVisits}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Ingresos Totales
              </p>
              <p className="text-lg font-bold text-purple-900 break-words">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Clientes Frecuentes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Clientes Frecuentes",
                    subtitle: `Del ${startDate} al ${endDate}`,
                    filename: `clientes-frecuentes-${startDate}-${endDate}`,
                    columns: [
                      { header: "Cliente", key: "name", width: 30 },
                      { header: "Email", key: "email", width: 25 },
                      { header: "Teléfono", key: "phone", width: 15 },
                      { header: "Visitas", key: "visit_count", width: 10 },
                      {
                        header: "Total Gastado",
                        key: "total_spent",
                        format: "currency",
                        width: 15,
                      },
                      {
                        header: "Ticket Promedio",
                        key: "average_ticket",
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
                      Visitas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total Gastado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Ticket Prom.
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
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {client.visit_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(client.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(client.average_ticket)}
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
