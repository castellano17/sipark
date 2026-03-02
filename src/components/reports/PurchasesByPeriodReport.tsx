import { useState, useEffect } from "react";
import { ShoppingCart, TrendingUp, FileDown, Printer } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PurchasesByPeriodReportProps {
  onBack: () => void;
}

export function PurchasesByPeriodReport({
  onBack,
}: PurchasesByPeriodReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
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
  const [supplierFilter, setSupplierFilter] = useState<string>("all");

  useEffect(() => {
    loadReport();
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const result = await window.api.getSuppliers();
      setSuppliers(result);
    } catch (err) {
      console.error("Error cargando proveedores:", err);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const supplierParam =
        supplierFilter && supplierFilter !== "all"
          ? parseInt(supplierFilter)
          : null;
      const result = await window.api.getPurchasesByPeriod(
        startDate,
        endDate,
        supplierParam,
      );
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  };

  const handleExportExcel = () => {
    if (!data) return;

    exportToExcel({
      title: "Reporte de Compras por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `compras-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Fecha", key: "invoice_date", width: 15 },
        { header: "Proveedor", key: "supplier_name", width: 25 },
        { header: "Total", key: "total", format: "currency", width: 15 },
        { header: "Notas", key: "notes", width: 30 },
      ],
      data: data.purchases,
      summary: [
        { label: "Total Compras", value: data.summary.totalPurchases },
        { label: "Monto Total", value: data.summary.totalAmount },
        { label: "Valor Promedio", value: data.summary.averageOrderValue },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Compras por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `compras-${startDate}-${endDate}`,
      columns: [
        { header: "Fecha", key: "invoice_date" },
        { header: "Proveedor", key: "supplier_name" },
        { header: "Total", key: "total", format: "currency" },
      ],
      data: data.purchases,
      summary: [
        { label: "Total Compras", value: data.summary.totalPurchases },
        { label: "Monto Total", value: data.summary.totalAmount },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Compras por Período",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `compras-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id" },
        { header: "Fecha", key: "invoice_date" },
        { header: "Proveedor", key: "supplier_name" },
        { header: "Total", key: "total", format: "currency" },
      ],
      data: data.purchases,
      summary: [
        { label: "Total Compras", value: data.summary.totalPurchases },
        { label: "Monto Total", value: data.summary.totalAmount },
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
            <h1 className="text-3xl font-bold">🛒 Compras por Período</h1>
            <p className="text-sm text-gray-600">
              Análisis de compras a proveedores
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
            <label className="text-sm font-medium mb-2 block">Proveedor</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Todos</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
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
                setSupplierFilter("all");
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-blue-700">
                  Total Compras
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {data.summary.totalPurchases}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-green-700">
                  Monto Total
                </p>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(data.summary.totalAmount)}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-purple-700">
                  Valor Promedio
                </p>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {formatCurrency(data.summary.averageOrderValue)}
              </p>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Compras por Día */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Compras por Día</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyPurchases}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Compras por Proveedor */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                Compras por Proveedor
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.bySupplier}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    style={{ fontSize: "11px" }}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="total_amount"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Tabla de Compras */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Compras</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
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

            {data.purchases.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay compras en este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Proveedor
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.purchases.map((purchase: any) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold">
                          #{purchase.id}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(purchase.invoice_date).toLocaleDateString(
                            "es-ES",
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {purchase.supplier_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                          {formatCurrency(purchase.total)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {purchase.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
