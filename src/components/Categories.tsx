import { useState, useEffect } from "react";
import { Tag, Plus, Edit, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { usePermissions } from "../hooks/usePermissions";

interface Category {
  id: number;
  name: string;
  description: string;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { success, error } = useNotification();
  const { canCreate, canEdit, canDelete } = usePermissions();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await window.api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error cargando categorías:", err);
      error("Error cargando categorías");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      error("El nombre es requerido");
      return;
    }

    try {
      if (editingCategory) {
        await window.api.updateCategory(
          editingCategory.id,
          formData.name,
          formData.description,
        );
        success("Categoría actualizada");
      } else {
        await window.api.createCategory(formData.name, formData.description);
        success("Categoría creada");
      }

      handleCloseModal();
      loadCategories();
    } catch (err) {
      console.error("Error guardando categoría:", err);
      error("Error guardando categoría");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría?")) return;

    try {
      await window.api.deleteCategory(id);
      success("Categoría eliminada");
      loadCategories();
    } catch (err) {
      console.error("Error eliminando categoría:", err);
      error("Error eliminando categoría");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
            <p className="text-sm text-gray-500">
              Gestión de categorías de productos
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="gap-2"
            disabled={!canCreate("inventory")}
          >
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      <div className=" p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-lg">{category.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(category)}
                    disabled={!canEdit("inventory")}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category.id)}
                    disabled={!canDelete("inventory")}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {category.description && (
                <p className="text-sm text-gray-600">{category.description}</p>
              )}
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay categorías registradas</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white border-0 max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-700 to-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nombre *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="Ej: Bebidas Calientes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Descripción
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descripción opcional de la categoría..."
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
                    {editingCategory ? "Actualizar" : "Crear"}
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
