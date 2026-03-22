import { useState, useEffect } from "react";
import { Layers, AlertTriangle, FileDown, Printer } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface SuppliesReportProps {
  onBack: () => void;
}

export function SuppliesReport({ onBack }: SuppliesReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { error } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supp = await window.api.getSupplies();
      const cats = await window.api.getSupplyCategories();
      setCategories(cats);
      setData(supp);
    } catch (err) {
      error("Error cargando reporte de insumos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item: any) => {
    if (categoryFilter !== "all" && item.category_id?.toString() !== categoryFilter) return false;
    if (lowStockOnly && item.stock >= item.min_stock) return false;
    return true;
  });

  const getSummary = () => {
    const totalItems = filteredData.length;
    const lowStockCount = filteredData.filter((i: any) => i.stock < i.min_stock && i.stock > 0).length;
    const outOfStockCount = filteredData.filter((i: any) => i.stock <= 0).length;
    return { totalItems, lowStockCount, outOfStockCount };
  };

  const reportConfig = () => {
    const summaryData = getSummary();
    return {
      title: "Reporte de Inventario de Insumos",
      subtitle: `Generado el ${new Date().toLocaleDateString("es-ES")}`,
      filename: `insumos-${new Date().toISOString().split("T")[0]}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Insumo", key: "name", width: 30 },
        { header: "Categoría", key: "category_name", width: 20 },
        { header: "Stock Actual", key: "stock", width: 15 },
        { header: "U. Medida", key: "unit_of_measure", width: 15 },
        { header: "Stock Mín.", key: "min_stock", width: 15 },
      ],
      data: filteredData.map(d => ({ ...d, category_name: d.category_name || "Sin Categoría" })),
      summary: [
        { label: "Total Registros", value: summaryData.totalItems },
        { label: "Insumos Stock Bajo", value: summaryData.lowStockCount },
        { label: "Insumos Agotados", value: summaryData.outOfStockCount },
      ],
    };
  };

  const handleExportExcel = () => exportToExcel(reportConfig());
  const handleExportPDF = () => exportToPDF(reportConfig());
  const handlePrint = () => printReport(reportConfig());

  if (loading && data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando reporte de insumos...</p>
        </div>
      </div>
    );
  }

  const { totalItems, lowStockCount, outOfStockCount } = getSummary();

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-emerald-900">📋 Reporte de Insumos</h1>
            <p className="text-sm text-gray-600">
              Estado actual de consumibles internos y materiales
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
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Solo stock crítico/bajo</span>
            </label>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter("all");
                setLowStockOnly(false);
              }}
              className="flex-1"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-emerald-700">Total Insumos Filtrados</p>
          </div>
          <p className="text-3xl font-bold text-emerald-900">{totalItems}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-orange-700">Stock Bajo</p>
          </div>
          <p className="text-3xl font-bold text-orange-900">{lowStockCount}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-red-700">Agotados (Stock &lt;= 0)</p>
          </div>
          <p className="text-3xl font-bold text-red-900">{outOfStockCount}</p>
        </Card>
      </div>

      {/* Tabla de Resultados */}
      <Card className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Detalle de Insumos</h3>
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
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Insumo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">U. Medida</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.map((item: any) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 ${
                    item.stock <= 0
                      ? "bg-red-50"
                      : item.stock < item.min_stock
                        ? "bg-orange-50"
                        : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm">#{item.id}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-sm">{item.category_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">
                    <span
                      className={`px-2 py-1 rounded ${
                        item.stock <= 0
                          ? "bg-red-200 text-red-700"
                          : item.stock < item.min_stock
                            ? "bg-orange-200 text-orange-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center uppercase text-gray-500">{item.unit_of_measure}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-400">{item.min_stock}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No se encontraron insumos con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
