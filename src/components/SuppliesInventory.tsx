import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Settings2, RefreshCw, Layers, FileDown, Printer } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { useReportExport } from "../hooks/useReportExport";


interface SupplyCategory {
  id: number;
  name: string;
}

interface Supply {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  stock: number;
  unit_of_measure: string;
  min_stock: number;
  barcode?: string;
}

interface SupplyAdjustment {
  id: number;
  adjustment_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  notes: string;
  user_name: string;
  created_at: string;
}

export function SuppliesInventory() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [categories, setCategories] = useState<SupplyCategory[]>([]);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [auditLogs, setAuditLogs] = useState<SupplyAdjustment[]>([]);
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { success, error } = useNotification();
  // Permissions not currently required for this component view

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    stock: "0",
    unit_of_measure: "unidades",
    min_stock: "0",
    barcode: "",
    autoGenerateBarcode: true,
  });

  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const getSummary = () => {
    const totalItems = supplies.length;
    const lowStockCount = supplies.filter((i) => i.stock < i.min_stock && i.stock > 0).length;
    return { totalItems, lowStockCount };
  };

  const reportConfig = () => {
    const summaryData = getSummary();
    const filteredForExport = categoryFilter === "all" ? supplies : supplies.filter((s) => s.category_id?.toString() === categoryFilter);
    return {
      title: "Inventario Interno de Insumos",
      subtitle: `Generado el ${new Date().toLocaleDateString("es-ES")}`,
      filename: `insumos-${new Date().toISOString().split("T")[0]}`,
      columns: [
        { header: "Cód. Barras", key: "barcode", width: 15 },
        { header: "Insumo", key: "name", width: 30 },
        { header: "Categoría", key: "category_name", width: 20 },
        { header: "Stock", key: "stock", width: 15 },
        { header: "Unidad", key: "unit_of_measure", width: 15 },
      ],
      data: filteredForExport.map(d => ({ ...d, category_name: d.category_name || "Sin Categoría", barcode: d.barcode || "-" })),
      summary: [
        { label: "Total Registros", value: summaryData.totalItems },
        { label: "Insumos Stock Bajo", value: summaryData.lowStockCount },
      ],
    };
  };

  const [adjustData, setAdjustData] = useState({
    type: "out",
    quantity: "1",
    reason: "",
    notes: "",
  });

  const adjustmentTypes = [
    { value: "in", label: "Entrada (Compra/Hallazgo)", color: "text-green-600" },
    { value: "out", label: "Salida / Consumo Interno", color: "text-orange-600" },
    { value: "loss", label: "Merma / Pérdida / Vencimiento", color: "text-red-600" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supp = await window.api.getSupplies();
      const cats = await window.api.getSupplyCategories();
      setSupplies(supp);
      setCategories(cats);
    } catch (err) {
      error("Error cargando insumos");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      error("Ingrese un nombre para la categoría");
      return;
    }
    try {
      await window.api.createSupplyCategory(newCategoryName.trim());
      success("Categoría creada");
      setNewCategoryName("");
      setShowCategoryModal(false);
      loadData();
    } catch (err) {
      error("Error creando categoría");
    }
  };

  const handleSubmitSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.unit_of_measure) {
      error("Complete los campos requeridos");
      return;
    }

    try {
      const barcodeValue = formData.autoGenerateBarcode ? "" : formData.barcode;

      if (editingSupply) {
        await window.api.updateSupply(
          editingSupply.id,
          formData.name,
          formData.category_id ? parseInt(formData.category_id) : null,
          parseFloat(formData.stock) || 0,
          formData.unit_of_measure,
          parseFloat(formData.min_stock) || 0,
          barcodeValue
        );
        success("Insumo actualizado");
      } else {
        await window.api.createSupply(
          formData.name,
          formData.category_id ? parseInt(formData.category_id) : null,
          parseFloat(formData.stock) || 0,
          formData.unit_of_measure,
          parseFloat(formData.min_stock) || 0,
          barcodeValue
        );
        success("Insumo creado");
      }
      setShowSupplyModal(false);
      setEditingSupply(null);
      loadData();
    } catch (err) {
      error("Error guardando insumo");
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupply || !adjustData.quantity || parseFloat(adjustData.quantity) <= 0) {
      error("Datos inválidos");
      return;
    }

    try {
      await window.api.adjustSupplyStock(
        selectedSupply.id,
        adjustData.type,
        parseFloat(adjustData.quantity),
        adjustData.reason || "Ajuste manual",
        adjustData.notes,
        1 // Default to user 1 for simplicity here, ideally getting from currentUser
      );
      success("Stock ajustado correctamente");
      setShowAdjustModal(false);
      loadData();
    } catch (err) {
      error("Error al ajustar stock");
    }
  };

  const openAudit = async (supply: Supply) => {
    try {
      const logs = await window.api.getSupplyAdjustments(supply.id);
      setAuditLogs(logs);
      setSelectedSupply(supply);
      setShowAuditModal(true);
    } catch (err) {
      error("Error obteniendo historial");
    }
  };

  const handleDeleteSupply = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este insumo?")) {
      try {
        await window.api.deleteSupply(id);
        success("Insumo eliminado");
        loadData();
      } catch (err) {
        error("No se pudo eliminar el insumo. Verifica que no tenga ajustes previos.");
      }
    }
  };

  const filteredSupplies =
    categoryFilter === "all"
      ? supplies
      : supplies.filter((s) => s.category_id?.toString() === categoryFilter);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-emerald-500 pl-3">
              Inventario de Insumos
            </h1>
            <p className="text-sm text-gray-500 mt-1 pl-3">
              Control de consumibles, ingredientes y productos internos.
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap md:justify-end w-full md:w-auto">
            <div className="flex gap-2 mr-2 md:mr-4 border-r pr-2 md:pr-4">
              <Button variant="outline" size="sm" onClick={() => exportToExcel(reportConfig())} title="Exportar a Excel">
                <FileDown className="w-4 h-4 text-emerald-600" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToPDF(reportConfig())} title="Exportar a PDF">
                <FileDown className="w-4 h-4 text-red-600" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => printReport(reportConfig())} title="Imprimir">
                <Printer className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(true)}>
              <Settings2 className="w-4 h-4 mr-2" />
              Categorías
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingSupply(null);
                setFormData({ name: "", category_id: "", stock: "0", unit_of_measure: "unidades", min_stock: "0", barcode: "", autoGenerateBarcode: true });
                setShowSupplyModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Insumo
            </Button>
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            onClick={() => setCategoryFilter("all")}
            className={categoryFilter === "all" ? "bg-slate-800" : ""}
          >
            Todos
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.id.toString() ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat.id.toString())}
              className={categoryFilter === cat.id.toString() ? "bg-slate-800" : ""}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">Cód. Barras</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Insumo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Categoría</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">Stock Actual</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">Unidad</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">Mínimo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredSupplies.map((sup) => (
                <tr key={sup.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{sup.barcode || "-"}</td>
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    {sup.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{sup.category_name || "-"}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">
                    {sup.stock}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 uppercase text-xs">
                    {sup.unit_of_measure}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {sup.min_stock}
                  </td>
                  <td className="px-4 py-3 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setSelectedSupply(sup);
                        setAdjustData({ type: "out", quantity: "1", reason: "", notes: "" });
                        setShowAdjustModal(true);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" /> Ajustar Stock
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openAudit(sup)}
                      title="Ver Historial"
                    >
                      Historial
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingSupply(sup);
                        setFormData({
                          name: sup.name,
                          category_id: sup.category_id?.toString() || "",
                          stock: sup.stock.toString(),
                          unit_of_measure: sup.unit_of_measure,
                          min_stock: sup.min_stock.toString(),
                          barcode: sup.barcode || "",
                          autoGenerateBarcode: !sup.barcode
                        });
                        setShowSupplyModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSupply(sup.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredSupplies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No se encontraron insumos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </Card>
      </div>

      {/* MODALS */}
      {/* Create / Edit Supply */}
      {showSupplyModal && (
        <Dialog open={showSupplyModal} onOpenChange={setShowSupplyModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">
                  {editingSupply ? "Editar Insumo" : "Nuevo Insumo"}
                </h2>
              </div>
              <form onSubmit={handleSubmitSupply} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Tomate"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border space-y-3 mt-2 mb-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Cód. de Barras Único</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoGenerateBarcode}
                        onChange={(e) => setFormData({ ...formData, autoGenerateBarcode: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Generar código automático</span>
                    </label>
                  </div>
                  {!formData.autoGenerateBarcode && (
                    <Input
                      placeholder="Escanee o escriba el código de barras"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      required={!formData.autoGenerateBarcode}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Seleccione...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">U. de Medida</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.unit_of_measure}
                      onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                    >
                      <option value="unidades">Unidades</option>
                      <option value="libras">Libras (lbs)</option>
                      <option value="kilos">Kilos (kg)</option>
                      <option value="onzas">Onzas (oz)</option>
                      <option value="litros">Litros (lt)</option>
                      <option value="galones">Galones (gal)</option>
                      <option value="paquetes">Paquetes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Actual</label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Mínimo (Alerta)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setShowSupplyModal(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Guardar
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Adjust Stock */}
      {showAdjustModal && selectedSupply && (
        <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm bg-white">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Ajustar Insumo</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedSupply.name}</p>
              </div>
              <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Ajuste</label>
                  <div className="space-y-2">
                    {adjustmentTypes.map((type) => (
                      <label key={type.value} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="adj_type"
                          value={type.value}
                          checked={adjustData.type === type.value}
                          onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                        />
                        <span className={`text-sm font-semibold ${type.color}`}>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad a ajustar ({selectedSupply.unit_of_measure})</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notas / Motivo</label>
                  <Input
                    value={adjustData.notes}
                    onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                    placeholder="Opcional. Ej: Consumo de cocina fin de semana."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setShowAdjustModal(false)}>Cancelar</Button>
                  <Button type="submit">Aplicar Ajuste</Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm bg-white p-6">
              <h2 className="text-xl font-bold mb-4">Nueva Categoría (Insumos)</h2>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Cocina"
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)}>Cancelar</Button>
                <Button type="button" onClick={handleCreateCategory}>Crear</Button>
              </div>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Audit Modal */}
      {showAuditModal && selectedSupply && (
         <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <Card className="w-full max-w-2xl bg-white max-h-[90vh] flex flex-col">
             <div className="p-6 border-b">
               <h2 className="text-xl font-bold">Historial: {selectedSupply.name}</h2>
             </div>
             <div className="overflow-y-auto p-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Acción</th>
                      <th className="px-4 py-2 text-right">Cant.</th>
                      <th className="px-4 py-2 text-right">Nuevo Stock</th>
                      <th className="px-4 py-2 text-left">Motivo/User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-2 text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 font-medium capitalize">
                          {log.adjustment_type}
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${log.adjustment_type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                          {log.adjustment_type === 'in' ? '+' : '-'}{log.quantity}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-700">
                          {log.new_stock}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                           {log.notes || log.reason} <br/>
                           <span className="text-gray-400">Por: {log.user_name || 'Sistema'}</span>
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-4 text-gray-500">No hay movimientos registrados.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
             <div className="p-4 border-t flex justify-end">
               <Button onClick={() => setShowAuditModal(false)}>Cerrar</Button>
             </div>
           </Card>
         </div>
       </Dialog>
      )}
    </div>
  );
}
