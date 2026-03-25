import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Plus, Trash2, Edit, AlertCircle, Settings } from "lucide-react";
import { ProductService } from "@/types";
import { useDatabase } from "@/hooks/useDatabase";
import { useNotification } from "@/hooks/useNotification";
import { PackageFeaturesManager } from "./PackageFeaturesManager";

type ModalMode = "create" | "edit" | "delete" | "features" | null;

interface FormData {
  id?: number;
  name: string;
  price: string;
  type: "package";
  duration: string;
  durationUnit: "minutes" | "hours";
  description: string;
  isStandardEntry: boolean;
}

interface PackageFeature {
  id: number;
  name: string;
  description?: string;
  category?: string;
  requires_quantity: boolean;
  is_active: boolean;
  quantity?: number; // Propiedad volátil para la UI
}

export const PackagesManager: React.FC = () => {
  const [packages, setPackages] = useState<ProductService[]>([]);
  const [features, setFeatures] = useState<PackageFeature[]>([]);
  const [featureSelections, setFeatureSelections] = useState<Record<number, number>>({});
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [showFeaturesManager, setShowFeaturesManager] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    price: "",
    type: "package",
    duration: "",
    durationUnit: "hours",
    description: "",
    isStandardEntry: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<ProductService | null>(null);
  const {
    loading,
    error,
    getProductsServices,
    createProductService,
    updateProductService,
    deleteProductService,
  } = useDatabase();
  const { success, error: errorNotification } = useNotification();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    await Promise.all([cargarPaquetes(), cargarCaracteristicas()]);
  };

  const cargarPaquetes = async () => {
    const data = await getProductsServices();
    // Filtrar solo los paquetes de fiestas (type = 'package')
    const soloPackages = (data || []).filter((item) => item.type === "package");
    setPackages(soloPackages);
  };

  const cargarCaracteristicas = async () => {
    try {
      const data = await (window as any).api.getPackageFeatures();
      setFeatures(data || []);
    } catch (err) {
    }
  };

  const abrirModalCrear = () => {
    setFormData({
      name: "",
      price: "",
      type: "package",
      duration: "",
      durationUnit: "hours",
      description: "",
      isStandardEntry: false,
    });
    setFeatureSelections({});
    setModalMode("create");
  };

  const abrirModalEditar = async (pkg: ProductService) => {
    const durationMinutes = pkg.duration_minutes || 0;
    // Determinar si es mejor mostrar en horas o minutos
    const isHours = durationMinutes >= 60 && durationMinutes % 60 === 0;

    setFormData({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price.toString(),
      type: "package",
      duration: isHours
        ? (durationMinutes / 60).toString()
        : durationMinutes.toString(),
      durationUnit: isHours ? "hours" : "minutes",
      description: pkg.category || "",
      isStandardEntry: !!(pkg as any).is_standard_entry,
    });

    // Cargar características incluidas
    try {
      const includedFeatures = await (
        window as any
      ).api.getPackageIncludedFeatures(pkg.id);
      
      const selections: Record<number, number> = {};
      includedFeatures.forEach((f: any) => {
        selections[f.id] = f.quantity || 1;
      });
      setFeatureSelections(selections);
    } catch (err) {
      setFeatureSelections({});
    }

    setModalMode("edit");
  };

  const abrirModalEliminar = (pkg: ProductService) => {
    setDeleteTarget(pkg);
    setModalMode("delete");
  };

  const cerrarModal = () => {
    setModalMode(null);
    setDeleteTarget(null);
    setFormData({
      name: "",
      price: "",
      type: "package",
      duration: "",
      durationUnit: "hours",
      description: "",
      isStandardEntry: false,
    });
    setFeatureSelections({});
  };

  const toggleFeature = (featureId: number) => {
    setFeatureSelections((prev) => {
      const newSelections = { ...prev };
      if (newSelections[featureId] !== undefined) {
        delete newSelections[featureId];
      } else {
        newSelections[featureId] = 1;
      }
      return newSelections;
    });
  };

  const updateFeatureQuantity = (featureId: number, quantity: number) => {
    setFeatureSelections((prev) => ({
      ...prev,
      [featureId]: Math.max(1, quantity),
    }));
  };

  const handleSubmitFormulario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.duration) {
      errorNotification("Por favor completa los campos requeridos");
      return;
    }

    try {
      let packageId: number | null = null;

      // Convertir duración a minutos según la unidad seleccionada
      const durationInMinutes =
        formData.durationUnit === "hours"
          ? parseInt(formData.duration) * 60
          : parseInt(formData.duration);

      if (modalMode === "create") {
        const result = await createProductService(
          formData.name,
          parseFloat(formData.price),
          "package",
          formData.description,
          undefined, // barcode
          undefined, // stock
          durationInMinutes,
        );
        if (!result) {
          errorNotification("Error creando el paquete");
          return;
        }
        packageId = result;
        success(`Paquete "${formData.name}" creado correctamente`);
      } else if (modalMode === "edit" && formData.id) {
        packageId = formData.id;
        await updateProductService(
          formData.id,
          formData.name,
          parseFloat(formData.price),
          "package",
          formData.description,
          undefined, // barcode
          undefined, // stock
          durationInMinutes,
        );
        success(`Paquete "${formData.name}" actualizado correctamente`);
      } else {
        return;
      }

      // Guardar características seleccionadas
      if (packageId) {
        const selectionsArray = Object.entries(featureSelections).map(([id, qty]) => ({
          id: parseInt(id),
          quantity: qty,
        }));
        
        await (window as any).api.setPackageFeatures(
          packageId,
          selectionsArray,
        );

        // Guardar flag de entrada estándar
        await (window as any).api.setPackageIsStandardEntry({
          packageId,
          isStandardEntry: formData.isStandardEntry,
        });
      }

      await cargarPaquetes();
      cerrarModal();
    } catch (err) {
      errorNotification("Error al guardar el paquete");
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!deleteTarget) return;

    try {
      const nombrePaquete = deleteTarget.name;
      await deleteProductService(deleteTarget.id);
      success(`Paquete "${nombrePaquete}" eliminado correctamente`);
      await cargarPaquetes();
      cerrarModal();
    } catch (err) {
      errorNotification("Error al eliminar el paquete");
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Gestión de Paquetes
          </h1>
          <p className="text-slate-600 mt-1">
            {packages.length} paquete(s) disponible(s)
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          <Button
            onClick={() => setShowFeaturesManager(true)}
            size="default"
            variant="outline"
            className="flex-1 md:flex-none gap-2"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Gestionar Características</span>
            <span className="sm:hidden">Características</span>
          </Button>
          <Button
            onClick={abrirModalCrear}
            size="default"
            className="flex-1 md:flex-none gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Paquete</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Grid de Paquetes */}
      <div className="flex-1 overflow-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.length > 0 ? (
            packages.map((pkg) => (
              <Card
                key={pkg.id}
                className="shadow-md border-none hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {pkg.name}
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        ${Number(pkg.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => abrirModalEditar(pkg)}
                        variant="outline"
                        size="icon"
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => abrirModalEliminar(pkg)}
                        variant="outline"
                        size="icon"
                        className="text-rose-600 hover:text-rose-900 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    {pkg.duration_minutes && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">⏱️ Duración:</span>
                        <span>
                          {pkg.duration_minutes >= 60 &&
                          pkg.duration_minutes % 60 === 0
                            ? `${pkg.duration_minutes / 60} hora${pkg.duration_minutes / 60 !== 1 ? "s" : ""}`
                            : `${pkg.duration_minutes} minuto${pkg.duration_minutes !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    )}
                    {pkg.category && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 mb-1">
                          Notas:
                        </p>
                        <p className="text-xs text-slate-600 whitespace-pre-line">
                          {pkg.category}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-slate-600 mb-4">
                  No hay paquetes de fiestas creados aún
                </p>
                <Button
                  onClick={abrirModalCrear}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Crear Primer Paquete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Dialog
        open={modalMode === "create" || modalMode === "edit"}
        onOpenChange={cerrarModal}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {modalMode === "create"
                ? "Crear Nuevo Paquete"
                : "Editar Paquete"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Completa los datos para crear un nuevo paquete"
                : "Actualiza los datos del paquete"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitFormulario} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Nombre del Paquete *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Paquete Básico, Paquete Plus, Paquete Premium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Precio */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Precio ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="3500.00"
                />
              </div>

              {/* Duración */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Duración *
                </label>
                <div className="space-y-2">
                  {/* Toggle de unidad */}
                  <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          durationUnit: "hours",
                          duration: "",
                        })
                      }
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        formData.durationUnit === "hours"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Horas
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          durationUnit: "minutes",
                          duration: "",
                        })
                      }
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        formData.durationUnit === "minutes"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Minutos
                    </button>
                  </div>
                  {/* Input de duración */}
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      formData.durationUnit === "hours" ? "Ej: 3" : "Ej: 180"
                    }
                  />
                </div>
              </div>
            </div>

              {/* Entrada Estándar toggle */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Entrada Estándar</p>
                  <p className="text-xs text-slate-500 mt-0.5">Solo permite 1 niño por entrada. Para agregar otro niño se debe cobrar otra entrada.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isStandardEntry}
                    onChange={(e) => setFormData({ ...formData, isStandardEntry: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

            {/* Características Incluidas */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Características Incluidas
              </label>
              <div className="border border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-slate-50">
                {features.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No hay características disponibles. Crea algunas primero.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center gap-3 p-2 hover:bg-white rounded"
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={featureSelections[feature.id] !== undefined}
                              onChange={() => toggleFeature(feature.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {feature.name}
                            </p>
                            {feature.description && (
                              <p className="text-xs text-slate-500">
                                {feature.description}
                              </p>
                            )}
                          </div>
                        </label>

                        {/* Input de cantidad si aplica */}
                        {featureSelections[feature.id] !== undefined && feature.requires_quantity && (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <span className="text-xs font-semibold text-slate-500">Cant:</span>
                            <input
                              type="number"
                              min="1"
                              value={featureSelections[feature.id]}
                              onChange={(e) => updateFeatureQuantity(feature.id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notas Adicionales */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Información adicional sobre el paquete..."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-0.5 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span className="text-sm text-rose-600">{error}</span>
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cerrarModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {loading
                  ? "Guardando..."
                  : modalMode === "create"
                    ? "Crear"
                    : "Actualizar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={modalMode === "delete"} onOpenChange={cerrarModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-rose-600">
              Eliminar Paquete
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este paquete?
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900">
                {deleteTarget.name}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                ${Number(deleteTarget.price).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-0.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-600">
              Esta acción no se puede deshacer
            </span>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cerrarModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarEliminar}
              disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Gestionar Características */}
      <PackageFeaturesManager
        open={showFeaturesManager}
        onClose={() => setShowFeaturesManager(false)}
        onUpdate={cargarCaracteristicas}
      />
    </div>
  );
};
