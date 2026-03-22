import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import { FileDown, Package, DollarSign } from "lucide-react";

interface InventoryValuationProps {
  onBack: () => void;
}

export default function InventoryValuation({
  onBack,
}: InventoryValuationProps) {
  const { formatCurrency } = useCurrency();
  const { exportToExcel } = useReportExport();

  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadReport();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await window.api.getCategories();
      setCategories(cats);
    } catch (error) {
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getInventoryValuation(
        categoryFilter,
      );
      setReportData(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold">
              📦 Valorización de Inventario
            </h1>
            <p className="text-sm text-gray-600">Valor total del inventario</p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Categoría</label>
            <select
              className="w-full p-2 border rounded"
              value={categoryFilter || ""}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={loadReport} disabled={loading} className="w-full">
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
                Total Productos
              </p>
              <p className="text-lg font-bold text-blue-900">
                {reportData.summary.totalProducts}
              </p>
              <Package className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Valor Total
              </p>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(reportData.summary.totalValue)}
              </p>
              <DollarSign className="w-4 h-4 text-green-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Unidades Totales
              </p>
              <p className="text-lg font-bold text-purple-900">
                {reportData.summary.totalUnits}
              </p>
              <Package className="w-4 h-4 text-purple-500 mt-2" />
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Productos</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Valorización de Inventario",
                    subtitle: categoryFilter
                      ? `Categoría: ${categories.find((c) => c.id === categoryFilter)?.name}`
                      : "Todas las categorías",
                    filename: `valorizacion-inventario-${new Date().toISOString().split("T")[0]}`,
                    columns: [
                      { header: "Producto", key: "name", width: 30 },
                      { header: "Categoría", key: "category_name", width: 20 },
                      { header: "Stock", key: "stock", width: 10 },
                      {
                        header: "Precio",
                        key: "price",
                        format: "currency",
                        width: 15,
                      },
                      {
                        header: "Valor Total",
                        key: "total_value",
                        format: "currency",
                        width: 15,
                      },
                    ],
                    data: reportData.products,
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
                      Producto
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
                  {reportData.products.map((product: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {product.category_name || "Sin categoría"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(product.total_value)}
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
