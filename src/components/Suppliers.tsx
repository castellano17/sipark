import { useState, useEffect } from "react";
import { 
  Truck, Plus, Edit, Trash2, Phone, Mail, MapPin,
  FileDown, FileText, Printer,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { usePermissions } from "../hooks/usePermissions";
import { useReportExport } from "../hooks/useReportExport";

interface Supplier {
  id: number;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { success, error } = useNotification();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await window.api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      error("Error cargando proveedores");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      error("El nombre es requerido");
      return;
    }

    try {
      if (editingSupplier) {
        await window.api.updateSupplier(
          editingSupplier.id,
          formData.name,
          formData.contact_name,
          formData.phone,
          formData.email,
          formData.address,
          formData.notes,
        );
        success("Proveedor actualizado");
      } else {
        await window.api.createSupplier(
          formData.name,
          formData.contact_name,
          formData.phone,
          formData.email,
          formData.address,
          formData.notes,
        );
        success("Proveedor creado");
      }

      handleCloseModal();
      loadSuppliers();
    } catch (err) {
      error("Error guardando proveedor");
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este proveedor?")) return;

    try {
      await window.api.deleteSupplier(id);
      success("Proveedor eliminado");
      loadSuppliers();
    } catch (err) {
      error("Error eliminando proveedor");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({
      name: "",
      contact_name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const reportConfig = {
    title: "Directorio de Proveedores",
    subtitle: `Búsqueda: ${searchTerm || "Todos"}`,
    filename: `proveedores-${new Date().toISOString().split("T")[0]}`,
    columns: [
      { header: "Proveedor", key: "name", width: 40 },
      { header: "Contacto", key: "contact_name", width: 30 },
      { header: "Teléfono", key: "phone", width: 25 },
      { header: "Email", key: "email", width: 35 },
      { header: "Dirección", key: "address", width: 40 },
    ],
    data: filteredSuppliers,
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
            <p className="text-sm text-gray-500">
              Gestión de proveedores de inventario
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-white border rounded-lg p-1 mr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToExcel(reportConfig)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Exportar a Excel"
              >
                <FileDown className="w-4 h-4 mr-1" />
                Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToPDF(reportConfig)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Exportar a PDF"
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => printReport(reportConfig)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Imprimir"
              >
                <Printer className="w-4 h-4 mr-1" />
                Imprimir
              </Button>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="gap-2"
              disabled={!canCreate("inventory")}
            >
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </Button>
          </div>
        </div>
      </div>

        <div className="mb-4">
          <Input
            placeholder="Buscar por nombre o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((supplier) => (
            <Card
              key={supplier.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{supplier.name}</h3>
                    {supplier.contact_name && (
                      <p className="text-sm text-gray-500">
                        {supplier.contact_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(supplier)}
                    disabled={!canEdit("inventory")}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(supplier.id)}
                    disabled={!canDelete("inventory")}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {supplier.address}
                  </div>
                )}
                {supplier.notes && (
                  <p className="text-sm text-gray-500 mt-3 pt-3 border-t">
                    {supplier.notes}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Modern Pagination UI */}
        {filteredSuppliers.length > itemsPerPage && (
          <div className="mt-8 px-6 py-4 bg-white rounded-xl shadow-sm border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Mostrando <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> a{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(indexOfLastItem, filteredSuppliers.length)}
              </span>{" "}
              de <span className="font-semibold text-gray-900">{filteredSuppliers.length}</span> proveedores
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center mr-4">
                <span className="text-xs text-gray-500 mr-2">Filas por página:</span>
                <select 
                  className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[60px]"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[3, 6, 9, 12, 24].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {suppliers.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay proveedores registrados</p>
          </div>
        )}

      {/* Modal */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-white border-0">
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-700 to-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre de Empresa *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        placeholder="Ej: Distribuidora XYZ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Persona de Contacto
                      </label>
                      <Input
                        value={formData.contact_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_name: e.target.value,
                          })
                        }
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Teléfono
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="Ej: 555-0001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Dirección
                    </label>
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notas
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Notas adicionales sobre el proveedor..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-800"
                  >
                    {editingSupplier ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}
    </div>
  );
}
