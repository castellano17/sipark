import { useState, useEffect } from "react";
import { CreditCard, FileDown, Printer } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface SalesByPaymentMethodProps {
  onBack: () => void;
}

export function SalesByPaymentMethod({ onBack }: SalesByPaymentMethodProps) {
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

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window.api as any).getSalesByPaymentMethod(
        startDate,
        endDate,
      );
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    cash: "#10b981",
    card: "#3b82f6",
    transfer: "#8b5cf6",
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: any = {
      cash: "Efectivo",
      card: "Tarjeta",
      transfer: "Transferencia",
    };
    return labels[method] || method;
  };

  const handleExportExcel = () => {
    if (!data) return;

    exportToExcel({
      title: "Ventas por Método de Pago",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-metodo-pago-${startDate}-${endDate}`,
      columns: [
        { header: "Método de Pago", key: "payment_method", width: 20 },
        { header: "Transacciones", key: "transaction_count", width: 15 },
        { header: "Total", key: "total_amount", format: "currency", width: 15 },
        {
          header: "Ticket Promedio",
          key: "average_ticket",
          format: "currency",
          width: 15,
        },
        {
          header: "Porcentaje (%)",
          key: "percentage",
          width: 15,
        },
      ],
      data: data.methods,
      summary: [
        { label: "Total Ingresos", value: data.summary.totalRevenue },
        { label: "Total Transacciones", value: data.summary.totalTransactions },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Ventas por Método de Pago",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-metodo-pago-${startDate}-${endDate}`,
      columns: [
        { header: "Método", key: "payment_method" },
        { header: "Transacciones", key: "transaction_count" },
        { header: "Total", key: "total_amount", format: "currency" },
        { header: "%", key: "percentage" },
      ],
      data: data.methods,
      summary: [{ label: "Total Ingresos", value: data.summary.totalRevenue }],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Ventas por Método de Pago",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-metodo-pago-${startDate}-${endDate}`,
      columns: [
        { header: "Método de Pago", key: "payment_method" },
        { header: "Transacciones", key: "transaction_count" },
        { header: "Total", key: "total_amount", format: "currency" },
        { header: "Porcentaje (%)", key: "percentage" },
      ],
      data: data.methods,
      summary: [
        { label: "Total Ingresos", value: data.summary.totalRevenue },
        { label: "Total Transacciones", value: data.summary.totalTransactions },
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
            <h1 className="text-3xl font-bold">💳 Ventas por Método de Pago</h1>
            <p className="text-sm text-gray-600">
              Distribución de ventas por forma de pago
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-green-700">
                  Total Ingresos
                </p>
              </div>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-blue-700">
                  Total Transacciones
                </p>
              </div>
              <p className="text-lg font-bold text-blue-900 break-words">
                {data.summary.totalTransactions}
              </p>
            </Card>
          </div>

          {/* Gráfico y Tabla */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Gráfico Circular */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                Distribución por Método
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.methods}
                    dataKey="total_amount"
                    nameKey="payment_method"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.percentage.toFixed(1)}%`}
                  >
                    {data.methods.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[entry.payment_method as keyof typeof COLORS] ||
                          "#gray"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend formatter={(value) => getPaymentMethodLabel(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Tabla Detallada */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Detalle por Método</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Método
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">
                        Trans.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.methods.map((method: any) => (
                      <tr
                        key={method.payment_method}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {getPaymentMethodLabel(method.payment_method)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {method.transaction_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                          {formatCurrency(method.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {method.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
