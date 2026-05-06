import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import { FileDown, FileSpreadsheet, Printer, Users } from "lucide-react";

interface ActiveClientsProps {
  onBack: () => void;
}

export default function ActiveClients({ onBack }: ActiveClientsProps) {
  const { formatCurrency } = useCurrency();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const [days, setDays] = useState(30);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getActiveClients(days);
      setReportData(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleExportExcel = () => {
    if (!reportData) return;
    exportToExcel({
      title: "Clientes Activos",
      filename: "clientes-activos",
      subtitle: `Últimos ${days} días`,
      columns: [
        { header: "Cliente", key: "name" },
        { header: "Email", key: "email" },
        { header: "Teléfono", key: "phone" },
        { header: "Última Visita", key: "last_visit", format: "date" },
        { header: "Total Visitas", key: "total_visits", format: "number" },
        { header: "Total Gastado", key: "total_spent", format: "currency" },
        { header: "Ticket Promedio", key: "avg_ticket", format: "currency" },
      ],
      data: reportData.clients,
    });
  };

  const pdfColumns = [
    { header: "Cliente", key: "name", width: 30 },
    { header: "Última Visita", key: "last_visit", format: "date" as const, width: 20 },
    { header: "Total Visitas", key: "total_visits", format: "number" as const, width: 15 },
    { header: "Total Gastado", key: "total_spent", format: "currency" as const, width: 20 },
    { header: "Ticket Promedio", key: "avg_ticket", format: "currency" as const, width: 20 },
  ];

  const handleExportPDF = () => {
    if (!reportData) return;
    exportToPDF({
      title: "Clientes Activos",
      filename: "clientes-activos",
      subtitle: `Últimos ${days} días`,
      columns: pdfColumns,
      data: reportData.clients,
    });
  };

  const handlePrint = () => {
    if (!reportData) return;
    printReport({
      title: "Clientes Activos",
      filename: "clientes-activos",
      subtitle: `Últimos ${days} días`,
      columns: pdfColumns,
      data: reportData.clients,
    });
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
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex items-center gap-1.5 whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex items-center gap-1.5 whitespace-nowrap">
            <FileDown className="w-4 h-4" />
            PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-1.5 whitespace-nowrap">
            <Printer className="w-4 h-4" />
            Imprimir
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
