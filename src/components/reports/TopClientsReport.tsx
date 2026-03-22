import { useState, useEffect } from "react";
import { Award, FileDown, Printer } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopClientsReportProps {
  onBack: () => void;
}

export function TopClientsReport({ onBack }: TopClientsReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await window.api.getTopClientsReport(
        startDate,
        endDate,
        limit,
      );
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    exportToExcel({
      title: "Reporte de Clientes Top",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `clientes-top-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Cliente", key: "name", width: 25 },
        { header: "Teléfono", key: "phone", width: 15 },
        { header: "Compras", key: "total_purchases", width: 12 },
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
        { header: "Última Compra", key: "last_purchase", width: 20 },
      ],
      data: data.topClients,
      summary: [
        {
          label: "Total Clientes",
          value: data.topClients.length,
        },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Clientes Top",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `clientes-top-${startDate}-${endDate}`,
      columns: [
        { header: "Cliente", key: "name" },
        { header: "Teléfono", key: "phone" },
        { header: "Compras", key: "total_purchases" },
        { header: "Total Gastado", key: "total_spent", format: "currency" },
        {
          header: "Ticket Prom.",
          key: "average_ticket",
          format: "currency",
        },
      ],
      data: data.topClients,
      summary: [
        {
          label: "Total Clientes",
          value: data.topClients.length,
        },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Clientes Top",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `clientes-top-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id" },
        { header: "Cliente", key: "name" },
        { header: "Teléfono", key: "phone" },
        { header: "Compras", key: "total_purchases" },
        { header: "Total Gastado", key: "total_spent", format: "currency" },
        {
          header: "Ticket Promedio",
          key: "average_ticket",
          format: "currency",
        },
        { header: "Última Compra", key: "last_purchase" },
      ],
      data: data.topClients,
      summary: [
        {
          label: "Total Clientes",
          value: data.topClients.length,
        },
      ],
    });
  };

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🏆 Clientes Top</h1>
            <p className="text-sm text-gray-600">
              Ranking de mejores clientes por compras
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
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
              Cantidad de Clientes
            </label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              min="5"
              max="50"
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={loadReport} disabled={loading} className="flex-1">
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(
                  new Date(new Date().setDate(1)).toISOString().split("T")[0],
                );
                setEndDate(new Date().toISOString().split("T")[0]);
                setLimit(10);
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button variant="default">Por Gasto Total</Button>
            <Button
              variant="outline"
              onClick={() => {
                const temp = data.topClients;
                setData({
                  ...data,
                  topClients: data.frequentClients,
                  frequentClients: temp,
                });
              }}
            >
              Por Frecuencia
            </Button>
          </div>

          {/* Gráfico */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              Top {Math.min(5, data.topClients.length)} Clientes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topClients.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  style={{ fontSize: "12px" }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis style={{ fontSize: "12px" }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar
                  dataKey="total_spent"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Tabla de Clientes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Ranking de Clientes</h3>
              <div className="flex gap-2">
                <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Pos.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Compras
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total Gastado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Ticket Prom.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Última Compra
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topClients.map((client: any, index: number) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Award
                              className={`w-5 h-5 ${
                                index === 0
                                  ? "text-yellow-500"
                                  : index === 1
                                    ? "text-gray-400"
                                    : "text-orange-600"
                              }`}
                            />
                          )}
                          <span className="font-semibold">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 text-sm">{client.phone}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {client.total_purchases}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(client.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(client.average_ticket)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(client.last_purchase).toLocaleDateString(
                          "es-ES",
                        )}
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
