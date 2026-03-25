import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Printer,
  FileText,
  XCircle,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  History,
  TrendingDown,
  TrendingUp,
  RefreshCcw,
  X,
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
  balance?: number;
  nfc_uid?: string;
}

interface NfcTransaction {
  id: number;
  type: "charge" | "recharge" | "refund" | string;
  amount: number;
  new_balance: number;
  created_at: string;
  first_name?: string;
  last_name?: string;
  notes?: string;
}

export function ClientMembershipsManager() {
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<ClientMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    membershipId: number | null;
  }>({ open: false, membershipId: null });

  // ── Historial Modal ──
  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    membership: ClientMembership | null;
    transactions: NfcTransaction[];
    loading: boolean;
  }>({ open: false, membership: null, transactions: [], loading: false });

  const { formatCurrency } = useCurrency();
  const { success, error } = useNotification();
  const { printMembershipTicket, printMembershipInvoice, printMembershipHistoryTicket } = usePrinter();

  useEffect(() => {
    loadMemberships();
    const handleUpdate = () => loadMemberships();
    window.addEventListener("memberships-updated", handleUpdate);
    return () => window.removeEventListener("memberships-updated", handleUpdate);
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
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.membership_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.nfc_uid && m.nfc_uid.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => {
        if (statusFilter === "active") return m.status === "active" && m.days_remaining > 0;
        if (statusFilter === "expired") return m.status === "expired" || m.days_remaining <= 0;
        if (statusFilter === "expiring") return m.status === "active" && m.days_remaining > 0 && m.days_remaining <= 7;
        return m.status === statusFilter;
      });
    }
    setFilteredMemberships(filtered);
  };

  // ── Abrir historial ──
  const openHistory = async (membership: ClientMembership) => {
    setHistoryModal({ open: true, membership, transactions: [], loading: true });
    try {
      const txs: NfcTransaction[] = await (window as any).api.getNfcTransactions(membership.id);
      setHistoryModal((prev) => ({ ...prev, transactions: txs || [], loading: false }));
    } catch {
      setHistoryModal((prev) => ({ ...prev, transactions: [], loading: false }));
    }
  };

  const closeHistory = () =>
    setHistoryModal({ open: false, membership: null, transactions: [], loading: false });

  // ── Imprimir historial – ticket térmico ──
  const handlePrintHistoryTicket = async () => {
    if (!historyModal.membership) return;
    const ok = await printMembershipHistoryTicket(historyModal.membership, historyModal.transactions);
    if (ok) success("Imprimiendo historial en impresora térmica...");
    else error("No hay impresora de tickets configurada");
  };

  // ── Imprimir historial – PDF ──
  const handlePrintHistoryPDF = async () => {
    if (!historyModal.membership) return;
    try {
      await (window as any).api.generateMembershipPDF({
        type: "membership_history",
        membership: {
          ...historyModal.membership,
          balance: historyModal.membership.balance,
        },
        transactions: historyModal.transactions,
        isReprint: true,
      });
      success("PDF de historial generado correctamente");
    } catch (err: any) {
      error("Error al generar PDF: " + (err?.message || "Error desconocido"));
    }
  };

  // ── Imprimir ticket / factura (reimpresión existente) ──
  const handlePrint = async (membership: ClientMembership, type: "ticket" | "invoice") => {
    try {
      if (type === "ticket") {
        await printMembershipTicket({ ...membership, isReprint: true });
        success("Imprimiendo ticket en impresora térmica...");
      } else {
        await printMembershipInvoice({ ...membership, isReprint: true });
        success("Factura PDF generada");
      }
    } catch (err: any) {
      error(type === "ticket" ? "Error al imprimir ticket" : "Error al generar PDF: " + (err?.message || "Error desconocido"));
    }
  };

  const handleCancelClick = (membershipId: number) =>
    setCancelDialog({ open: true, membershipId });

  const handleCancelConfirm = async () => {
    if (!cancelDialog.membershipId) return;
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await (window as any).api.cancelClientMembership(cancelDialog.membershipId, currentUser.id || null);
      success("Membresía cancelada correctamente");
      setCancelDialog({ open: false, membershipId: null });
      loadMemberships();
    } catch {
      error("Error al cancelar membresía");
    }
  };

  const getStatusBadge = (membership: ClientMembership) => {
    if (membership.status === "cancelled")
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Cancelada
        </span>
      );
    if (membership.days_remaining <= 0)
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded flex items-center gap-1">
          <Clock className="w-3 h-3" /> Vencida
        </span>
      );
    if (membership.days_remaining <= 7)
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Por vencer ({membership.days_remaining}d)
        </span>
      );
    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> Activa ({membership.days_remaining}d)
      </span>
    );
  };

  const getTxIcon = (type: string) => {
    if (type === "charge") return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    if (type === "recharge") return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
    if (type === "refund") return <RefreshCcw className="w-3.5 h-3.5 text-blue-500" />;
    return <DollarSign className="w-3.5 h-3.5 text-gray-400" />;
  };

  const getTxLabel = (type: string) => {
    if (type === "charge") return "Cobro";
    if (type === "recharge") return "Recarga";
    if (type === "refund") return "Reembolso";
    return type;
  };

  const getTxAmountColor = (type: string) => {
    if (type === "charge") return "text-red-600 font-bold";
    if (type === "recharge") return "text-green-600 font-bold";
    if (type === "refund") return "text-blue-600 font-bold";
    return "text-gray-700 font-bold";
  };

  const getTxAmountSign = (type: string) => (type === "charge" ? "-" : "+");

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
        <h1 className="text-2xl font-bold text-gray-800">🎫 Gestión de Membresías</h1>
        <p className="text-sm text-gray-600">Administra todas las membresías vendidas</p>
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
            <span className="text-sm text-gray-600">Total: {filteredMemberships.length}</span>
          </div>
        </div>
      </Card>

      {/* Lista */}
      <Card className="flex-1 overflow-hidden">
        {/* VISTA MÓVIL */}
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
                <Button size="sm" variant="outline" onClick={() => openHistory(membership)} className="flex-1">
                  <History className="w-4 h-4 mr-2" /> Historial
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePrint(membership, "ticket")} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" /> Ticket
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePrint(membership, "invoice")} className="flex-1">
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </Button>
                {membership.status === "active" && membership.days_remaining > 0 && (
                  <Button size="sm" variant="outline" onClick={() => handleCancelClick(membership.id)} className="flex-none text-red-600">
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

        {/* VISTA ESCRITORIO */}
        <div className="hidden md:block overflow-x-auto h-full">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Membresía</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Saldo (Membresía)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cédula / Tel.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Horas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Inicio / Vence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
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
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{membership.membership_name}</div>
                    <div className="text-xs text-gray-500">Total: {formatCurrency(membership.payment_amount)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">{formatCurrency(membership.balance || 0)}</div>
                    {membership.nfc_uid && (
                      <div className="text-[10px] text-gray-400 font-mono">ID: {membership.nfc_uid}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-900 font-medium">{membership.id_card || "-"}</div>
                    <div className="text-xs text-gray-500">{membership.phone || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {membership.total_hours || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col text-xs text-gray-600">
                      <span>Inicia: {new Date(membership.start_date).toLocaleDateString()}</span>
                      <span className="font-semibold">Vence: {new Date(membership.end_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(membership)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openHistory(membership)}
                        title="Ver Historial de Uso"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <History className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrint(membership, "ticket")} title="Reimprimir Ticket">
                        <Printer className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrint(membership, "invoice")} title="Generar Factura PDF">
                        <FileText className="w-3 h-3" />
                      </Button>
                      {membership.status === "active" && membership.days_remaining > 0 && (
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

      {/* ── Modal: Historial de Membresía ── */}
      {historyModal.open && historyModal.membership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Header del modal */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <History className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Historial de Membresía</span>
                  </div>
                  <h2 className="text-xl font-bold">{historyModal.membership.client_name}</h2>
                  <p className="text-sm opacity-80">{historyModal.membership.membership_name}</p>
                </div>
                <button
                  onClick={closeHistory}
                  className="ml-4 p-1.5 rounded-full hover:bg-white/20 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Resumen rápido */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-xs opacity-70">Saldo Actual</p>
                  <p className="text-lg font-bold">{formatCurrency(historyModal.membership.balance || 0)}</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-xs opacity-70">Horas / Entradas</p>
                  <p className="text-lg font-bold">{historyModal.membership.total_hours || "—"}</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-xs opacity-70">Vence</p>
                  <p className="text-sm font-bold leading-tight">{new Date(historyModal.membership.end_date).toLocaleDateString("es-ES")}</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-xs opacity-70">Estado</p>
                  <p className="text-sm font-bold leading-tight capitalize">
                    {historyModal.membership.status === "active" && historyModal.membership.days_remaining > 0
                      ? "✅ Activa"
                      : historyModal.membership.status === "cancelled"
                      ? "❌ Cancelada"
                      : "⏰ Vencida"}
                  </p>
                </div>
              </div>
            </div>

            {/* Datos de la membresía */}
            <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 text-sm text-indigo-800 flex flex-wrap gap-x-6 gap-y-1">
              <span><b>Cédula:</b> {historyModal.membership.id_card || "—"}</span>
              <span><b>Teléfono:</b> {historyModal.membership.phone || "—"}</span>
              <span><b>Inicio:</b> {new Date(historyModal.membership.start_date).toLocaleDateString("es-ES")}</span>
              <span><b>Monto Pagado:</b> {formatCurrency(historyModal.membership.payment_amount)}</span>
              {historyModal.membership.nfc_uid && (
                <span className="font-mono"><b>UID:</b> {historyModal.membership.nfc_uid}</span>
              )}
            </div>

            {/* Tabla de transacciones */}
            <div className="flex-1 overflow-y-auto">
              {historyModal.loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-500">Cargando historial...</span>
                </div>
              ) : historyModal.transactions.length === 0 ? (
                <div className="text-center py-16">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 font-medium">No hay transacciones registradas</p>
                  <p className="text-gray-400 text-sm mt-1">Esta membresía aún no tiene movimientos de saldo</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Saldo Resultante</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cajero</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyModal.transactions.map((tx, idx) => (
                      <tr key={tx.id ?? idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">
                          {new Date(tx.created_at).toLocaleString("es-ES", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {getTxIcon(tx.type)}
                            <span className="font-medium text-gray-800">{getTxLabel(tx.type)}</span>
                          </div>
                          {tx.notes && (
                            <div className="text-[11px] text-gray-400 mt-0.5">{tx.notes}</div>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap ${getTxAmountColor(tx.type)}`}>
                          {getTxAmountSign(tx.type)}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-indigo-700">
                          {formatCurrency(tx.new_balance)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {tx.first_name ? `${tx.first_name} ${tx.last_name || ""}` : "Sistema"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer con botones de impresión */}
            <div className="p-4 border-t bg-gray-50 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-400">
                {historyModal.transactions.length} transacción(es) registrada(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintHistoryTicket}
                  className="gap-2"
                  disabled={historyModal.loading}
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ticket
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintHistoryPDF}
                  className="gap-2 text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                  disabled={historyModal.loading}
                >
                  <FileText className="w-4 h-4" />
                  Exportar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={closeHistory}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Confirmación de Cancelación */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, membershipId: cancelDialog.membershipId })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Está seguro de cancelar esta membresía?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La membresía será marcada como cancelada y el cliente no podrá usar sus beneficios.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, membershipId: null })}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleCancelConfirm} className="bg-red-600 hover:bg-red-700">
              Sí, cancelar membresía
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
