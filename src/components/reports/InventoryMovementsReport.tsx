import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  FileDown,
  Printer,
  AlertCircle,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface InventoryMovementsReportProps {
  onBack: () => void;
}

export function InventoryMovementsReport({
  onBack,
}: InventoryMovementsReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const { error } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [productFilter, setProductFilter] = useState<string>("all");

  useEffect(() => {
    loadReport();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await window.api.getInventoryProducts();
      setProducts(result);
    } catch (err) {
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const productParam =
        productFilter && productFilter !== "all"
          ? parseInt(productFilter)
          : null;
      const result = await window.api.getInventoryMovements(
        startDate,
        endDate,
        productParam,
      );
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "add":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "subtract":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case "correction":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "add":
        return "Entrada";
      case "subtract":
        return "Salida";
      case "correction":
        return "Corrección";
      default:
        return type;
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    exportToExcel({
      title: "Reporte de Movimientos de Inventario",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `movimientos-inventario-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Fecha", key: "created_at", format: "datetime", width: 20 },
        { header: "Producto", key: "product_name", width: 30 },
        { header: "Categoría", key: "category", width: 20 },
        { header: "Tipo", key: "adjustment_type", width: 15 },
        { header: "Cantidad", key: "quantity", width: 12 },
        { header: "Razón", key: "reason", width: 30 },
        { header: "Usuario", key: "created_by", width: 20 },
      ],
      data: data.movements,
      summary: [
        { label: "Total Movimientos", value: data.summary.totalMovements },
        { label: "Entradas", value: data.summary.additions },
        { label: "Salidas", value: data.summary.subtractions },
        { label: "Total Agregado", value: data.summary.totalAdded },
        { label: "Total Retirado", value: data.summary.totalSubtracted },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Movimientos de Inventario",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `movimientos-inventario-${startDate}-${endDate}`,
      columns: [
        { header: "Fecha", key: "created_at", format: "datetime" },
        { header: "Producto", key: "product_name" },
        { header: "Tipo", key: "adjustment_type" },
        { header: "Cantidad", key: "quantity" },
        { header: "Razón", key: "reason" },
      ],
      data: data.movements,
      summary: [
        { label: "Total Movimientos", value: data.summary.totalMovements },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Movimientos de Inventario",
      subtitle: `Del ${startDate} al ${endDate}`,
      filename: `movimientos-inventario-${startDate}-${endDate}`,
      columns: [
        { header: "Fecha", key: "created_at", format: "datetime" },
        { header: "Producto", key: "product_name" },
        { header: "Categoría", key: "category" },
        { header: "Tipo", key: "adjustment_type" },
        { header: "Cantidad", key: "quantity" },
        { header: "Razón", key: "reason" },
        { header: "Usuario", key: "created_by" },
      ],
      data: data.movements,
      summary: [
        { label: "Total Movimientos", value: data.summary.totalMovements },
        { label: "Total Agregado", value: data.summary.totalAdded },
        { label: "Total Retirado", value: data.summary.totalSubtracted },
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
            <h1 className="text-3xl font-bold">📦 Movimientos de Inventario</h1>
            <p className="text-sm text-gray-600">
              Historial de entradas y salidas de productos
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
            <label className="text-sm font-medium mb-2 block">Producto</label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Todos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
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
                const date = new Date();
                date.setDate(date.getDate() - 7);
                setStartDate(date.toISOString().split("T")[0]);
                setEndDate(new Date().toISOString().split("T")[0]);
                setProductFilter("all");
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-blue-700">
                  Total Movimientos
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {data.summary.totalMovements}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-green-700">Entradas</p>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {data.summary.additions}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-red-700">Salidas</p>
              </div>
              <p className="text-3xl font-bold text-red-900">
                {data.summary.subtractions}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-orange-700">
                  Correcciones
                </p>
              </div>
              <p className="text-3xl font-bold text-orange-900">
                {data.summary.corrections}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-purple-700">
                  Balance Neto
                </p>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                +{data.summary.totalAdded - data.summary.totalSubtracted}
              </p>
            </Card>
          </div>

          {/* Tabla de Movimientos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                Historial de Movimientos
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

            {data.movements.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay movimientos en este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Fecha/Hora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Categoría
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Razón
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Usuario
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.movements.map((movement: any) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(movement.created_at).toLocaleString(
                            "es-ES",
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {movement.product_name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {movement.category}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getMovementIcon(movement.adjustment_type)}
                            <span className="text-xs font-semibold">
                              {getMovementLabel(movement.adjustment_type)}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-bold ${
                            movement.adjustment_type === "add"
                              ? "text-green-600"
                              : movement.adjustment_type === "subtract"
                                ? "text-red-600"
                                : "text-orange-600"
                          }`}
                        >
                          {movement.adjustment_type === "add" ? "+" : ""}
                          {movement.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm">{movement.reason}</td>
                        <td className="px-4 py-3 text-sm">
                          {movement.created_by}
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
