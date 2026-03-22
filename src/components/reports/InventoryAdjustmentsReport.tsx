import { useState, useEffect } from "react";
import {
  Package,
  FileDown,
  Calendar,
  Search,
  User,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface InventoryAdjustmentsReportProps {
  onBack: () => void;
}

export function InventoryAdjustmentsReport({
  onBack,
}: InventoryAdjustmentsReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [userId, setUserId] = useState("");
  const [productId, setProductId] = useState<number | null>(null);
  const [adjustmentType, setAdjustmentType] = useState("");

  const { error } = useNotification();
  const { exportToExcel, exportToPDF } = useReportExport();

  useEffect(() => {
    loadProducts();
    loadReport();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await (window as any).api.getInventoryProducts();
      setProducts(result || []);
    } catch (err) {
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.getInventoryChangesReport(
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
        userId || null,
        productId,
      );

      // Filtrar por tipo de ajuste si se especifica
      if (adjustmentType && result.changes) {
        result.changes = result.changes.filter(
          (change: any) => change.adjustment_type === adjustmentType,
        );
      }

      setData(result);
    } catch (err) {
      error("Error al cargar el reporte de ajustes");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    if (!data || !data.changes || data.changes.length === 0) {
      error("No hay datos para exportar");
      return;
    }

    const exportData = data.changes.map((change: any) => ({
      Fecha: new Date(change.created_at).toLocaleString("es-ES"),
      Producto: change.product_name,
      Código: change.barcode || "-",
      "Tipo de Ajuste":
        change.adjustment_type === "increase" ? "Aumento" : "Disminución",
      Cantidad: change.quantity,
      "Stock Anterior": change.previous_stock,
      "Stock Nuevo": change.new_stock,
      Razón: change.reason,
      Notas: change.notes || "-",
      Usuario: change.created_by || "-",
    }));

    if (format === "excel") {
      exportToExcel(exportData, "ajustes-inventario");
    } else {
      exportToPDF(exportData, "Reporte de Ajustes de Inventario");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
          <Package className="w-8 h-8 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              📦 Ajustes de Inventario
            </h2>
            <p className="text-sm text-gray-600">
              Historial de ajustes manuales de stock
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <Package className="w-4 h-4 inline mr-1" />
              Producto
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={productId || ""}
              onChange={(e) =>
                setProductId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Todos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Tipo de Ajuste
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="increase">Aumento</option>
              <option value="decrease">Disminución</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={loadReport}
              className="bg-orange-600 hover:bg-orange-700 w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Ajustes</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.total_adjustments}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Aumentos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.increase_count}
                  </p>
                  <p className="text-xs text-gray-500">
                    +{data.stats.total_increases} unidades
                  </p>
                </div>
                <Package className="w-8 h-8 text-green-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Disminuciones</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.decrease_count}
                  </p>
                  <p className="text-xs text-gray-500">
                    -{data.stats.total_decreases} unidades
                  </p>
                </div>
                <Package className="w-8 h-8 text-red-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Productos Afectados
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.stats.affected_products}
                  </p>
                </div>
                <Package className="w-8 h-8 text-purple-600 mt-2" />
              </div>
            </Card>
          </div>

          {/* Adjustments by Type */}
          {data.byType && data.byType.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Ajustes por Tipo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.byType.map((type: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      type.adjustment_type === "increase"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="text-sm text-gray-600 mb-1">
                      {type.adjustment_type === "increase"
                        ? "Aumentos"
                        : "Disminuciones"}
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {type.count} ajustes
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Total: {type.adjustment_type === "increase" ? "+" : "-"}
                      {type.total_quantity} unidades
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Adjustments Table */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Historial de Ajustes ({data.changes.length})
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
                      Fecha/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo de Ajuste
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Stock Anterior
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Stock Nuevo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Razón
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.changes.map((change: any) => (
                    <tr key={change.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(change.created_at).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            {change.product_name}
                          </p>
                          {change.barcode && (
                            <p className="text-xs text-gray-500">
                              Código: {change.barcode}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            change.adjustment_type === "increase"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {change.adjustment_type === "increase"
                            ? "Aumento"
                            : "Disminución"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {change.adjustment_type === "increase" ? "+" : "-"}
                        {change.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {change.previous_stock}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {change.new_stock}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {change.reason}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {change.notes || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {change.created_by || "-"}
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
