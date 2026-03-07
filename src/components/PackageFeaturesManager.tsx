import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { Plus, Edit, Trash2, AlertCircle, Settings2 } from "lucide-react";
import { useNotification } from "../hooks/useNotification";

interface PackageFeature {
  id: number;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
}

interface FeatureCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface PackageFeaturesManagerProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PackageFeaturesManager({
  open,
  onClose,
  onUpdate,
}: PackageFeaturesManagerProps) {
  const [features, setFeatures] = useState<PackageFeature[]>([]);
  const [categories, setCategories] = useState<FeatureCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] =
    useState(false);
  const [editingFeature, setEditingFeature] = useState<PackageFeature | null>(
    null,
  );
  const [editingCategory, setEditingCategory] =
    useState<FeatureCategory | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<PackageFeature | null>(
    null,
  );
  const [categoryToDelete, setCategoryToDelete] =
    useState<FeatureCategory | null>(null);
  const { success, error } = useNotification();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    await Promise.all([loadFeatures(), loadCategories()]);
  };

  const loadFeatures = async () => {
    try {
      const data = await (window as any).api.getPackageFeatures();
      setFeatures(data || []);
    } catch (err) {
      error("Error cargando características");
    }
  };

  const loadCategories = async () => {
    try {
      const data = await (window as any).api.getPackageFeatureCategories();
      setCategories(data || []);
    } catch (err) {
      error("Error cargando categorías");
    }
  };

  // Feature handlers
  const handleOpenModal = (feature?: PackageFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFormData({
        name: feature.name,
        description: feature.description || "",
        category: feature.category || "",
      });
    } else {
      setEditingFeature(null);
      setFormData({
        name: "",
        description: "",
        category: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      error("El nombre es obligatorio");
      return;
    }

    try {
      if (editingFeature) {
        await (window as any).api.updatePackageFeature(
          editingFeature.id,
          formData.name,
          formData.description || null,
          formData.category || null,
        );
        success("Característica actualizada");
      } else {
        await (window as any).api.createPackageFeature(
          formData.name,
          formData.description || null,
          formData.category || null,
        );
        success("Característica creada");
      }
      setShowModal(false);
      loadFeatures();
      onUpdate();
    } catch (err) {
      error("Error guardando característica");
    }
  };

  const handleDelete = (feature: PackageFeature) => {
    setFeatureToDelete(feature);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!featureToDelete) return;

    try {
      await (window as any).api.deletePackageFeature(featureToDelete.id);
      success("Característica eliminada");
      loadFeatures();
      onUpdate();
    } catch (err) {
      error("Error eliminando característica");
    } finally {
      setShowDeleteConfirm(false);
      setFeatureToDelete(null);
    }
  };

  // Category handlers
  const handleOpenCategoryModal = (category?: FeatureCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: "",
        description: "",
      });
    }
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryFormData.name) {
      error("El nombre es obligatorio");
      return;
    }

    try {
      if (editingCategory) {
        await (window as any).api.updatePackageFeatureCategory(
          editingCategory.id,
          categoryFormData.name,
          categoryFormData.description || null,
        );
        success("Categoría actualizada");
      } else {
        await (window as any).api.createPackageFeatureCategory(
          categoryFormData.name,
          categoryFormData.description || null,
        );
        success("Categoría creada");
      }
      setShowCategoryModal(false);
      loadCategories();
    } catch (err) {
      error("Error guardando categoría");
    }
  };

  const handleDeleteCategory = (category: FeatureCategory) => {
    setCategoryToDelete(category);
    setShowCategoryDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await (window as any).api.deletePackageFeatureCategory(
        categoryToDelete.id,
      );
      success("Categoría eliminada");
      loadCategories();
    } catch (err) {
      error("Error eliminando categoría");
    } finally {
      setShowCategoryDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  // Agrupar por categoría
  const featuresByCategory = features.reduce(
    (acc, feature) => {
      const category = feature.category || "Sin categoría";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(feature);
      return acc;
    },
    {} as Record<string, PackageFeature[]>,
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700">
            <h2 className="text-xl font-bold text-white">
              Gestionar Características
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Administra las características disponibles para los paquetes
            </p>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-slate-600">
                {features.length} característica(s) disponible(s)
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenCategoryModal()}
                  variant="outline"
                  className="gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  Gestionar Categorías
                </Button>
                <Button
                  onClick={() => handleOpenModal()}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Característica
                </Button>
              </div>
            </div>

            {Object.keys(featuresByCategory).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">
                  No hay características creadas
                </p>
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Crear Primera Característica
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(featuresByCategory).map(
                  ([category, categoryFeatures]) => (
                    <div key={category}>
                      <h3 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                        {category}
                      </h3>
                      <div className="grid gap-3">
                        {categoryFeatures.map((feature) => (
                          <Card
                            key={feature.id}
                            className="p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">
                                  {feature.name}
                                </h4>
                                {feature.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {feature.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenModal(feature)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(feature)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </Card>

        {/* Modal Crear/Editar Característica */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <Card className="w-full max-w-md bg-white">
              <form onSubmit={handleSubmit}>
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">
                    {editingFeature
                      ? "Editar Característica"
                      : "Nueva Característica"}
                  </h3>
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
                      placeholder="Ej: Decoración temática básica"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Categoría
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-md"
                      >
                        <option value="">Seleccionar...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setShowModal(false);
                          handleOpenCategoryModal();
                        }}
                        title="Gestionar categorías"
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Descripción opcional de la característica..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {editingFeature ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Modal Gestionar Categorías */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <Card className="w-full max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Gestionar Categorías</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Administra las categorías de características
                </p>
              </div>

              <div className="p-6">
                {/* Formulario */}
                <form
                  onSubmit={handleCategorySubmit}
                  className="mb-6 p-4 bg-slate-50 rounded-lg"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre de Categoría *
                      </label>
                      <Input
                        value={categoryFormData.name}
                        onChange={(e) =>
                          setCategoryFormData({
                            ...categoryFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Ej: Decoración, Animación, Servicios..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Descripción
                      </label>
                      <Input
                        value={categoryFormData.description}
                        onChange={(e) =>
                          setCategoryFormData({
                            ...categoryFormData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Descripción opcional..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      {editingCategory && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingCategory(null);
                            setCategoryFormData({ name: "", description: "" });
                          }}
                        >
                          Cancelar Edición
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {editingCategory ? "Actualizar" : "Agregar"}
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Lista de categorías */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Categorías Existentes ({categories.length})
                  </h4>
                  {categories.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No hay categorías creadas
                    </p>
                  ) : (
                    categories.map((cat) => (
                      <Card key={cat.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-xs text-slate-600">
                                {cat.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenCategoryModal(cat)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(cat)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    setCategoryFormData({ name: "", description: "" });
                    setShowModal(true);
                  }}
                >
                  Volver
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal Eliminar Característica */}
        {showDeleteConfirm && featureToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ¿Eliminar característica?
                </h3>
                <p className="text-slate-300 text-sm mb-2">
                  Está a punto de eliminar:
                </p>
                <p className="text-white font-semibold text-base mb-6">
                  {featureToDelete.name}
                </p>
                <div className="flex items-center gap-2 p-3 bg-amber-900/30 border border-amber-700 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-200">
                    Los paquetes que la incluyen no se verán afectados
                  </span>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setFeatureToDelete(null);
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
        )}

        {/* Modal Eliminar Categoría */}
        {showCategoryDeleteConfirm && categoryToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ¿Eliminar categoría?
                </h3>
                <p className="text-slate-300 text-sm mb-2">
                  Está a punto de eliminar:
                </p>
                <p className="text-white font-semibold text-base mb-6">
                  {categoryToDelete.name}
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCategoryDeleteConfirm(false);
                      setCategoryToDelete(null);
                    }}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmDeleteCategory}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Dialog>
  );
}
