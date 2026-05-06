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

// Helper: badge de tipo de venta
function SaleTypeBadge({ type, name }: { type: string; name: string }) {
  const isMembership =
    type === "membership" || name.toLowerCase().includes("membres");
  const isPackage =
    type === "package" ||
    type === "time" ||
    name.toLowerCase().includes("paquete");

  if (isMembership) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
        🪪 Membresía
      </span>
    );
  }
  if (isPackage) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
        📦 Paquete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
      🛒 Producto
    </span>
  );
}

const getTypeName = (type: string, name: string) => {
  const isMembership =
    type === "membership" || name.toLowerCase().includes("membres");
  const isPackage =
    type === "package" ||
    type === "time" ||
    name.toLowerCase().includes("paquete");
  if (isMembership) return "Membresía";
  if (isPackage) return "Paquete";
  return "Producto";
};

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
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");

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
    } catch (err) {}
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const categoryParam =
        categoryFilter && categoryFilter !== "all" ? categoryFilter : null;

      // Fetch all products for the period first to avoid backend filtering issues with NULL types
      const result = await window.api.getSalesByProduct(
        startDate,
        endDate,
        categoryParam,
        "all",
      );

      // Apply the 'Tipo de Venta' filter in the frontend
      let finalProducts = result.products;
      if (saleTypeFilter && saleTypeFilter !== "all") {
        finalProducts = result.products.filter((p: any) => {
          const typeName = getTypeName(p.product_type, p.product_name);
          if (saleTypeFilter === "membership") return typeName === "Membresía";
          if (saleTypeFilter === "package") return typeName === "Paquete";
          if (saleTypeFilter === "product") return typeName === "Producto";
          return true;
        });
      }

      // Recalculate totals and percentages based on filtered results
      const totalRevenue = finalProducts.reduce(
        (sum: number, p: any) => sum + (Number(p.revenue) || 0),
        0,
      );
      const totalQuantity = finalProducts.reduce(
        (sum: number, p: any) => sum + (Number(p.quantity_sold) || 0),
        0,
      );

      const productsWithUpdatedPercentages = finalProducts.map((p: any) => ({
        ...p,
        revenue_percentage:
          totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
        quantity_percentage:
          totalQuantity > 0 ? (p.quantity_sold / totalQuantity) * 100 : 0,
      }));

      setData({
        ...result,
        products: productsWithUpdatedPercentages,
        topProducts: productsWithUpdatedPercentages.slice(0, 5),
        summary: {
          totalRevenue,
          totalQuantity,
          totalProducts: finalProducts.length,
          averageRevenuePerProduct:
            finalProducts.length > 0 ? totalRevenue / finalProducts.length : 0,
        },
      });
    } catch (err) {
      error("Error cargando reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    const mappedProducts = data.products.map((p: any) => ({
      ...p,
      product_type: getTypeName(p.product_type, p.product_name),
    }));

    exportToExcel({
      title: "Reporte de Ventas por Producto",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-producto-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "product_id", width: 10 },
        { header: "Producto", key: "product_name", width: 30 },
        { header: "Tipo", key: "product_type", width: 15 },
        { header: "Categoría", key: "category", width: 20 },
        { header: "Cantidad", key: "quantity_sold", width: 12 },
        { header: "Ingresos", key: "revenue", format: "currency", width: 15 },
        { header: "% Ingresos", key: "revenue_percentage", width: 12 },
        { header: "Transacciones", key: "transactions", width: 15 },
      ],
      data: mappedProducts,
      summary: [
        { label: "Total Productos", value: data.summary.totalProducts },
        { label: "Total Ingresos", value: data.summary.totalRevenue },
        { label: "Total Cantidad", value: data.summary.totalQuantity },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    // Sanitizar datos para evitar null/undefined
    const safeProducts = data.products.map((p: any) => {
      const safe: any = {};
      [
        "product_name",
        "product_type",
        "category",
        "quantity_sold",
        "revenue",
        "revenue_percentage",
      ].forEach((k) => {
        let v = p[k];
        if (
          v === null ||
          v === undefined ||
          (typeof v === "number" && isNaN(v))
        )
          v = "-";
        safe[k] = v;
      });
      return safe;
    });
    // Definir columnas sin funciones para exportar a PDF
    const pdfColumns = [
      { header: "Producto", key: "product_name" },
      { header: "Tipo", key: "product_type" },
      { header: "Categoría", key: "category" },
      { header: "Cantidad", key: "quantity_sold" },
      { header: "Ingresos", key: "revenue", format: "currency" },
      { header: "% Ingresos", key: "revenue_percentage" },
    ];
    exportToPDF({
      title: "Reporte de Ventas por Producto",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-producto-${startDate}-${endDate}`,
      columns: pdfColumns,
      data: safeProducts,
      summary: [
        { label: "Total Ingresos", value: data.summary.totalRevenue },
        { label: "Total Cantidad", value: data.summary.totalQuantity },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    const printProducts = data.products.map((p: any) => ({
      ...p,
      product_type: getTypeName(p.product_type, p.product_name),
    }));

    printReport({
      title: "Reporte de Ventas por Producto",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `ventas-producto-${startDate}-${endDate}`,
      columns: [
        { header: "Producto", key: "product_name" },
        { header: "Tipo", key: "product_type" },
        { header: "Categoría", key: "category" },
        { header: "Cantidad", key: "quantity_sold" },
        { header: "Ingresos", key: "revenue", format: "currency" },
        { header: "% Ingresos", key: "revenue_percentage" },
        { header: "Transacciones", key: "transactions" },
      ],
      data: printProducts,
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
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printReport}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo</label>
            <select
              value={saleTypeFilter}
              onChange={(e) => setSaleTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Todos</option>
              <option value="product">🛒 Producto</option>
              <option value="package">📦 Paquete</option>
              <option value="membership">🪪 Membresía</option>
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
                setSaleTypeFilter("all");
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <h3 className="font-semibold text-lg">
                Detalle de Todos los Productos
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
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
                      Tipo
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
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.products.map((product: any, index: number) => (
                    <tr
                      key={`${product.product_id}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {product.product_name}
                      </td>
                      <td className="px-4 py-3">
                        <SaleTypeBadge
                          type={product.product_type}
                          name={product.product_name}
                        />
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
