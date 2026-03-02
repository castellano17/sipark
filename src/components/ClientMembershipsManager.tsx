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
      console.error("Error cargando membresías:", err);
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
        await printMembershipTicket(membership);
        success("Imprimiendo ticket en impresora térmica...");
      } else {
        await printMembershipInvoice(membership);
        success("Generando PDF de factura...");
      }
    } catch (err) {
      console.error("Error:", err);
      error(
        type === "ticket" ? "Error al imprimir ticket" : "Error al generar PDF",
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
      console.error("Error cancelando membresía:", err);
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

      {/* Tabla de Membresías */}
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Membresía
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Inicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vencimiento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMemberships.map((membership) => (
                <tr key={membership.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {membership.client_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-900">
                        {membership.membership_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(membership.start_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(membership.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(membership)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-900">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(membership.payment_amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {membership.payment_method}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrint(membership, "ticket")}
                        title="Imprimir Ticket (Impresora Térmica)"
                      >
                        <Printer className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrint(membership, "invoice")}
                        title="Generar Factura PDF"
                      >
                        <FileText className="w-3 h-3" />
                      </Button>
                      {membership.status === "active" &&
                        membership.days_remaining > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelClick(membership.id)}
                            title="Cancelar Membresía"
                            className="text-red-600 hover:text-red-700"
                          >
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
