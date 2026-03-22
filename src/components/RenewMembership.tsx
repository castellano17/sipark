import { useState, useEffect } from "react";
import {
  Search,
  CreditCard,
  Award,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCurrency } from "../hooks/useCurrency";
import { useNotification } from "../hooks/useNotification";
import { useCashBox } from "../hooks/useCashBox";
import { usePrinter } from "../hooks/usePrinter";

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Membership {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  description: string;
  total_hours?: string;
}

interface ClientMembership {
  id: number;
  client_id: number;
  membership_id: number;
  membership_name: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_amount: number;
  duration_days: number;
  benefits?: string;
  canRenew?: boolean;
  daysUntilExpiration?: number;
  id_card?: string;
  phone?: string;
  total_hours?: string;
}

export function RenewMembership() {
  const [clients, setClients] = useState<Client[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientMemberships, setClientMemberships] = useState<
    ClientMembership[]
  >([]);
  const [selectedClientMembership, setSelectedClientMembership] =
    useState<ClientMembership | null>(null);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Nuevos campos de membresía
  const [phone, setPhone] = useState<string>("");
  const [idCard, setIdCard] = useState<string>("");
  const [acquisitionDate, setAcquisitionDate] = useState<string>(
    new Date().toLocaleDateString("sv-SE"),
  );
  const [totalHours, setTotalHours] = useState<string>("");

  const formatCedula = (val: string) => {
    const digits = val.replace(/[^0-9A-ZA-Z]/gi, "").toUpperCase();
    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 3);
    if (digits.length > 3) formatted += "-" + digits.substring(3, 9);
    if (digits.length > 9) formatted += "-" + digits.substring(9, 13);
    if (digits.length > 13) formatted += digits.substring(13, 14);
    return formatted;
  };

  const { formatCurrency } = useCurrency();
  const { success, error } = useNotification();
  const { getActiveCashBox } = useCashBox();
  const { printMembershipTicket, printMembershipInvoice } = usePrinter();

  useEffect(() => {
    loadClients();
    loadMemberships();
  }, []);

  const loadClients = async () => {
    try {
      const data = await (window as any).api.getClients();
      setClients(data);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    }
  };

  const loadMemberships = async () => {
    try {
      const data = await (window as any).api.getMemberships();
      setMemberships(data.filter((m: any) => m.is_active));
    } catch (err) {
      console.error("Error cargando membresías:", err);
    }
  };

  const loadClientMemberships = async (clientId: number) => {
    try {
      const allClientMemberships = await (
        window as any
      ).api.getClientMemberships(clientId);

      if (allClientMemberships.length === 0) {
        setClientMemberships([]);
        error("Este cliente no tiene membresías");
        return;
      }

      // Calcular si se puede renovar cada membresía
      const today = new Date();
      const membershipsWithStatus = allClientMemberships.map((m: any) => {
        const endDate = new Date(m.end_date);
        const daysUntilExpiration = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Se puede renovar si está vencida o por vencer (7 días o menos)
        const canRenew = m.status === "expired" || daysUntilExpiration <= 7;

        return {
          ...m,
          canRenew,
          daysUntilExpiration,
        };
      });

      setClientMemberships(membershipsWithStatus);
    } catch (err) {
      console.error("Error cargando membresías del cliente:", err);
      error("Error al cargar membresías del cliente");
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm("");
    setSelectedClientMembership(null);
    setSelectedMembership(null);
    setCustomPrice(null);
    setDiscount(0);
    setNotes("");
    setPhone(client.phone || "");
    loadClientMemberships(client.id);
  };

  const handleMembershipSelect = (clientMembership: ClientMembership) => {
    if (!clientMembership.canRenew) {
      error(
        "Esta membresía aún está activa y no puede renovarse hasta 7 días antes de su vencimiento",
      );
      return;
    }

    setSelectedClientMembership(clientMembership);

    // Pre-seleccionar la misma membresía
    const sameMembership = memberships.find(
      (m) => m.id === clientMembership.membership_id,
    );
    if (sameMembership) {
      setSelectedMembership(sameMembership);
      setCustomPrice(sameMembership.price);
      setTotalHours(sameMembership.total_hours || "");
    }
    
    // Si la membresía anterior tenía datos específicos, los usamos como sugerencia
    if (clientMembership.phone) setPhone(clientMembership.phone);
    if (clientMembership.id_card) setIdCard(clientMembership.id_card);
    if (clientMembership.total_hours && !sameMembership?.total_hours) {
      setTotalHours(clientMembership.total_hours);
    }
  };

  const calculateNewEndDate = () => {
    if (!selectedClientMembership || !selectedMembership) return "";

    const currentEndDate = new Date(selectedClientMembership.end_date);
    const today = new Date();
    const startDate = currentEndDate > today ? currentEndDate : today;
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + selectedMembership.duration_days);

    return newEndDate.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRenew = async () => {
    if (!selectedClient || !selectedMembership || !selectedClientMembership) {
      error("Faltan datos para renovar");
      return;
    }

    if (!totalHours) {
      error("El campo N° de Entradas en horas es obligatorio");
      return;
    }

    // Validar caja abierta
    const activeCashBox = await getActiveCashBox();
    if (!activeCashBox) {
      error("No hay caja abierta");
      return;
    }

    try {
      setLoading(true);

      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      const finalAmount = (customPrice || selectedMembership.price) - discount;

      // Calcular nueva fecha de vencimiento
      const currentEndDate = new Date(selectedClientMembership.end_date);
      const today = new Date();
      const startDate = currentEndDate > today ? currentEndDate : today;
      const newEndDate = new Date(startDate);
      newEndDate.setDate(
        newEndDate.getDate() + selectedMembership.duration_days,
      );

      // Crear nueva membresía
      const newMembershipId = await (window as any).api.assignMembership(
        selectedClient.id,
        selectedMembership.id,
        finalAmount,
        notes,
        currentUser.id || null,
        phone,
        idCard,
        acquisitionDate,
        totalHours
      );

      // Registrar renovación en historial
      await (window as any).api.recordMembershipRenewal({
        client_id: selectedClient.id,
        old_membership_id: selectedClientMembership.id,
        new_membership_id: newMembershipId,
        renewal_date: new Date().toISOString(),
        old_end_date: selectedClientMembership.end_date,
        new_end_date: newEndDate.toISOString(),
        payment_amount: finalAmount,
        payment_method: paymentMethod,
        discount_applied: discount,
        notes: notes,
        processed_by: currentUser.id || null,
      });

      // Registrar venta en caja
      const saleData = {
        cash_box_id: activeCashBox.id,
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        items: [
          {
            product_id: null,
            product_name: `Renovación ${selectedMembership.name}`,
            quantity: 1,
            unit_price: selectedMembership.price,
            discount: discount,
            subtotal: finalAmount,
          },
        ],
        subtotal: selectedMembership.price,
        discount: discount,
        total: finalAmount,
        payment_method: paymentMethod,
        notes: `Renovación de membresía - ${notes}`,
      };

      await (window as any).api.createSaleWithItems(saleData);

      // Preparamos datos para la impresión (opcional, si se quiere imprimir al renovar)
      const membershipData = {
        id: newMembershipId,
        client_name: selectedClient.name,
        membership_name: selectedMembership.name,
        start_date: startDate.toISOString(),
        end_date: newEndDate.toISOString(),
        payment_amount: finalAmount,
        payment_method: paymentMethod,
        notes: notes,
        phone: phone,
        id_card: idCard,
        total_hours: totalHours,
        acquisition_date: acquisitionDate,
      };

      try {
        await printMembershipTicket(membershipData);
      } catch (printErr) {
        console.warn("No se pudo imprimir automáticamente:", printErr);
      }

      success("Membresía renovada exitosamente");

      // Limpiar formulario
      setSelectedClient(null);
      setClientMemberships([]);
      setSelectedClientMembership(null);
      setSelectedMembership(null);
      setCustomPrice(null);
      setDiscount(0);
      setNotes("");
      setPaymentMethod("cash");
      setPhone("");
      setIdCard("");
      setAcquisitionDate(new Date().toLocaleDateString("sv-SE"));
      setTotalHours("");
    } catch (err: any) {
      console.error("Error renovando membresía:", err);
      error("Error al renovar membresía: " + (err.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone || "").includes(searchTerm),
  );

  const finalAmount = customPrice ? customPrice - discount : 0;

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          🔄 Renovar Membresía
        </h1>
        <p className="text-sm text-gray-600">
          Renueva la membresía de un cliente existente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Selección de Cliente */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            1. Seleccionar Cliente
          </h3>

          {!selectedClient ? (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchTerm && (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleClientSelect(client)}
                    >
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </div>
                  ))}
                  {filteredClients.length === 0 && (
                    <p className="p-4 text-center text-gray-500">
                      No se encontraron clientes
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-lg">{selectedClient.name}</p>
                <p className="text-sm text-gray-600">{selectedClient.phone}</p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedClient(null);
                  setClientMemberships([]);
                  setSelectedClientMembership(null);
                  setSelectedMembership(null);
                  setCustomPrice(null);
                  setDiscount(0);
                  setNotes("");
                }}
                className="w-full"
              >
                Cambiar Cliente
              </Button>
            </div>
          )}
        </Card>

        {/* Columna 2: Selección de Membresía a Renovar */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            2. Seleccionar Membresía
          </h3>

          {selectedClient && clientMemberships.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-auto">
              {clientMemberships.map((membership) => (
                <div
                  key={membership.id}
                  onClick={() => handleMembershipSelect(membership)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedClientMembership?.id === membership.id
                      ? "border-purple-600 bg-purple-50"
                      : membership.canRenew
                        ? "border-gray-200 hover:border-purple-300"
                        : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {membership.membership_name}
                    </h4>
                    {membership.canRenew ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      Vence:{" "}
                      {new Date(membership.end_date).toLocaleDateString()}
                    </p>
                    <p
                      className={`font-semibold ${
                        membership.canRenew
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {membership.canRenew
                        ? membership.daysUntilExpiration! < 0
                          ? `Vencida hace ${Math.abs(membership.daysUntilExpiration!)} días`
                          : `Vence en ${membership.daysUntilExpiration} días`
                        : `Activa (${membership.daysUntilExpiration} días restantes)`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedClient ? (
            <div className="text-center py-12 text-gray-400">
              <Award className="w-16 h-16 mx-auto mb-4" />
              <p>Este cliente no tiene membresías</p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <User className="w-16 h-16 mx-auto mb-4" />
              <p>Selecciona un cliente primero</p>
            </div>
          )}
        </Card>

        {/* Columna 3: Pago y Confirmación */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            3. Procesar Renovación
          </h3>

          {selectedClientMembership ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo de Membresía
                </label>
                <select
                  value={selectedMembership?.id || ""}
                  onChange={(e) => {
                    const membership = memberships.find(
                      (m) => m.id === parseInt(e.target.value),
                    );
                    setSelectedMembership(membership || null);
                    if (membership) {
                      setCustomPrice(membership.price); // Actualizar precio al cambiar membresía
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar membresía</option>
                  {memberships.map((membership) => (
                    <option key={membership.id} value={membership.id}>
                      {membership.name} - {formatCurrency(membership.price)} (
                      {membership.duration_days} días)
                    </option>
                  ))}
                </select>
              </div>

              {selectedMembership && (
                <>
                  {/* Información de fechas */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Vence actualmente:</span>
                      <span className="font-semibold">
                        {new Date(
                          selectedClientMembership.end_date,
                        ).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        Nueva fecha de vencimiento:
                      </span>
                      <span className="font-semibold text-green-600">
                        {calculateNewEndDate()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-blue-300">
                      <span className="text-gray-700">Extensión:</span>
                      <span className="font-semibold text-blue-600">
                        +{selectedMembership.duration_days} días
                      </span>
                    </div>
                  </div>

                  {/* Precio personalizado */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Precio (editable)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customPrice || ""}
                      onChange={(e) =>
                        setCustomPrice(parseFloat(e.target.value) || 0)
                      }
                      placeholder={formatCurrency(selectedMembership.price)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Precio sugerido:{" "}
                      {formatCurrency(selectedMembership.price)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Método de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Descuento (opcional)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={customPrice || selectedMembership.price}
                      step="0.01"
                      value={discount || ""}
                      onChange={(e) =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Teléfono</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: 8888-8888"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Cédula</label>
                      <Input
                        value={idCard}
                        onChange={(e) => setIdCard(formatCedula(e.target.value))}
                        placeholder="###-######-####L"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Adquisición</label>
                      <Input
                        type="date"
                        value={acquisitionDate}
                        onChange={(e) => setAcquisitionDate(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Horas</label>
                      <Input
                        value={totalHours}
                        readOnly
                        placeholder="Ej: 10 horas"
                        className="h-9 bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Precio:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          customPrice || selectedMembership.price,
                        )}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Descuento:</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold">Total a Pagar:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(finalAmount)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleRenew}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {loading ? "Procesando..." : "Renovar Membresía"}
                  </Button>

                  <p className="text-sm text-gray-500 text-center">
                    La renovación se registrará en caja
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Award className="w-16 h-16 mx-auto mb-4" />
              <p>Selecciona una membresía para renovar</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
