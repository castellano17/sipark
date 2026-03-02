import { useState, useEffect } from "react";
import { Package, AlertTriangle, FileDown, Printer } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface ProductsWithoutMovementProps {
  onBack: () => void;
}

export function ProductsWithoutMovement({
  onBack,
}: ProductsWithoutMovementProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const [days, setDays] = useState(30);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window.api as any).getProductsWithoutMovement(days);
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
      console.error(err);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📦 Productos Sin Movimiento</h1>
            <p className="text-sm text-gray-600">
              Productos que no se han vendido recientemente
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Días sin movimiento
            </label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              min="1"
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={loadReport} disabled={loading} className="flex-1">
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
            <Button variant="outline" onClick={() => setDays(30)}>
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-orange-700">
                  Productos Sin Movimiento
                </p>
              </div>
              <p className="text-lg font-bold text-orange-900 break-words">
                {data.summary.totalProducts}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-red-700">
                  Valor en Stock
                </p>
              </div>
              <p className="text-lg font-bold text-red-900 break-words">
                {formatCurrency(data.summary.totalStockValue)}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                Productos Sin Movimiento
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToExcel({
                      title: "Productos Sin Movimiento",
                      subtitle: `Más de ${days} días sin ventas`,
                      filename: `productos-sin-movimiento-${days}dias`,
                      columns: [
                        { header: "Producto", key: "name", width: 30 },
                        { header: "Categoría", key: "category", width: 20 },
                        { header: "Stock", key: "stock", width: 10 },
                        {
                          header: "Precio",
                          key: "price",
                          format: "currency",
                          width: 15,
                        },
                        {
                          header: "Valor Stock",
                          key: "stock_value",
                          format: "currency",
                          width: 15,
                        },
                        {
                          header: "Días sin venta",
                          key: "days_without_movement",
                          width: 15,
                        },
                      ],
                      data: data.products,
                      summary: [
                        {
                          label: "Total Productos",
                          value: data.summary.totalProducts,
                        },
                        {
                          label: "Valor Total",
                          value: data.summary.totalStockValue,
                        },
                      ],
                    });
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToPDF({
                      title: "Productos Sin Movimiento",
                      subtitle: `Más de ${days} días sin ventas`,
                      filename: `productos-sin-movimiento-${days}dias`,
                      columns: [
                        { header: "Producto", key: "name" },
                        { header: "Categoría", key: "category" },
                        { header: "Stock", key: "stock" },
                        { header: "Días", key: "days_without_movement" },
                      ],
                      data: data.products,
                      summary: [
                        {
                          label: "Total Productos",
                          value: data.summary.totalProducts,
                        },
                      ],
                    });
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            {data.products.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay productos sin movimiento</p>
                <p className="text-sm mt-2">
                  Todos los productos tienen ventas recientes
                </p>
              </div>
            ) : (
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
                        Valor Stock
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">
                        Días sin venta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.products.map((product: any) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {product.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {product.stock}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          {formatCurrency(product.stock_value)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              product.days_without_movement === null
                                ? "bg-red-100 text-red-700"
                                : product.days_without_movement > 90
                                  ? "bg-red-100 text-red-700"
                                  : product.days_without_movement > 60
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {product.days_without_movement === null
                              ? "Nunca"
                              : `${product.days_without_movement} días`}
                          </span>
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
