import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Settings2, ShieldCheck, MonitorSpeaker, FileDown, Printer } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { useReportExport } from "../hooks/useReportExport";
import { usePermissions } from "../hooks/usePermissions";

interface EquipmentCategory {
  id: number;
  name: string;
}

interface Equipment {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  quantity: number;
  status: string;
  location: string;
  barcode?: string;
}

interface EquipmentAdjustment {
  id: number;
  adjustment_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  notes: string;
  user_name: string;
  created_at: string;
}

export function EquipmentInventory() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [showEqModal, setShowEqModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);
  const [auditLogs, setAuditLogs] = useState<EquipmentAdjustment[]>([]);
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { success, error } = useNotification();
  // Permissions not currently required for this component view

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    quantity: "0",
    status: "active",
    location: "",
    barcode: "",
    autoGenerateBarcode: true,
  });

  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  const getSummary = () => {
    const totalItems = equipmentList.length;
    const maintenanceCount = equipmentList.filter((i) => i.status === "maintenance").length;
    const inactiveCount = equipmentList.filter((i) => i.status === "inactive").length;
    return { totalItems, maintenanceCount, inactiveCount };
  };

  const reportConfig = () => {
    const summaryData = getSummary();
    const filteredForExport = categoryFilter === "all" ? equipmentList : equipmentList.filter((e) => e.category_id?.toString() === categoryFilter);
    return {
      title: "Inventario de Mobiliario y Equipos",
      subtitle: `Generado el ${new Date().toLocaleDateString("es-ES")}`,
      filename: `mobiliario-${new Date().toISOString().split("T")[0]}`,
      columns: [
        { header: "Cód. Barras", key: "barcode", width: 15 },
        { header: "Mobiliario", key: "name", width: 30 },
        { header: "Categoría", key: "category_name", width: 20 },
        { header: "Unidades", key: "quantity", width: 10 },
        { header: "Ubicación", key: "location", width: 20 },
        { header: "Estado", key: "status", width: 15 },
      ],
      data: filteredForExport.map(d => ({
        ...d,
        category_name: d.category_name || "Sin Categoría",
        location: d.location || "No asignada",
        barcode: d.barcode || "-",
        status: d.status === "active" ? "Activo" : d.status === "maintenance" ? "En Mantenimiento" : "Inactivo"
      })),
      summary: [
        { label: "Total Registros", value: summaryData.totalItems },
        { label: "Equipos en Mantenimiento", value: summaryData.maintenanceCount },
      ],
    };
  };

  const [adjustData, setAdjustData] = useState({
    type: "in",
    quantity: "1",
    reason: "",
    notes: "",
  });

  const adjustmentTypes = [
    { value: "in", label: "Alta / Nueva Compra", color: "text-green-600" },
    { value: "loss", label: "Baja / Destruido / Pérdida", color: "text-red-600" },
    { value: "damaged", label: "En Mantenimiento", color: "text-orange-600" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const eq = await window.api.getEquipment();
      const cats = await window.api.getEquipmentCategories();
      setEquipmentList(eq);
      setCategories(cats);
    } catch (err) {
      error("Error cargando mobiliario cerrado");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      error("Ingrese un nombre para la categoría");
      return;
    }
    try {
      await window.api.createEquipmentCategory(newCategoryName.trim());
      success("Categoría creada");
      setNewCategoryName("");
      setShowCategoryModal(false);
      loadData();
    } catch (err) {
      error("Error creando categoría");
    }
  };

  const handleSubmitEq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error("Complete los campos requeridos");
      return;
    }

    try {
      const barcodeValue = formData.autoGenerateBarcode ? "" : formData.barcode;

      if (editingEq) {
        await window.api.updateEquipment(
          editingEq.id,
          formData.name,
          formData.category_id ? parseInt(formData.category_id) : null,
          parseInt(formData.quantity) || 0,
          formData.status,
          formData.location,
          barcodeValue
        );
        success("Mobiliario actualizado");
      } else {
        await window.api.createEquipment(
          formData.name,
          formData.category_id ? parseInt(formData.category_id) : null,
          parseInt(formData.quantity) || 0,
          formData.status,
          formData.location,
          barcodeValue
        );
        success("Mobiliario registrado");
      }
      setShowEqModal(false);
      setEditingEq(null);
      loadData();
    } catch (err) {
      error("Error guardando equipo");
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq || !adjustData.quantity || parseInt(adjustData.quantity) <= 0) {
      error("Datos inválidos");
      return;
    }

    try {
      await window.api.adjustEquipmentStock(
        selectedEq.id,
        adjustData.type,
        parseInt(adjustData.quantity),
        adjustData.reason || "Ajuste manual",
        adjustData.notes,
        1 
      );
      success("Inventario ajustado correctamente");
      setShowAdjustModal(false);
      loadData();
    } catch (err) {
      error("Error al ajustar inventario");
    }
  };

  const openAudit = async (eq: Equipment) => {
    try {
      const logs = await window.api.getEquipmentAdjustments(eq.id);
      setAuditLogs(logs);
      setSelectedEq(eq);
      setShowAuditModal(true);
    } catch (err) {
      error("Error obteniendo historial");
    }
  };

  const handleDeleteEq = async (id: number) => {
    if (window.confirm("¿Seguro que deseas borrar este registro de Mobiliario?")) {
      try {
        await window.api.deleteEquipment(id);
        success("Equipo eliminado");
        loadData();
      } catch (err) {
        error("No se pudo eliminar el equipo. Verifica que no tenga historial previo.");
      }
    }
  };

  const filteredEq =
    categoryFilter === "all"
      ? equipmentList
      : equipmentList.filter((e) => e.category_id?.toString() === categoryFilter);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
              Mobiliario y Equipos
            </h1>
            <p className="text-sm text-gray-500 mt-1 pl-3">
              Gestión de activos internos (Muebles, Electrónicos, Enseres)
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap justify-end">
            <div className="flex gap-2 mr-4 border-r pr-4">
              <Button variant="outline" size="sm" onClick={() => exportToExcel(reportConfig())} title="Exportar a Excel">
                <FileDown className="w-4 h-4 text-indigo-600" />
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
                setEditingEq(null);
                setFormData({ name: "", category_id: "", quantity: "0", status: "active", location: "", barcode: "", autoGenerateBarcode: true });
                setShowEqModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Mobiliario
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
        <Card className="shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">Cód. Barras</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Equipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Categoría</th>
                <th className="px-4 py-3 text-center text-xs font-semibold">Unidades (Actuales)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Ubicación</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredEq.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{eq.barcode || "-"}</td>
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <MonitorSpeaker className="w-4 h-4 text-indigo-600" />
                    {eq.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{eq.category_name || "-"}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">
                    {eq.quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {eq.location || "-"}
                  </td>
                  <td className="px-4 py-3 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => {
                        setSelectedEq(eq);
                        setAdjustData({ type: "loss", quantity: "1", reason: "Baja Técnica", notes: "" });
                        setShowAdjustModal(true);
                      }}
                    >
                      <ShieldCheck className="w-4 h-4 mr-1" /> Altas y Bajas
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openAudit(eq)}>
                      Historial
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingEq(eq);
                        setFormData({
                          name: eq.name,
                          category_id: eq.category_id?.toString() || "",
                          quantity: eq.quantity.toString(),
                          status: eq.status,
                          location: eq.location || "",
                          barcode: eq.barcode || "",
                          autoGenerateBarcode: !eq.barcode
                        });
                        setShowEqModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteEq(eq.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredEq.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <MonitorSpeaker className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No hay mobiliario registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* MODALS */}
      {/* Create / Edit Eq */}
      {showEqModal && (
        <Dialog open={showEqModal} onOpenChange={setShowEqModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-indigo-900">
                  {editingEq ? "Editar Mobiliario" : "Registrar Mobiliario"}
                </h2>
              </div>
              <form onSubmit={handleSubmitEq} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre / Modelo</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Silla Plástica Blanca"
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
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                    <label className="block text-sm font-medium mb-1">Unidades (Físicas)</label>
                    <Input
                      type="number"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ubicación Fija (Opcional)</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej: Salón B"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setShowEqModal(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Guardar
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Adjust Stock */}
      {showAdjustModal && selectedEq && (
        <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm bg-white">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Registro de Alta o Baja</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedEq.name}</p>
              </div>
              <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Movimiento</label>
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
                  <label className="block text-sm font-medium mb-1">Cantidad Física Afectada</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Motivo Específico</label>
                  <Input
                    value={adjustData.notes}
                    onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                    placeholder="Ej: Pata Rota. Compra No. 129"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setShowAdjustModal(false)}>Cancelar</Button>
                  <Button type="submit">Guardar Movimiento</Button>
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
              <h2 className="text-xl font-bold mb-4">Nueva Categoría (Equipos)</h2>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Muebles"
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
      {showAuditModal && selectedEq && (
         <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <Card className="w-full max-w-2xl bg-white max-h-[90vh] flex flex-col">
             <div className="p-6 border-b">
               <h2 className="text-xl font-bold">Ajustes Históricos: {selectedEq.name}</h2>
             </div>
             <div className="overflow-y-auto p-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Operación</th>
                      <th className="px-4 py-2 text-right">Cant.</th>
                      <th className="px-4 py-2 text-right">Existencia Actualizada</th>
                      <th className="px-4 py-2 text-left">Motivo/Logistica</th>
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
                          {log.new_quantity}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                           {log.notes || log.reason} <br/>
                           <span className="text-gray-400">Hecho por: {log.user_name || 'Sistema'}</span>
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-4 text-gray-500">Sin historial registrado.</td></tr>
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
