import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import { Download, FileSpreadsheet, Users } from "lucide-react";

interface ActiveClientsProps {
  onBack: () => void;
}

export default function ActiveClients({ onBack }: ActiveClientsProps) {
  const { formatCurrency } = useCurrency();
  const { exportToExcel, exportToPDF } = useReportExport();

  const [days, setDays] = useState(30);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getActiveClients(days);
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

  const handleExportExcel = () => {
    if (!reportData) return;

    const data = reportData.clients.map((c: any) => ({
      Cliente: c.name,
      Email: c.email || "N/A",
      Teléfono: c.phone || "N/A",
      "Última Visita": c.last_visit,
      "Total Visitas": c.total_visits,
      "Total Gastado": c.total_spent,
      "Ticket Promedio": c.avg_ticket,
    }));

    exportToExcel(data, "clientes-activos");
  };

  const handleExportPDF = () => {
    if (!reportData) return;

    const columns = ["Cliente", "Última Visita", "Visitas", "Total Gastado"];
    const data = reportData.clients.map((c: any) => [
      c.name,
      new Date(c.last_visit).toLocaleDateString(),
      c.total_visits,
      formatCurrency(c.total_spent),
    ]);

    exportToPDF("Clientes Activos", columns, data, `Últimos ${days} días`);
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando reporte...</div>
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
            <h1 className="text-3xl font-bold">👥 Clientes Activos</h1>
            <p className="text-sm text-gray-600">
              Clientes con actividad reciente
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
                        className="h-8 w-8 p-0" onClick={handleExportExcel} variant="outline" size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button
                        className="h-8 w-8 p-0" onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Días de Actividad
            </label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min="1"
              max="365"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadReport} className="w-full" disabled={loading}>
              {loading ? "Cargando..." : "Generar Reporte"}
            </Button>
          </div>
        </div>
      </Card>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Clientes Activos
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {reportData.summary.totalActive}
              </p>
              <Users className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Ingresos Totales
              </p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(reportData.summary.totalRevenue)}
              </p>
              <Users className="w-4 h-4 text-green-500 mt-2" />
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detalle de Clientes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Cliente</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Teléfono</th>
                    <th className="p-2 text-left">Última Visita</th>
                    <th className="p-2 text-right">Visitas</th>
                    <th className="p-2 text-right">Total Gastado</th>
                    <th className="p-2 text-right">Ticket Prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.clients.map((client: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{client.name}</td>
                      <td className="p-2">{client.email || "N/A"}</td>
                      <td className="p-2">{client.phone || "N/A"}</td>
                      <td className="p-2">
                        {new Date(client.last_visit).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-right">{client.total_visits}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(client.total_spent)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(client.avg_ticket)}
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
