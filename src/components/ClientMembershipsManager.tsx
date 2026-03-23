import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Printer,
  FileText,
  XCircle,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useCurrency } from "../hooks/useCurrency";
import { useNotification } from "../hooks/useNotification";
import { usePrinter } from "../hooks/usePrinter";

interface ClientMembership {
  id: number;
  client_id: number;
  client_name: string;
  membership_id: number;
  membership_name: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_amount: number;
  payment_method: string;
  notes: string;
  created_at: string;
  days_remaining: number;
  phone?: string;
  id_card?: string;
  acquisition_date?: string;
  total_hours?: string;
}

export function ClientMembershipsManager() {
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<
    ClientMembership[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    membershipId: number | null;
  }>({ open: false, membershipId: null });

  const { formatCurrency } = useCurrency();
  const { success, error } = useNotification();
  const { printMembershipTicket, printMembershipInvoice } = usePrinter();

  useEffect(() => {
    loadMemberships();
  }, []);

  useEffect(() => {
    filterMemberships();
  }, [memberships, searchTerm, statusFilter]);

  const loadMemberships = async () => {
    try {
      setLoading(true);
      const data = await (window as any).api.getActiveMemberships("all");
      setMemberships(data.memberships || []);
    } catch (err) {
      error("Error al cargar membresías");
    } finally {
      setLoading(false);
    }
  };

  const filterMemberships = () => {
    let filtered = [...memberships];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.membership_name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => {
        if (statusFilter === "active") {
          return m.status === "active" && m.days_remaining > 0;
        } else if (statusFilter === "expired") {
          return m.status === "expired" || m.days_remaining <= 0;
        } else if (statusFilter === "expiring") {
          return (
            m.status === "active" &&
            m.days_remaining > 0 &&
            m.days_remaining <= 7
          );
        }
        return m.status === statusFilter;
      });
    }

    setFilteredMemberships(filtered);
  };

  const handlePrint = async (
    membership: ClientMembership,
    type: "ticket" | "invoice",
  ) => {
    try {
      if (type === "ticket") {
        await printMembershipTicket({
          ...membership,
          client_name: membership.client_name,
          membership_name: membership.membership_name,
          payment_amount: membership.payment_amount,
          payment_method: membership.payment_method || "N/A",
          phone: membership.phone || membership.client_phone,
          id_card: membership.id_card,
          total_hours: membership.total_hours,
        });
        success("Imprimiendo ticket en impresora térmica...");
      } else {
        await printMembershipInvoice({
          ...membership,
          client_name: membership.client_name,
          membership_name: membership.membership_name,
          payment_amount: membership.payment_amount,
          payment_method: membership.payment_method || "N/A",
          phone: membership.phone || membership.client_phone,
          id_card: membership.id_card,
          total_hours: membership.total_hours,
        });
        success("Factura PDF generada");
      }
    } catch (err: any) {
      error(
        type === "ticket" ? "Error al imprimir ticket" : "Error al generar PDF: " + (err.message || "Error desconocido"),
      );
    }
  };

  const handleCancelClick = (membershipId: number) => {
    setCancelDialog({ open: true, membershipId });
  };

  const handleCancelConfirm = async () => {
    if (!cancelDialog.membershipId) return;

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      await (window as any).api.cancelClientMembership(
        cancelDialog.membershipId,
        currentUser.id || null,
      );
      success("Membresía cancelada correctamente");
      setCancelDialog({ open: false, membershipId: null });
      loadMemberships();
    } catch (err) {
      error("Error al cancelar membresía");
    }
  };

  const getStatusBadge = (membership: ClientMembership) => {
    if (membership.status === "cancelled") {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Cancelada
        </span>
      );
    }

    if (membership.days_remaining <= 0) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Vencida
        </span>
      );
    }

    if (membership.days_remaining <= 7) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Por vencer ({membership.days_remaining}d)
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Activa ({membership.days_remaining}d)
      </span>
    );
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
          🎫 Gestión de Membresías
        </h1>
        <p className="text-sm text-gray-600">
          Administra todas las membresías vendidas
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente o membresía..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="expiring">Por vencer (7 días)</option>
              <option value="expired">Vencidas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Total: {filteredMemberships.length}
            </span>
          </div>
        </div>
      </Card>

      {/* Contenedor Principal de la Lista */}
      <Card className="flex-1 overflow-hidden">
        {/* VISTA MÓVIL (Tarjetas) */}
        <div className="md:hidden flex flex-col gap-4 p-4 overflow-y-auto h-full bg-gray-100">
          {filteredMemberships.map((membership) => (
            <div key={membership.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{membership.client_name}</h3>
                  <p className="text-sm font-semibold text-purple-700">{membership.membership_name}</p>
                </div>
                {getStatusBadge(membership)}
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-2">
                <div>
                  <span className="block text-xs text-gray-400">Teléfono / ID</span>
                  <span>{membership.phone || "-"}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-gray-400">Monto Pagado</span>
                  <span className="font-bold text-gray-900">{formatCurrency(membership.payment_amount)}</span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-500 pb-2">
                <span>Inicia: {new Date(membership.start_date).toLocaleDateString()}</span>
                <span>Vence: {new Date(membership.end_date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrint(membership, "ticket")}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" /> Ticket
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrint(membership, "invoice")}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </Button>
                {membership.status === "active" && membership.days_remaining > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelClick(membership.id)}
                    className="flex-none text-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {filteredMemberships.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No se encontraron membresías</p>
            </div>
          )}
        </div>

        {/* VISTA ESCRITORIO (Tabla) */}
        <div className="hidden md:block overflow-x-auto h-full">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Membresía</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cédula / Tel.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Horas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Inicio / Vence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Monto</th>
                <th className="w-32 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMemberships.map((membership) => (
                <tr key={membership.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{membership.client_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-900">{membership.membership_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-900 font-medium">{membership.id_card || "-"}</div>
                    <div className="text-xs text-gray-500">{membership.phone || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{membership.total_hours || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col text-xs text-gray-600">
                      <span>Inicia: {new Date(membership.start_date).toLocaleDateString()}</span>
                      <span className="font-semibold">Vence: {new Date(membership.end_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(membership)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-900">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(membership.payment_amount)}
                    </div>
                    <div className="text-xs text-gray-500">{membership.payment_method}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button size="sm" variant="outline" onClick={() => handlePrint(membership, "ticket")} title="Imprimir Ticket">
                        <Printer className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrint(membership, "invoice")} title="Generar Factura PDF">
                        <FileText className="w-3 h-3" />
                      </Button>
                      {membership.status === "active" && membership.days_remaining > 0 && (
                        <Button size="sm" variant="outline" onClick={() => handleCancelClick(membership.id)} title="Cancelar Membresía" className="text-red-600 hover:text-red-700">
                          <XCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMemberships.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No se encontraron membresías</p>
            </div>
          )}
        </div>
      </Card>

      {/* Dialog de Confirmación de Cancelación */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) =>
          setCancelDialog({ open, membershipId: cancelDialog.membershipId })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Está seguro de cancelar esta membresía?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La membresía será marcada como
              cancelada y el cliente no podrá usar sus beneficios.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setCancelDialog({ open: false, membershipId: null })
              }
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, cancelar membresía
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
