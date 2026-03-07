import { useState, useEffect } from "react";
import { Package, Plus, Edit, Trash2, Hash } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { useCurrency } from "../hooks/useCurrency";
import { usePermissions } from "../hooks/usePermissions";

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

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    type: "food",
    category: "",
    barcode: "",
    stock: "0",
    duration_minutes: "",
  });

  const productTypes = [
    { value: "food", label: "Comida" },
    { value: "drink", label: "Bebida" },
    { value: "snack", label: "Snack" },
    { value: "rental", label: "Alquiler" },
    { value: "event", label: "Evento" },
    { value: "time", label: "Tiempo/Servicio" },
    { value: "package", label: "Paquete" },
    { value: "membership", label: "Membresía" },
  ];

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
      console.error("Error cargando categorías:", err);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      error("Ingrese un nombre para la categoría");
      return;
    }

    try {
      await window.api.createCategory(newCategoryName.trim(), "");
      success("Categoría creada");
      setNewCategoryName("");
      setShowCategoryModal(false);
      await loadCategories();
      // Seleccionar automáticamente la nueva categoría
      setFormData({ ...formData, category: newCategoryName.trim() });
    } catch (err) {
      error("Error creando categoría");
    }
  };

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
          formData.duration_minutes
            ? parseInt(formData.duration_minutes)
            : null,
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
          formData.duration_minutes
            ? parseInt(formData.duration_minutes)
            : null,
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

  const isPhysicalProduct = (type: string) => {
    // Productos físicos que requieren inventario:
    // - drink: bebidas embotelladas
    // - snack: snacks empaquetados (no preparados)
    // - rental: juguetes, juegos de mesa para alquiler
    return ["drink", "snack", "rental"].includes(type);
  };

  const isTimeBasedService = (type: string) => {
    return ["time", "package"].includes(type);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Productos y Servicios
            </h1>
            <p className="text-sm text-gray-500">
              Gestión completa del catálogo
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="gap-2"
            disabled={!canCreate("inventory")}
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Código
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold">
                  Precio
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{product.name}</div>
                    {product.duration_minutes && (
                      <div className="text-xs text-gray-500">
                        {product.duration_minutes} minutos
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                      {productTypes.find((t) => t.value === product.type)
                        ?.label || product.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">
                    {product.category || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {product.barcode ? (
                      <div className="flex items-center gap-1 text-sm font-mono">
                        <Hash className="w-4 h-4 text-gray-400" />
                        {product.barcode}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isPhysicalProduct(product.type) ? (
                      <span className="font-semibold">
                        {product.stock || 0}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(product)}
                        disabled={!canEdit("inventory")}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(product.id)}
                        disabled={!canDelete("inventory")}
                      >
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
        </Card>
      </div>

      {/* Modal */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto flex flex-col border-0">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-700 to-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                    </h2>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Nombre *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Ej: Coca Cola 500ml"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tipo *
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        required
                      >
                        {productTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Precio *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Categoría
                      </label>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2 border rounded-md"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                        >
                          <option value="">Sin categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCategoryModal(true)}
                          className="px-3"
                          title="Crear nueva categoría"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Código de Barras
                      </label>
                      <Input
                        value={formData.barcode}
                        onChange={(e) =>
                          setFormData({ ...formData, barcode: e.target.value })
                        }
                        placeholder="7501055302000"
                      />
                    </div>

                    {isPhysicalProduct(formData.type) && editingProduct && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Stock Inicial
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={(e) =>
                            setFormData({ ...formData, stock: e.target.value })
                          }
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Solo editable al crear. Use Compras para aumentar
                          stock.
                        </p>
                      </div>
                    )}

                    {isTimeBasedService(formData.type) && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Duración (minutos)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.duration_minutes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              duration_minutes: e.target.value,
                            })
                          }
                          placeholder="60"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> Los productos físicos (Bebidas,
                      Snacks empaquetados,etc) requieren gestión de stock. Los
                      servicios (Tiempo, Eventos, Membresías) y comida preparada
                      no se inventarían. Use el módulo de Compras para registrar
                      entradas de inventario.
                    </p>
                  </div>
                </div>

                {/* Footer */}
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingProduct ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Modal Crear Categoría */}
      {showCategoryModal && (
        <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <Card className="w-full max-w-md bg-white border-0">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Nueva Categoría</h2>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium mb-2">
                  Nombre de la Categoría *
                </label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Bebidas Calientes"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="p-6 border-t flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleCreateCategory}>
                  Crear Categoría
                </Button>
              </div>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Dialog de confirmación para eliminar producto */}
      {showDeleteConfirm && productToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ¿Eliminar producto?
                </h3>
                <p className="text-slate-300 text-sm mb-2">
                  Está a punto de eliminar el producto:
                </p>
                <p className="text-white font-semibold text-base mb-6">
                  {productToDelete.name}
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setProductToDelete(null);
                    }}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Dialog>
      )}
    </div>
  );
}
