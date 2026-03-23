import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  FileDown,
  FileText,
  Printer,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { useCurrency } from "../hooks/useCurrency";
import { usePermissions } from "../hooks/usePermissions";
import { useReportExport } from "../hooks/useReportExport";

interface Product {
  id: number;
  name: string;
  price: number;
  type: string;
  category: string;
  barcode: string;
  stock: number;
  duration_minutes?: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { success, error } = useNotification();
  const { formatCurrency } = useCurrency();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    type: "food",
    category: "",
    barcode: "",
    stock: "0",
    duration_minutes: "",
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await window.api.getProductsServices();
      setProducts(data);
    } catch (err) {
      error("Error cargando productos");
    }
  };

  const loadCategories = async () => {
    try {
      const data = await window.api.getCategories();
      setCategories(data);
    } catch (err) {
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      error("Ingrese un nombre para la categoría");
      return;
    }

    try {
      await (window as any).api.createCategory(newCategoryName.trim(), "", formData.type);
      success("Categoría creada");
      setNewCategoryName("");
      setShowCategoryModal(false);
      await loadCategories();
      setFormData({ ...formData, category: newCategoryName.trim() });
    } catch (err) {
      error("Error creando categoría");
    }
  };

  useEffect(() => {
    if (formData.category) {
      const selectedCat = categories.find(c => c.name === formData.category);
      if (selectedCat) {
        setFormData(prev => ({ ...prev, type: selectedCat.type }));
      }
    }
  }, [formData.category, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) {
      error("Complete los campos requeridos");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      error("Precio inválido");
      return;
    }

    try {
      if (editingProduct) {
        await window.api.updateProductService(
          editingProduct.id,
          formData.name,
          price,
          formData.type,
          formData.category || null,
          formData.barcode || null,
          formData.stock ? parseInt(formData.stock) : null,
          formData.duration_minutes ? parseInt(formData.duration_minutes) : null
        );
        success("Producto actualizado");
      } else {
        await window.api.createProductService(
          formData.name,
          price,
          formData.type,
          formData.category || null,
          formData.barcode || null,
          formData.stock ? parseInt(formData.stock) : null,
          formData.duration_minutes ? parseInt(formData.duration_minutes) : null
        );
        success("Producto creado");
      }
      handleCloseModal();
      loadProducts();
    } catch (err) {
      error("Error guardando producto");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      type: product.type,
      category: product.category || "",
      barcode: product.barcode || "",
      stock: product.stock?.toString() || "0",
      duration_minutes: product.duration_minutes?.toString() || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setProductToDelete(product);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await window.api.deleteProductService(productToDelete.id);
      success("Producto eliminado");
      loadProducts();
    } catch (err) {
      error("Error eliminando producto");
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      type: "food",
      category: "",
      barcode: "",
      stock: "0",
      duration_minutes: "",
    });
  };

  const isPhysicalProduct = (type: string) => ["drink", "snack", "rental"].includes(type);
  const isTimeBasedService = (type: string) => ["time", "package"].includes(type);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  const reportConfig = {
    title: "Catálogo de Productos y Servicios",
    subtitle: `Búsqueda: ${searchTerm || "Todos"}`,
    filename: `productos-servicios-${new Date().toISOString().split("T")[0]}`,
    columns: [
      { header: "Producto", key: "name", width: 40 },
      { header: "Categoría", key: "category", width: 25 },
      { header: "Cód. Barras", key: "barcode", width: 20 },
      { header: "Precio", key: "price", width: 15, format: "currency" as const },
      { header: "Stock", key: "stock_label", width: 12 },
      { header: "I.V.A.", key: "tax_status", width: 10 },
    ],
    data: filteredProducts.map((p) => ({
      ...p,
      stock_label: isPhysicalProduct(p.type) ? p.stock : "N/A",
    })),
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos y Servicios</h1>
            <p className="text-sm text-gray-500">Gestión completa del catálogo</p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-white border rounded-lg p-1 mr-2">
              <Button variant="ghost" size="sm" onClick={() => exportToExcel(reportConfig)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                <FileDown className="w-4 h-4 mr-1" /> Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => exportToPDF(reportConfig)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <FileText className="w-4 h-4 mr-1" /> PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => printReport(reportConfig)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Printer className="w-4 h-4 mr-1" /> Imprimir
              </Button>
            </div>
            <Button onClick={() => setShowModal(true)} className="gap-2" disabled={!canCreate("inventory")}>
              <Plus className="w-4 h-4" /> Nuevo Producto
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 px-6 pt-4">
        <Input placeholder="Buscar por nombre o código de barras..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full" />
      </div>

      <Card className="mx-6 mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-semibold">Código</th>
              <th className="px-4 py-3 text-right text-xs font-semibold">Precio</th>
              <th className="px-4 py-3 text-center text-xs font-semibold">Stock</th>
              <th className="w-40 px-4 py-3 text-center text-xs font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3 capitalize">{product.category || "-"}</td>
                <td className="px-4 py-3 font-mono">{product.barcode || "-"}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(product.price)}</td>
                <td className="px-4 py-3 text-center">
                  {isPhysicalProduct(product.type) ? product.stock : "N/A"}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(product)} disabled={!canEdit("inventory")}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)} disabled={!canDelete("inventory")}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay productos registrados</p>
          </div>
        )}
        </div>
      </Card>

      {showModal && (
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto flex flex-col border-0">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="p-6 border-b bg-gradient-to-r from-slate-700 to-slate-800 text-white flex items-center gap-3">
                   <Package className="w-6 h-6" />
                   <h2 className="text-xl font-bold">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
                </div>

                <div className="p-6 space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                       <label className="block text-sm font-medium mb-1">Nombre *</label>
                       <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Coca Cola 500ml" required />
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1">Precio *</label>
                       <Input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1">Categoría</label>
                       <div className="flex gap-2">
                         <select className="flex-1 px-3 py-2 border rounded-md text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                            <option value="">Sin categoría</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                         </select>
                         <Button type="button" variant="outline" size="sm" onClick={() => setShowCategoryModal(true)}><Plus className="w-4 h-4" /></Button>
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1">Código de Barras</label>
                       <Input value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} placeholder="7501055302000" />
                    </div>
                    {isPhysicalProduct(formData.type) && editingProduct && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Stock Actual</label>
                        <Input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                      </div>
                    )}
                    {isTimeBasedService(formData.type) && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Duración (minutos)</label>
                        <Input type="number" min="1" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                   <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                   <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      {editingProduct ? "Actualizar" : "Crear"}
                   </Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}

      {showCategoryModal && (
        <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
             <Card className="w-full max-w-md bg-white border-0">
                <div className="p-6 border-b text-xl font-bold">Nueva Categoría</div>
                <div className="p-6">
                   <label className="block text-sm font-medium mb-2">Nombre de la Categoría *</label>
                   <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()} autoFocus />
                </div>
                <div className="p-6 border-t flex justify-end gap-3">
                   <Button type="button" variant="outline" onClick={() => {setShowCategoryModal(false); setNewCategoryName("");}}>Cancelar</Button>
                   <Button type="button" onClick={handleCreateCategory}>Crear</Button>
                </div>
             </Card>
          </div>
        </Dialog>
      )}

      {showDeleteConfirm && productToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md bg-slate-800 border-slate-700 p-6 text-white">
                 <h3 className="text-lg font-semibold mb-4">¿Eliminar producto?</h3>
                 <p className="text-slate-300 text-sm mb-6">Está a punto de eliminar: <br/><strong>{productToDelete.name}</strong></p>
                 <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="bg-slate-700 text-white">Cancelar</Button>
                    <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
                 </div>
              </Card>
           </div>
        </Dialog>
      )}
    </div>
  );
}
