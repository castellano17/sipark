import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  FileDown,
  Printer,
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface SalesByProductReportProps {
  onBack: () => void;
}

export function SalesByProductReport({ onBack }: SalesByProductReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadReport();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const products = await window.api.getInventoryProducts();
      const uniqueCategories = [
        ...new Set(
          products
            .map((p: any) => p.category)
            .filter((c: string) => c && c.trim() !== ""),
        ),
      ].sort();
      setCategories(uniqueCategories);
    } catch (err) {
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const categoryParam =
        categoryFilter && categoryFilter !== "all" ? categoryFilter : null;
      const result = await window.api.getSalesByProduct(
        startDate,
        endDate,
        categoryParam,
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
      title: "Reporte de Ventas por Producto",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-producto-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "product_id", width: 10 },
        { header: "Producto", key: "product_name", width: 30 },
        { header: "Categoría", key: "category", width: 20 },
        { header: "Cantidad", key: "quantity_sold", width: 12 },
        { header: "Ingresos", key: "revenue", format: "currency", width: 15 },
        { header: "% Ingresos", key: "revenue_percentage", width: 12 },
        { header: "Transacciones", key: "transactions", width: 15 },
      ],
      data: data.products,
      summary: [
        { label: "Total Productos", value: data.summary.totalProducts },
        { label: "Total Ingresos", value: data.summary.totalRevenue },
        { label: "Total Cantidad", value: data.summary.totalQuantity },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Ventas por Producto",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-producto-${startDate}-${endDate}`,
      columns: [
        { header: "Producto", key: "product_name" },
        { header: "Categoría", key: "category" },
        { header: "Cantidad", key: "quantity_sold" },
        { header: "Ingresos", key: "revenue", format: "currency" },
        { header: "% Ingresos", key: "revenue_percentage" },
      ],
      data: data.products,
      summary: [
        { label: "Total Ingresos", value: data.summary.totalRevenue },
        { label: "Total Cantidad", value: data.summary.totalQuantity },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Ventas por Producto",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-producto-${startDate}-${endDate}`,
      columns: [
        { header: "Producto", key: "product_name" },
        { header: "Categoría", key: "category" },
        { header: "Cantidad", key: "quantity_sold" },
        { header: "Ingresos", key: "revenue", format: "currency" },
        { header: "% Ingresos", key: "revenue_percentage" },
        { header: "Transacciones", key: "transactions" },
      ],
      data: data.products,
      summary: [
        { label: "Total Productos", value: data.summary.totalProducts },
        { label: "Total Ingresos", value: data.summary.totalRevenue },
      ],
    });
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

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
            <h1 className="text-3xl font-bold">📦 Ventas por Producto</h1>
            <p className="text-sm text-gray-600">
              Análisis de productos más vendidos
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
            <label className="text-sm font-medium mb-2 block">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
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
                setCategoryFilter("all");
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-green-700">
                  Total Ingresos
                </p>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-blue-700">
                  Cantidad Vendida
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {data.summary.totalQuantity}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-purple-700">
                  Total Productos
                </p>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {data.summary.totalProducts}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-orange-700">
                  Ingreso Promedio
                </p>
              </div>
              <p className="text-3xl font-bold text-orange-900">
                {formatCurrency(data.summary.averageRevenuePerProduct)}
              </p>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Top 5 Productos */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Top 5 Productos Más Vendidos
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="product_name"
                    style={{ fontSize: "11px" }}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Distribución por Categoría */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                Distribución de Ingresos
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.topProducts}
                    dataKey="revenue"
                    nameKey="product_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) =>
                      `${Number(entry.revenue_percentage).toFixed(1)}%`
                    }
                  >
                    {data.topProducts.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Bottom 5 */}
          {data.bottomProducts.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Productos Menos Vendidos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {data.bottomProducts.map((product: any) => (
                  <div
                    key={product.product_id}
                    className="p-4 bg-red-50 rounded-lg"
                  >
                    <p className="text-sm font-medium mb-1">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      {product.category}
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      {product.quantity_sold} unid.
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tabla Completa */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                Detalle de Todos los Productos
              </h3>
              <div className="flex gap-2">
                <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
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
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Ingresos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      % Ingresos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Transacciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.products.map((product: any, index: number) => (
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {product.product_name}
                      </td>
                      <td className="px-4 py-3 text-sm">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {product.quantity_sold}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {Number(product.revenue_percentage).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {product.transactions}
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
