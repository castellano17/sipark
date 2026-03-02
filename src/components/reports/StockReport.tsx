import { useState, useEffect } from "react";
import { Package, AlertTriangle, FileDown, Printer } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface StockReportProps {
  onBack: () => void;
}

export function StockReport({ onBack }: StockReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    loadReport();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const products = await window.api.getInventoryProducts();
      // Extraer categorías únicas
      const uniqueCategories = [
        ...new Set(
          products
            .map((p: any) => p.category)
            .filter((c: string) => c && c.trim() !== ""),
        ),
      ].sort();
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      // Enviar null si categoryFilter está vacío o es "all"
      const categoryParam =
        categoryFilter && categoryFilter !== "all" ? categoryFilter : null;
      const result = await window.api.getStockReport(
        categoryParam,
        lowStockOnly,
      );
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    exportToExcel({
      title: "Reporte de Stock Actual",
      subtitle: `Generado el ${new Date().toLocaleDateString("es-ES")}`,
      filename: `stock-${new Date().toISOString().split("T")[0]}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Producto", key: "name", width: 30 },
        { header: "Tipo", key: "type", width: 15 },
        { header: "Categoría", key: "category", width: 20 },
        { header: "Stock", key: "stock", width: 12 },
        { header: "Precio", key: "price", format: "currency", width: 15 },
        {
          header: "Valor Total",
          key: "stock_value",
          format: "currency",
          width: 15,
        },
      ],
      data: data.products,
      summary: [
        { label: "Total Productos", value: data.summary.totalProducts },
        { label: "Valor Total Inventario", value: data.summary.totalValue },
        { label: "Productos Stock Bajo", value: data.summary.lowStockCount },
        { label: "Productos Agotados", value: data.summary.outOfStockCount },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Stock Actual",
      subtitle: `Generado el ${new Date().toLocaleDateString("es-ES")}`,
      filename: `stock-${new Date().toISOString().split("T")[0]}`,
      columns: [
        { header: "Producto", key: "name" },
        { header: "Categoría", key: "category" },
        { header: "Stock", key: "stock" },
        { header: "Precio", key: "price", format: "currency" },
        { header: "Valor", key: "stock_value", format: "currency" },
      ],
      data: data.products,
      summary: [
        { label: "Total Productos", value: data.summary.totalProducts },
        { label: "Valor Total", value: data.summary.totalValue },
        { label: "Stock Bajo", value: data.summary.lowStockCount },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Stock Actual",
      subtitle: `Generado el ${new Date().toLocaleDateString("es-ES")}`,
      filename: `stock-${new Date().toISOString().split("T")[0]}`,
      columns: [
        { header: "ID", key: "id" },
        { header: "Producto", key: "name" },
        { header: "Tipo", key: "type" },
        { header: "Categoría", key: "category" },
        { header: "Stock", key: "stock" },
        { header: "Precio", key: "price", format: "currency" },
        { header: "Valor Total", key: "stock_value", format: "currency" },
      ],
      data: data.products,
      summary: [
        { label: "Total Productos", value: data.summary.totalProducts },
        { label: "Valor Total Inventario", value: data.summary.totalValue },
        { label: "Productos Stock Bajo", value: data.summary.lowStockCount },
        { label: "Productos Agotados", value: data.summary.outOfStockCount },
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
            <h1 className="text-3xl font-bold">📦 Stock Actual</h1>
            <p className="text-sm text-gray-600">
              Inventario actual de productos y servicios
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Solo stock bajo</span>
            </label>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={loadReport} disabled={loading} className="flex-1">
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter("all");
                setLowStockOnly(false);
                // Recargar inmediatamente después de limpiar
                setTimeout(() => loadReport(), 0);
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
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-blue-700">
                  Total Productos
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {data.summary.totalProducts}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-green-700">
                  Valor Total
                </p>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(data.summary.totalValue)}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-orange-700">
                  Stock Bajo
                </p>
              </div>
              <p className="text-3xl font-bold text-orange-900">
                {data.summary.lowStockCount}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-red-700">Agotados</p>
              </div>
              <p className="text-3xl font-bold text-red-900">
                {data.summary.outOfStockCount}
              </p>
            </Card>
          </div>

          {/* Tabla de Productos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Inventario</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
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
                      ID
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
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Valor Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.products.map((product: any) => (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 ${
                        product.stock === 0
                          ? "bg-red-50"
                          : product.stock < 10
                            ? "bg-orange-50"
                            : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">#{product.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {product.type}
                      </td>
                      <td className="px-4 py-3 text-sm">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span
                          className={`px-2 py-1 rounded font-semibold ${
                            product.stock === 0
                              ? "bg-red-200 text-red-700"
                              : product.stock < 10
                                ? "bg-orange-200 text-orange-700"
                                : "bg-green-200 text-green-700"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(product.stock_value)}
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
