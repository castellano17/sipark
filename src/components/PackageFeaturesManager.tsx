import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { useNotification } from "../hooks/useNotification";

interface PackageFeature {
  id: number;
  name: string;
  description?: string;
  category?: string;
  requires_quantity: boolean;
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
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PackageFeature | null>(
    null,
  );
  const [featureToDelete, setFeatureToDelete] = useState<PackageFeature | null>(
    null,
  );
  const { success, error } = useNotification();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requires_quantity: false,
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    await loadFeatures();
  };

  const loadFeatures = async () => {
    try {
      const data = await (window as any).api.getPackageFeatures();
      setFeatures(data || []);
    } catch (err) {
      error("Error cargando características");
    }
  };

  // Feature handlers
  const handleOpenModal = (feature?: PackageFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFormData({
        name: feature.name,
        description: feature.description || "",
        requires_quantity: feature.requires_quantity || false,
      });
    } else {
      setEditingFeature(null);
      setFormData({
        name: "",
        description: "",
        requires_quantity: false,
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
          null,
          formData.requires_quantity,
        );
        success("Característica actualizada");
      } else {
        await (window as any).api.createPackageFeature(
          formData.name,
          formData.description || null,
          null,
          formData.requires_quantity,
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
                  onClick={() => handleOpenModal()}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Característica
                </Button>
              </div>
            </div>

            {features.length === 0 ? (
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
                <div className="grid gap-3">
                  {features.map((feature) => (
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

                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requires_quantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requires_quantity: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        ¿Requiere cantidad?
                      </p>
                      <p className="text-xs text-slate-500">
                        Activa esto si necesitas especificar cuántos (ej: N° de sillas, N° de mesas)
                      </p>
                    </div>
                  </label>
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
                <div className="flex items-center gap-0.5 p-3 bg-amber-900/30 border border-amber-700 rounded-lg mb-4">
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
      </div>
    </Dialog>
  );
}
