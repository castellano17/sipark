import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ProductService } from "@/types";
import { useDatabase } from "@/hooks/useDatabase";
import { useNotification } from "@/hooks/useNotification";
import { Search, Plus, User } from "lucide-react";

interface Client {
  id: number;
  name: string;
  parent_name: string;
  phone: string;
  email: string;
}

interface CheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [clientType, setClientType] = useState<"registered" | "general">(
    "registered",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [newClientData, setNewClientData] = useState({
    name: "",
    parentName: "",
    phone: "",
    emergencyPhone: "",
    email: "",
    childName: "",
    childAge: "",
    allergies: "",
    specialNotes: "",
  });

  const [formData, setFormData] = useState({
    packageId: 0,
  });
  const [packages, setPackages] = useState<ProductService[]>([]);
  const {
    loading,
    error,
    getProductsServices,
    createSession,
    getClients,
    createClient,
  } = useDatabase();
  const { success, error: errorNotification } = useNotification();

  useEffect(() => {
    if (open) {
      loadPackages();
      loadClients();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    // Filtrar clientes según búsqueda
    if (searchQuery.trim() === "") {
      setFilteredClients(clients.slice(0, 5)); // Mostrar solo 5 inicialmente
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client) =>
          (client.name && client.name.toLowerCase().includes(query)) ||
          (client.parent_name &&
            client.parent_name.toLowerCase().includes(query)) ||
          client.id.toString().includes(query) ||
          (client.phone && client.phone.includes(query)),
      );
      setFilteredClients(filtered.slice(0, 10)); // Máximo 10 resultados
    }
  }, [searchQuery, clients]);

  const resetForm = () => {
    setClientType("registered");
    setSearchQuery("");
    setSelectedClient(null);
    setShowClientForm(false);
    setShowClientDropdown(false);
    setNewClientData({
      name: "",
      parentName: "",
      phone: "",
      emergencyPhone: "",
      email: "",
      childName: "",
      childAge: "",
      allergies: "",
      specialNotes: "",
    });
    setFormData({ packageId: packages[0]?.id || 0 });
  };

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data || []);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    }
  };

  const loadPackages = async () => {
    const data = await getProductsServices();
    // Filtrar paquetes (type = 'package') y servicios de tiempo (type = 'service' con duration)
    const timePackages = data.filter(
      (p: ProductService) =>
        p.type === "package" ||
        (p.type === "service" && p.duration_minutes && p.duration_minutes > 0),
    );
    setPackages(timePackages);
    if (timePackages.length > 0) {
      setFormData((prev) => ({ ...prev, packageId: timePackages[0].id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (clientType === "registered" && !selectedClient) {
      errorNotification("Por favor selecciona un cliente");
      return;
    }

    if (!formData.packageId) {
      errorNotification("Por favor selecciona un paquete");
      return;
    }

    try {
      const selectedPackage = packages.find((p) => p.id === formData.packageId);

      const clientName =
        clientType === "registered" ? selectedClient!.name : "Cliente General";
      const parentName =
        clientType === "registered"
          ? selectedClient!.parent_name
          : "Sin Registro";
      const phone = clientType === "registered" ? selectedClient!.phone : "";

      await createSession(
        clientName,
        parentName,
        phone,
        formData.packageId,
        selectedPackage?.duration_minutes || 60,
      );

      success(`Entrada registrada para ${clientName}`);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Error en check-in:", err);
      errorNotification("Error al registrar la entrada");
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.name || !newClientData.phone) {
      errorNotification("Nombre del tutor y teléfono son requeridos");
      return;
    }

    try {
      const result = await createClient(
        newClientData.name,
        newClientData.parentName,
        newClientData.phone,
        newClientData.emergencyPhone,
        newClientData.email,
        newClientData.childName,
        newClientData.childAge,
        newClientData.allergies,
        newClientData.specialNotes,
      );

      success("Cliente creado exitosamente");

      // Recargar clientes y seleccionar el nuevo
      await loadClients();
      const newClient = clients.find((c) => c.id === result.id);
      if (newClient) {
        setSelectedClient(newClient);
        setSearchQuery(newClient.name);
      }

      setShowClientForm(false);
    } catch (err) {
      console.error("Error creando cliente:", err);
      errorNotification("Error al crear cliente");
    }
  };

  return open ? (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-[500px] bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto flex flex-col border-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Entrada Rápida</h2>
              <p className="text-sm text-blue-100">
                Registra un nuevo niño en el sistema
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Tipo de Cliente - Radio Buttons */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-900">
                Tipo de Cliente
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setClientType("registered")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    clientType === "registered"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <User
                    className={`w-6 h-6 mx-auto mb-2 ${
                      clientType === "registered"
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      clientType === "registered"
                        ? "text-blue-900"
                        : "text-slate-700"
                    }`}
                  >
                    Cliente Registrado
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setClientType("general")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    clientType === "general"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <User
                    className={`w-6 h-6 mx-auto mb-2 ${
                      clientType === "general"
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      clientType === "general"
                        ? "text-blue-900"
                        : "text-slate-700"
                    }`}
                  >
                    Cliente General
                  </p>
                </button>
              </div>
            </div>

            {/* Búsqueda de Cliente o Formulario Nuevo Cliente */}
            {clientType === "registered" && (
              <div className="space-y-3">
                {!showClientForm ? (
                  <>
                    <label className="block text-sm font-semibold text-slate-900">
                      Buscar Cliente
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Buscar por nombre, ID o teléfono..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      {/* Dropdown de resultados */}
                      {showClientDropdown && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() => {
                                setSelectedClient(client);
                                setSearchQuery(client.name);
                                setShowClientDropdown(false);
                              }}
                              className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                            >
                              <p className="font-medium text-slate-900">
                                {client.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Tutor: {client.parent_name} • ID: {client.id}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cliente seleccionado */}
                    {selectedClient && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900">
                          {selectedClient.name}
                        </p>
                        <p className="text-xs text-blue-700">
                          Tutor: {selectedClient.parent_name}
                        </p>
                        {selectedClient.phone && (
                          <p className="text-xs text-blue-700">
                            Tel: {selectedClient.phone}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Botón para crear nuevo cliente */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowClientForm(true)}
                      className="w-full gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Nuevo Cliente
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Formulario de nuevo cliente */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">
                          Nuevo Cliente
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowClientForm(false)}
                        >
                          Cancelar
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre del Tutor *
                          </label>
                          <input
                            type="text"
                            value={newClientData.name}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Carlos Pérez"
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre del Padre/Madre
                          </label>
                          <input
                            type="text"
                            value={newClientData.parentName}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                parentName: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: María Pérez"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Teléfono Principal *
                          </label>
                          <input
                            type="tel"
                            value={newClientData.phone}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="555-0001"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tel. Emergencia
                          </label>
                          <input
                            type="tel"
                            value={newClientData.emergencyPhone}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                emergencyPhone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="555-0002"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={newClientData.email}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="correo@ejemplo.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre del Niño
                          </label>
                          <input
                            type="text"
                            value={newClientData.childName}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                childName: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Juan"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Edad del Niño
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="18"
                            value={newClientData.childAge}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                childAge: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="5"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Alergias / Condiciones Médicas
                          </label>
                          <input
                            type="text"
                            value={newClientData.allergies}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                allergies: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Alergia al maní, asma..."
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Notas Especiales
                          </label>
                          <textarea
                            value={newClientData.specialNotes}
                            onChange={(e) =>
                              setNewClientData({
                                ...newClientData,
                                specialNotes: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Comportamiento, preferencias, restricciones..."
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleCreateClient}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? "Guardando..." : "Guardar Cliente"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Paquete - Cards Modernas */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-900">
                Selecciona un Paquete
              </label>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        packageId: pkg.id,
                      })
                    }
                    className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.packageId === pkg.id
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-[1.02]"
                        : "bg-white border-2 border-slate-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3
                          className={`font-bold text-lg mb-1 ${
                            formData.packageId === pkg.id
                              ? "text-white"
                              : "text-slate-900"
                          }`}
                        >
                          {pkg.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center gap-1 text-sm ${
                              formData.packageId === pkg.id
                                ? "text-blue-100"
                                : "text-slate-600"
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>
                              {pkg.duration_minutes
                                ? `${pkg.duration_minutes} min`
                                : "N/A"}
                            </span>
                          </div>
                          <div
                            className={`text-2xl font-bold ${
                              formData.packageId === pkg.id
                                ? "text-white"
                                : "text-blue-600"
                            }`}
                          >
                            ${Number(pkg.price).toFixed(2)}
                          </div>
                        </div>
                        {pkg.category && (
                          <p
                            className={`text-xs mt-2 ${
                              formData.packageId === pkg.id
                                ? "text-blue-100"
                                : "text-slate-500"
                            }`}
                          >
                            {pkg.category}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {formData.packageId === pkg.id ? (
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-600"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 border-2 border-slate-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {packages.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No hay paquetes disponibles</p>
                  <p className="text-xs mt-1">
                    Crea paquetes en Operaciones → Paquetes
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
};
