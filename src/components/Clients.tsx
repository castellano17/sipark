import { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  History,
  Search,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { usePermissions } from "../hooks/usePermissions";

interface Client {
  id: number;
  name: string;
  parent_name?: string;
  phone: string;
  emergency_phone?: string;
  email?: string;
  child_name?: string;
  child_age?: number;
  allergies?: string;
  special_notes?: string;
  photo_path?: string;
  created_at: string;
}

interface Membership {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  benefits?: string;
  is_active: boolean;
}

interface ClientMembership {
  id: number;
  client_id: number;
  membership_id: number;
  membership_name: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  payment_amount: number;
  notes?: string;
  created_at: string;
}

interface ClientVisit {
  id: number;
  client_id: number;
  visit_date: string;
  check_in_time: string;
  check_out_time?: string;
  duration_minutes?: number;
  amount_paid: number;
  notes?: string;
  created_at: string;
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showVisitsModal, setShowVisitsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { success, error } = useNotification();
  const { canCreate, canEdit, canDelete } = usePermissions();

  const [formData, setFormData] = useState({
    name: "",
    parent_name: "",
    phone: "",
    emergency_phone: "",
    email: "",
    child_name: "",
    child_age: "",
    allergies: "",
    special_notes: "",
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await window.api.getClients();
      setClients(data);
    } catch (err) {
      error("Error cargando clientes");
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        parent_name: client.parent_name || "",
        phone: client.phone,
        emergency_phone: client.emergency_phone || "",
        email: client.email || "",
        child_name: client.child_name || "",
        child_age: client.child_age?.toString() || "",
        allergies: client.allergies || "",
        special_notes: client.special_notes || "",
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: "",
        parent_name: "",
        phone: "",
        emergency_phone: "",
        email: "",
        child_name: "",
        child_age: "",
        allergies: "",
        special_notes: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      error("Complete los campos obligatorios");
      return;
    }

    try {
      if (editingClient) {
        await window.api.updateClient(
          editingClient.id,
          formData.name,
          formData.parent_name || null,
          formData.phone || null,
          formData.emergency_phone || null,
          formData.email || null,
          formData.child_name || null,
          formData.child_age ? parseInt(formData.child_age) : null,
          formData.allergies || null,
          formData.special_notes || null,
        );
        success("Cliente actualizado");
      } else {
        await window.api.createClient(
          formData.name,
          formData.parent_name || null,
          formData.phone || null,
          formData.emergency_phone || null,
          formData.email || null,
          formData.child_name || null,
          formData.child_age ? parseInt(formData.child_age) : null,
          formData.allergies || null,
          formData.special_notes || null,
        );
        success("Cliente creado");
      }
      setShowModal(false);
      loadClients();
    } catch (err: any) {
      if (err?.message?.includes("Ya existe un cliente")) {
        error("Ya existe un cliente con ese nombre y teléfono");
      } else {
        error("Error guardando cliente");
      }
    }
  };

  const handleDelete = async (id: number) => {
    const client = clients.find((c) => c.id === id);
    if (client) {
      setClientToDelete(client);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await window.api.deleteClient(clientToDelete.id);
      success("Cliente eliminado");
      loadClients();
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes("registro(s) relacionado(s)")) {
        error(
          "No se puede eliminar: el cliente tiene sesiones, ventas o membresías registradas",
        );
      } else {
        error("Error eliminando cliente");
      }
      console.error("Error al eliminar cliente:", err);
    } finally {
      setShowDeleteConfirm(false);
      setClientToDelete(null);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      (client.child_name &&
        client.child_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UsersIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-gray-500">
              {filteredClients.length} cliente
              {filteredClients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="gap-2"
          disabled={!canCreate("clients")}
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por nombre, teléfono o nombre del niño..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className="p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{client.name}</h3>
                {client.child_name && (
                  <p className="text-sm text-gray-600">
                    Niño: {client.child_name}
                    {client.child_age && ` (${client.child_age} años)`}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenModal(client)}
                  disabled={!canEdit("clients")}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(client.id)}
                  disabled={!canDelete("clients")}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Tel:</span>
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.allergies && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                  <span className="text-red-700 text-xs font-medium">
                    ⚠️ Alergias: {client.allergies}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => {
                  setSelectedClient(client);
                  setShowMembershipModal(true);
                }}
                disabled={!canEdit("clients")}
              >
                <CreditCard className="w-3 h-3" />
                Membresía
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => {
                  setSelectedClient(client);
                  setShowVisitsModal(true);
                }}
                disabled={!canEdit("clients")}
              >
                <History className="w-3 h-3" />
                Historial
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm
              ? "No se encontraron clientes"
              : "No hay clientes registrados"}
          </p>
        </div>
      )}

      {/* Modal de crear/editar */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                  <h2 className="text-xl font-bold text-white">
                    {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Nombre del Responsable *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Teléfono Principal
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Teléfono de Emergencia
                      </label>
                      <Input
                        type="tel"
                        value={formData.emergency_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_phone: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre del Niño
                      </label>
                      <Input
                        value={formData.child_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            child_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Edad del Niño
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="18"
                        value={formData.child_age}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            child_age: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Alergias / Condiciones Médicas
                      </label>
                      <Input
                        value={formData.allergies}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            allergies: e.target.value,
                          })
                        }
                        placeholder="Ej: Alergia al maní, asma..."
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Notas Especiales
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                        value={formData.special_notes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            special_notes: e.target.value,
                          })
                        }
                        placeholder="Comportamiento, preferencias, restricciones..."
                      />
                    </div>
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingClient ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Dialog de confirmación para eliminar */}
      {showDeleteConfirm && clientToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ¿Eliminar cliente?
                </h3>
                <p className="text-slate-300 text-sm mb-2">
                  Está a punto de eliminar al cliente:
                </p>
                <p className="text-white font-semibold text-base mb-6">
                  {clientToDelete.name}
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setClientToDelete(null);
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

      {/* Modal de Membresías */}
      {showMembershipModal && selectedClient && (
        <MembershipModal
          client={selectedClient}
          onClose={() => {
            setShowMembershipModal(false);
            setSelectedClient(null);
          }}
        />
      )}

      {/* Modal de Historial de Visitas */}
      {showVisitsModal && selectedClient && (
        <VisitsModal
          client={selectedClient}
          onClose={() => {
            setShowVisitsModal(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
}

// ============ MEMBERSHIP MODAL ============

function MembershipModal({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [clientMemberships, setClientMemberships] = useState<
    ClientMembership[]
  >([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<number | null>(
    null,
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const { success, error } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allMemberships, clientMems] = await Promise.all([
        window.api.getMemberships(),
        window.api.getClientMemberships(client.id),
      ]);
      setMemberships(allMemberships);
      setClientMemberships(clientMems);
    } catch (err) {
      error("Error cargando datos");
    }
  };

  const handleAssign = async () => {
    if (!selectedMembership || !paymentAmount) {
      error("Complete todos los campos");
      return;
    }

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      await window.api.assignMembership(
        client.id,
        selectedMembership,
        parseFloat(paymentAmount),
        notes,
        currentUser.username || "Admin",
      );
      success("Membresía asignada");
      setShowAssignModal(false);
      setSelectedMembership(null);
      setPaymentAmount("");
      setNotes("");
      loadData();
    } catch (err) {
      error("Error asignando membresía");
    }
  };

  const handleCancel = async (membershipId: number) => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      await window.api.cancelClientMembership(
        membershipId,
        currentUser.username || "Admin",
      );
      success("Membresía cancelada");
      loadData();
    } catch (err) {
      error("Error cancelando membresía");
    }
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const isExpired = new Date(endDate) < new Date();
    if (status === "cancelled")
      return (
        <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
          Cancelada
        </span>
      );
    if (isExpired)
      return (
        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
          Expirada
        </span>
      );
    return (
      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
        Activa
      </span>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700">
            <h2 className="text-xl font-bold text-white">
              Membresías de {client.name}
            </h2>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Membresías Activas</h3>
              <Button
                onClick={() => setShowAssignModal(true)}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Asignar Membresía
              </Button>
            </div>

            {clientMemberships.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tiene membresías asignadas
              </div>
            ) : (
              <div className="space-y-3">
                {clientMemberships.map((cm) => (
                  <Card key={cm.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            {cm.membership_name}
                          </h4>
                          {getStatusBadge(cm.status, cm.end_date)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            Inicio:{" "}
                            {new Date(cm.start_date).toLocaleDateString()}
                          </p>
                          <p>
                            Fin: {new Date(cm.end_date).toLocaleDateString()}
                          </p>
                          <p>Monto pagado: ${cm.payment_amount.toFixed(2)}</p>
                          {cm.notes && <p>Notas: {cm.notes}</p>}
                        </div>
                      </div>
                      {cm.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(cm.id)}
                          className="text-red-600"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </Card>

        {/* Modal de asignar membresía */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <Card className="w-full max-w-md bg-white">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Asignar Membresía</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo de Membresía *
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedMembership || ""}
                    onChange={(e) => {
                      setSelectedMembership(Number(e.target.value));
                      const mem = memberships.find(
                        (m) => m.id === Number(e.target.value),
                      );
                      if (mem) setPaymentAmount(mem.price.toString());
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {memberships.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} - ${m.price} ({m.duration_days} días)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Monto Pagado *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notas
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedMembership(null);
                    setPaymentAmount("");
                    setNotes("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAssign}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Asignar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ============ VISITS MODAL ============

function VisitsModal({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) {
  const [visits, setVisits] = useState<ClientVisit[]>([]);
  const { error } = useNotification();

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      const data = await window.api.getClientVisits(client.id, 50);
      setVisits(data);
    } catch (err) {
      error("Error cargando visitas");
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white">
              Historial de Visitas - {client.name}
            </h2>
          </div>

          <div className="p-6">
            {visits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay visitas registradas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Fecha
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Entrada
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Salida
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Duración
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Monto
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((visit) => (
                      <tr key={visit.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {visit.check_in_time}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {visit.check_out_time || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatDuration(visit.duration_minutes)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          ${visit.amount_paid.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {visit.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </Card>
      </div>
    </Dialog>
  );
}
