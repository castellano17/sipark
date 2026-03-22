import { useState, useEffect } from "react";
import {
  Search,
  User,
  Award,
  CreditCard,
  Calendar,
  DollarSign,
  Save,
  X,
  Printer,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { useCurrency } from "../hooks/useCurrency";
import { useNotification } from "../hooks/useNotification";
import { usePrinter } from "../hooks/usePrinter";

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface MembershipType {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  benefits?: string;
  membership_type: string;
  discount_percentage: number;
  total_hours?: string;
  id_card?: string;
}

export function SellMembership() {
  const [clients, setClients] = useState<Client[]>([]);
  const [memberships, setMemberships] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastMembershipData, setLastMembershipData] = useState<any>(null);

  // Búsqueda de cliente
  const [clientSearch, setClientSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Selección de membresía
  const [selectedMembership, setSelectedMembership] =
    useState<MembershipType | null>(null);

  // Datos de pago
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Nuevos campos de membresía
  const [phone, setPhone] = useState<string>("");
  const [idCard, setIdCard] = useState<string>("");
  const [acquisitionDate, setAcquisitionDate] = useState<string>(
    new Date().toLocaleDateString("sv-SE"), // sv-SE format is YYYY-MM-DD
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
  const { printMembershipTicket, printMembershipInvoice } = usePrinter();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (clientSearch.length >= 2) {
      const filteredClients = clients.filter(
        (client) =>
          (client.name || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
          (client.phone || "").includes(clientSearch),
      );
      setFilteredClients(filteredClients);
      setShowClientDropdown(true);
    } else {
      setFilteredClients([]);
      setShowClientDropdown(false);
    }
  }, [clientSearch, clients]);

  useEffect(() => {
    if (selectedMembership) {
      const finalPrice = selectedMembership.price - discount;
      setPaymentAmount(finalPrice > 0 ? finalPrice : 0);
    }
  }, [selectedMembership, discount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, membershipsData] = await Promise.all([
        (window as any).api.getClients(),
        (window as any).api.getMemberships(),
      ]);
      setClients(clientsData);
      setMemberships(membershipsData.filter((m: any) => m.is_active));
    } catch (err: any) {
      error("Error al renovar membresía: " + (err.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setPhone(client.phone || "");
    setShowClientDropdown(false);
  };

  const handleSelectMembership = (membership: MembershipType) => {
    setSelectedMembership(membership);
    setPaymentAmount(membership.price);
    setTotalHours(membership.total_hours?.toString() || "");
  };

  const calculateEndDate = () => {
    if (!selectedMembership) return "";
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedMembership.duration_days);
    return endDate.toISOString();
  };

  const formatEndDate = () => {
    if (!selectedMembership) return "";
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedMembership.duration_days);
    return endDate.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      error("Debe seleccionar un cliente");
      return;
    }

    if (!selectedMembership) {
      error("Debe seleccionar un tipo de membresía");
      return;
    }

    if (paymentAmount <= 0) {
      error("El monto de pago debe ser mayor a 0");
      return;
    }

    if (!totalHours) {
      error("El campo N° de Entradas en horas es obligatorio");
      return;
    }

    try {
      setProcessing(true);

      // VALIDAR QUE HAY CAJA ABIERTA
      const activeCashBox = await (window as any).api.getActiveCashBox();
      if (!activeCashBox) {
        error("Debe abrir una caja antes de vender membresías");
        setProcessing(false);
        return;
      }

      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );

      // 1. Registrar venta en caja PRIMERO
      const saleData = {
        cash_box_id: activeCashBox.id,
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        items: [
          {
            product_id: null,
            product_name: `Membresía: ${selectedMembership.name}`,
            quantity: 1,
            unit_price: selectedMembership.price,
            discount: discount,
            subtotal: paymentAmount,
          },
        ],
        subtotal: selectedMembership.price,
        discount: discount,
        total: paymentAmount,
        payment_method: paymentMethod,
        notes: notes ? `Venta de membresía - ${notes}` : "Venta de membresía",
      };

      await (window as any).api.createSaleWithItems(saleData);

      // 2. Asignar membresía al cliente
      const membershipId = await (window as any).api.assignMembership(
        selectedClient.id,
        selectedMembership.id,
        paymentAmount,
        notes,
        currentUser.id || null,
        phone,
        idCard,
        acquisitionDate,
        totalHours
      );

      // Guardar datos para impresión
      const membershipData = {
        id: membershipId,
        client_name: selectedClient.name,
        membership_name: selectedMembership.name,
        start_date: new Date().toISOString(),
        end_date: calculateEndDate(),
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        notes: notes,
        phone: phone,
        id_card: idCard,
        total_hours: totalHours,
        acquisition_date: acquisitionDate,
      };

      // Imprimir automáticamente el ticket
      try {
        await printMembershipTicket(membershipData);
      } catch (printErr) {
      }

      // Mostrar modal de impresión (opcional ahora, para reimprimir o ver factura)
      setLastMembershipData(membershipData);
      setShowPrintModal(true);

      success("Membresía vendida exitosamente - Registrado en caja");
    } catch (err: any) {
      error("Error al procesar la venta de membresía: " + (err.message || "Error desconocido"));
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = async (type: "ticket" | "invoice") => {
    try {
      if (!lastMembershipData) {
        error("No hay membresía para imprimir");
        return;
      }

      if (type === "ticket") {
        try {
          await printMembershipTicket(lastMembershipData);
          success("Ticket enviado a impresora");
        } catch (printErr) {
          error("Error al imprimir ticket");
        }
      } else {
        await printMembershipInvoice(lastMembershipData);
        success("Factura PDF generada");
      }
    } catch (err) {
      error("Error al imprimir");
    }
  };

  const handleClosePrintModal = () => {
    setShowPrintModal(false);
    setLastMembershipData(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedClient(null);
    setSelectedMembership(null);
    setClientSearch("");
    setPaymentMethod("cash");
    setPaymentAmount(0);
    setDiscount(0);
    setNotes("");
    setPhone("");
    setIdCard("");
    setAcquisitionDate(new Date().toLocaleDateString("sv-SE"));
    setTotalHours("");
  };

  const getMembershipTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      standard: "Estándar",
      premium: "Premium",
      vip: "VIP",
      student: "Estudiante",
      family: "Familiar",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          🎫 Vender Membresía
        </h1>
        <p className="text-sm text-gray-600">
          Asigna una membresía a un cliente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Selección de Cliente */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            1. Seleccionar Cliente
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-10"
            />

            {showClientDropdown && filteredClients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedClient.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedClient.phone}
                  </p>
                  {selectedClient.email && (
                    <p className="text-sm text-gray-600">
                      {selectedClient.email}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientSearch("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Columna 2: Selección de Membresía */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            2. Seleccionar Membresía
          </h2>

          <div className="space-y-3 max-h-96 overflow-auto">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                onClick={() => handleSelectMembership(membership)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedMembership?.id === membership.id
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {membership.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {getMembershipTypeLabel(membership.membership_type)}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {formatCurrency(membership.price)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {membership.duration_days} días
                  </span>
                  {membership.discount_percentage > 0 && (
                    <span className="text-green-600 font-semibold">
                      {membership.discount_percentage}% desc.
                    </span>
                  )}
                </div>

                {membership.description && (
                  <p className="text-xs text-gray-500 mt-2">
                    {membership.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Columna 3: Pago y Confirmación */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            3. Procesar Pago
          </h2>

          {selectedMembership && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio base:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedMembership.price)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duración:</span>
                  <span className="font-semibold">
                    {selectedMembership.duration_days} días
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Válida hasta:</span>
                  <span className="font-semibold">{formatEndDate()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedMembership.price}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <option value="online">Pago Online</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a Pagar
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(parseFloat(e.target.value) || 0)
                    }
                    className="pl-10 text-lg font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono del Titular (Opcional)
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 8888-8888"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cédula (Opcional)
                  </label>
                  <Input
                    value={idCard}
                    onChange={(e) => setIdCard(formatCedula(e.target.value))}
                    placeholder="###-######-####L"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de adquisición
                  </label>
                  <Input
                    type="date"
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° de Entradas en horas
                  </label>
                      <Input
                        value={totalHours}
                        readOnly
                        placeholder="Ej: 10 horas"
                        className="bg-gray-50 cursor-not-allowed"
                      />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button
                  type="submit"
                  disabled={!selectedClient || processing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Confirmar Venta
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {!selectedMembership && (
            <div className="text-center py-8 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-3" />
              <p>Selecciona una membresía para continuar</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Impresión */}
      {showPrintModal && (
        <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-8 max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Membresía Vendida!
                </h2>
                <p className="text-gray-600">
                  La membresía ha sido asignada exitosamente
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={() => handlePrint("ticket")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Ticket
                </Button>

                <Button
                  onClick={() => handlePrint("invoice")}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Imprimir Factura
                </Button>

                <Button
                  onClick={handleClosePrintModal}
                  variant="outline"
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500">
                Puedes reimprimir desde el módulo de Membresías
              </p>
            </Card>
          </div>
        </Dialog>
      )}
    </div>
  );
}
