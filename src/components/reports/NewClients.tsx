import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import { UserPlus } from "lucide-react";

interface NewClientsProps {
  onBack: () => void;
}

export default function NewClients({ onBack }: NewClientsProps) {
  const { formatCurrency } = useCurrency();
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

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getNewClients(startDate, endDate);
      setReportData(data);
    } catch (error) {
      console.error("Error cargando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

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
            <h1 className="text-3xl font-bold">👥 Nuevos Clientes</h1>
            <p className="text-sm text-gray-600">
              Clientes registrados recientemente
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
            <Button onClick={loadReport} className="w-full" disabled={loading}>
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </Card>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Nuevos Clientes
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {reportData.summary.totalNew}
              </p>
              <UserPlus className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Con Compras
              </p>
              <p className="text-2xl font-bold text-green-900">
                {reportData.summary.withPurchases}
              </p>
              <UserPlus className="w-4 h-4 text-green-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Ingresos
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(reportData.summary.totalRevenue)}
              </p>
              <UserPlus className="w-4 h-4 text-purple-500 mt-2" />
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Clientes Nuevos</h3>
              <Button
                onClick={() =>
                  exportToExcel(
                    reportData.clients.map((c: any) => ({
                      Cliente: c.name,
                      Email: c.email || "N/A",
                      Teléfono: c.phone || "N/A",
                      "Fecha Registro": c.registration_date,
                      "Primera Compra": c.first_purchase || "Sin compras",
                      "Total Compras": c.total_purchases || 0,
                      "Total Gastado": c.total_spent || 0,
                    })),
                  )
                }
                variant="outline"
                size="sm"
              >
                📊 Excel
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Cliente</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Teléfono</th>
                    <th className="p-2 text-left">Fecha Registro</th>
                    <th className="p-2 text-left">Primera Compra</th>
                    <th className="p-2 text-right">Compras</th>
                    <th className="p-2 text-right">Total Gastado</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.clients.map((client: any, index: number) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-2">{client.name}</td>
                      <td className="p-2">{client.email || "N/A"}</td>
                      <td className="p-2">{client.phone || "N/A"}</td>
                      <td className="p-2">
                        {new Date(
                          client.registration_date,
                        ).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {client.first_purchase
                          ? new Date(client.first_purchase).toLocaleDateString()
                          : "Sin compras"}
                      </td>
                      <td className="p-2 text-right">
                        {client.total_purchases || 0}
                      </td>
                      <td className="p-2 text-right">
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
