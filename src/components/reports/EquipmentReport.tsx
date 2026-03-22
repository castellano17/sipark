import { useState, useEffect } from "react";
import { MonitorSpeaker, ShieldCheck, FileDown, Printer, AlertCircle } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface EquipmentReportProps {
  onBack: () => void;
}

export function EquipmentReport({ onBack }: EquipmentReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { error } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const eq = await window.api.getEquipment();
      const cats = await window.api.getEquipmentCategories();
      setCategories(cats);
      setData(eq);
    } catch (err) {
      error("Error cargando reporte de mobiliario y equipos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item: any) => {
    if (categoryFilter !== "all" && item.category_id?.toString() !== categoryFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  const getSummary = () => {
    const totalRecords = filteredData.length;
    const totalUnits = filteredData.reduce((acc, curr) => acc + curr.quantity, 0);
    const activeUnits = filteredData.filter(i => i.status === 'active').reduce((acc, curr) => acc + curr.quantity, 0);
    const maintenanceUnits = filteredData.filter(i => i.status === 'maintenance').reduce((acc, curr) => acc + curr.quantity, 0);
    return { totalRecords, totalUnits, activeUnits, maintenanceUnits };
  };

  const reportConfig = () => {
    const summaryData = getSummary();
    return {
      title: "Reporte de Inventario Fijo (Mobiliario y Equipos)",
      subtitle: `Generado el ${new Date().toLocaleDateString("es-ES")}`,
      filename: `mobiliario-${new Date().toISOString().split("T")[0]}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Equipo/Mobiliario", key: "name", width: 30 },
        { header: "Categoría", key: "category_name", width: 20 },
        { header: "Ubicación", key: "location", width: 20 },
        { header: "Estado", key: "status", width: 15 },
        { header: "Unidades (Físicas)", key: "quantity", width: 15 },
      ],
      data: filteredData.map(d => ({
        ...d,
        status: d.status === 'active' ? 'Operativo' : d.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo',
        category_name: d.category_name || "Sin Categoría",
        location: d.location || "N/A"
      })),
      summary: [
        { label: "Total Registros Distintos", value: summaryData.totalRecords },
        { label: "Total Unidades Físicas", value: summaryData.totalUnits },
        { label: "Unidades Operativas", value: summaryData.activeUnits },
        { label: "Unidades en Mantenimiento", value: summaryData.maintenanceUnits },
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando reporte de mobiliario...</p>
        </div>
      </div>
    );
  }

  const { totalUnits, activeUnits, maintenanceUnits } = getSummary();

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-indigo-900">🪑 Reporte de Mobiliario y Equipos</h1>
            <p className="text-sm text-gray-600">
              Inventario de activos fijos operativos y en mantenimiento
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
          <div>
            <label className="text-sm font-medium mb-2 block">Estado Operativo</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Operativos</option>
              <option value="maintenance">En Mantenimiento</option>
              <option value="inactive">Inactivos / Bajas</option>
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter("all");
                setStatusFilter("all");
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
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <MonitorSpeaker className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-indigo-700">Total Unidades Físicas</p>
          </div>
          <p className="text-3xl font-bold text-indigo-900">{totalUnits}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-green-700">Operativas</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{activeUnits}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-orange-700">En Mantenimiento</p>
          </div>
          <p className="text-3xl font-bold text-orange-900">{maintenanceUnits}</p>
        </Card>
      </div>

      {/* Tabla de Resultados */}
      <Card className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Detalle de Equipos</h3>
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
                <th className="px-4 py-3 text-left text-xs font-semibold">Equipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Ubicación</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">Cant. Física</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.map((item: any) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 ${
                    item.status === 'maintenance'
                      ? "bg-orange-50"
                      : item.status === 'inactive'
                        ? "bg-red-50 text-gray-500"
                        : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm">#{item.id}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-sm">{item.category_name || "-"}</td>
                  <td className="px-4 py-3 text-sm">{item.location || "-"}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'active'
                          ? "bg-green-100 text-green-700"
                          : item.status === 'maintenance'
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status === 'active' ? 'Operativo' : item.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{item.quantity}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No se encontró mobiliario con los filtros actuales.
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
