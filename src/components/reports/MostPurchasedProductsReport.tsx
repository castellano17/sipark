import { useState, useEffect } from "react";
import {
  ShoppingCart,
  FileDown,
  Calendar,
  Search,
  ArrowLeft,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface MostPurchasedProductsReportProps {
  onBack: () => void;
}

export function MostPurchasedProductsReport({
  onBack,
}: MostPurchasedProductsReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [limit, setLimit] = useState(20);

  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel, exportToPDF } = useReportExport();

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.getMostPurchasedProducts(
        startDate,
        endDate,
        limit,
      );
      setData(result);
    } catch (err) {
      error("Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    if (!data || !data.products || data.products.length === 0) {
      error("No hay datos para exportar");
      return;
    }

    const exportOptions = {
      title: "Productos Más Comprados",
      subtitle: `Período: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      filename: "productos-mas-comprados",
      columns: [
        { header: "#", key: "ranking", width: 8 },
        { header: "Producto", key: "name", width: 30 },
        { header: "Categoría", key: "category", width: 20 },
        {
          header: "Cantidad",
          key: "total_quantity",
          width: 12,
          format: "number" as const,
        },
        {
          header: "Costo Total",
          key: "total_cost",
          width: 15,
          format: "currency" as const,
        },
        {
          header: "Costo Promedio",
          key: "avg_unit_cost",
          width: 15,
          format: "currency" as const,
        },
        {
          header: "Órdenes",
          key: "purchase_count",
          width: 12,
          format: "number" as const,
        },
      ],
      data: data.products.map((product: any, idx: number) => ({
        ranking: idx + 1,
        name: product.name,
        category: product.category || "-",
        total_quantity: product.total_quantity,
        total_cost: product.total_cost,
        avg_unit_cost: product.avg_unit_cost,
        purchase_count: product.purchase_count,
      })),
      summary: [
        { label: "Productos Únicos", value: data.totals.unique_products },
        { label: "Cantidad Total", value: data.totals.total_quantity },
        { label: "Costo Total", value: data.totals.total_cost },
      ],
    };

    if (format === "excel") {
      exportToExcel(exportOptions);
    } else {
      exportToPDF(exportOptions);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-8 h-8 text-pink-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              🛒 Productos Más Comprados
            </h2>
            <p className="text-sm text-gray-600">
              Ranking de productos con mayor reposición
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Fin
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Top
            </label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={5}
              max={100}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={loadReport}
              className="bg-pink-600 hover:bg-pink-700 w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {data && data.totals && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Productos Únicos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.totals.unique_products || 0}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cantidad Total</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.totals.total_quantity || 0}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Costo Total</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {formatCurrency(data.totals.total_cost || 0)}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-purple-600 mt-2" />
              </div>
            </Card>
          </div>

          {/* Products Table */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Top {data.products?.length || 0} Productos
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport("excel")}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  onClick={() => handleExport("pdf")}
                  className="bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Costo Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Costo Promedio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Órdenes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.products && data.products.length > 0 ? (
                    data.products.map((product: any, idx: number) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          {product.category && (
                            <p className="text-xs text-gray-500">
                              {product.category}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {product.total_quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(product.total_cost)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {formatCurrency(product.avg_unit_cost)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {product.purchase_count}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No se encontraron productos</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
