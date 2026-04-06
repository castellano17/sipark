import React, { useState, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Plus, Search, RefreshCw } from "lucide-react";
import { ActiveSession } from "@/types";
import { useDatabase } from "@/hooks/useDatabase";
import { useNotification } from "@/hooks/useNotification";
import { CheckInModal } from "./CheckInModal";
import { TimerCard } from "./TimerCard";
import { SessionDetailsModal } from "./SessionDetailsModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { LogOut, Receipt, X, CheckCircle, AlertTriangle } from "lucide-react";

interface TimingDashboardProps {
  onCheckout: (sessionId: number) => void;
  onCheckIn?: (data: {
    sessionId?: number;
    clientId?: number;
    clientName: string;
    packageId: number;
    packageName: string;
    packagePrice: number;
  }) => void;
}

export const TimingDashboard: React.FC<TimingDashboardProps> = ({
  onCheckout,
  onCheckIn,
}) => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [sessionToCheckout, setSessionToCheckout] = useState<ActiveSession | null>(null);
  const [pausedSessions, setPausedSessions] = useState<Set<number>>(new Set());
  const { getActiveSessions, endSession, startTimerSession } = useDatabase();
  const { success, error: errorNotification, warning } = useNotification();

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const searchInput = document.getElementById("search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getActiveSessions();
      setSessions(data || []);
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  };

  const handleCheckout = (session: ActiveSession) => {
    setSessionToCheckout(session);
    setCheckoutConfirmOpen(true);
  };

  const confirmEndSession = async () => {
    if (!sessionToCheckout) return;
    try {
      const res = await endSession(sessionToCheckout.id, 0);
      if (res) {
        success(`Sesión de ${sessionToCheckout.client_name} finalizada correctamente`);
        loadSessions();
        setCheckoutConfirmOpen(false);
      } else {
        errorNotification("Error al finalizar la sesión");
      }
    } catch (err) {
      errorNotification("Error al finalizar la sesión");
    }
  };

  const handlePOSRedirect = () => {
    if (!sessionToCheckout) return;
    onCheckout(sessionToCheckout.id);
    setCheckoutConfirmOpen(false);
  };

  const handleStartTimer = async (sessionId: number) => {
    try {
      const res = await startTimerSession(sessionId);
      if (res) {
        success("Tiempo iniciado");
        await loadSessions();
      } else {
        errorNotification("Error al iniciar el tiempo");
      }
    } catch (err) {
      errorNotification("Error al iniciar el tiempo");
    }
  };

  const handleCheckInSuccess = (data: any) => {
    success("Cliente registrado exitosamente");
    loadSessions();
    if (onCheckIn) {
      onCheckIn(data);
    }
  };

  const handlePause = (sessionId: number) => {
    if (pausedSessions.has(sessionId)) {
      setPausedSessions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      success("Sesión reanudada");
    } else {
      setPausedSessions((prev) => new Set(prev).add(sessionId));
      warning("Sesión pausada");
    }
  };

  const handleViewDetails = (sessionId: number) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setDetailsOpen(true);
    }
  };

  const filteredSessions = sessions.filter((session) =>
    (session.client_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full gap-4 p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard de Tiempos</h1>
          <p className="text-slate-500 text-sm">
            {sessions.length} sesiones encontradas en base de datos
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            size="icon"
            onClick={loadSessions}
            className="hover:bg-blue-50 hover:text-blue-600 border-slate-200"
            title="Recargar sesiones"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Buscar por nombre de niño... (Ctrl+F)"
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-50/50 rounded-xl border border-slate-100 p-4">
        <ScrollArea className="h-full">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
                <Receipt className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-lg font-medium">No hay sesiones activas en este momento</p>
              <p className="text-sm">Registra una nueva entrada para empezar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4">
              {filteredSessions.map((session) => (
                <TimerCard
                  key={session.id}
                  id={session.id}
                  clientName={session.client_name}
                  ticketNumber={session.id.toString().padStart(4, "0")}
                  startTime={session.start_time}
                  durationMinutes={session.duration_minutes || 60}
                  onCheckout={() => handleCheckout(session)}
                  onPause={handlePause}
                  onViewDetails={handleViewDetails}
                  isPaused={pausedSessions.has(session.id)}
                  isPending={session.status === "pending"}
                  onStartTimer={handleStartTimer}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <CheckInModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleCheckInSuccess}
      />

      <SessionDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        session={selectedSession}
      />

      <Dialog open={checkoutConfirmOpen} onOpenChange={setCheckoutConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-blue-600" />
              Finalizar Sesión
            </DialogTitle>
            <DialogDescription>
              Cliente: <span className="font-semibold text-slate-900">{sessionToCheckout?.client_name}</span>
            </DialogDescription>
          </DialogHeader>

          {sessionToCheckout && (() => {
            const isPaid = sessionToCheckout.is_paid;
            const isPending = sessionToCheckout.status === "pending";
            
            // Si está en pending, no calcular tiempo extra
            if (isPending) {
              return (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">⏸ Sesión no iniciada</p>
                      <p className="text-xs text-blue-700">El tiempo aún no ha comenzado</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutConfirmOpen(false)}
                    className="w-full p-3 rounded-lg border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              );
            }
            
            const startTime = new Date(sessionToCheckout.start_time);
            const now = new Date();
            const durationMinutes = sessionToCheckout.duration_minutes || 60;
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
            
            // Calcular tiempo transcurrido en segundos
            const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const durationSeconds = durationMinutes * 60;
            
            // Hay tiempo extra si el tiempo transcurrido supera la duración
            const hasExtraTime = elapsedSeconds > durationSeconds;
            const extraSeconds = hasExtraTime ? elapsedSeconds - durationSeconds : 0;
            const extraMinutes = Math.ceil(extraSeconds / 60); // Redondear hacia arriba

            return (
              <div className="space-y-4 py-4">
                {/* Estado de Pago */}
                {isPaid ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">✓ Cliente ya pagó</p>
                      <p className="text-xs text-green-700">Entrada pagada al registrarse</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900">⚠ Cliente NO ha pagado</p>
                      <p className="text-xs text-amber-700">Debe pasar por caja para cobrar</p>
                    </div>
                  </div>
                )}

                {/* Tiempo Extra */}
                {hasExtraTime && extraMinutes > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-rose-900">⏱ Tiempo excedido</p>
                      <p className="text-sm text-rose-700">
                        {extraMinutes} minuto{extraMinutes !== 1 ? 's' : ''} de más
                      </p>
                      <p className="text-xs text-rose-600 mt-1">
                        Se cobrará el tiempo extra en caja
                      </p>
                    </div>
                  </div>
                )}

                {/* Opciones */}
                <div className="grid gap-3">
                  {/* Ir a POS - Siempre disponible si NO ha pagado, o si hay tiempo extra (opcional) */}
                  {!isPaid || hasExtraTime ? (
                    <button
                      onClick={handlePOSRedirect}
                      className="flex items-start gap-4 p-4 rounded-xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Receipt className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">Ir a Caja (POS)</p>
                        <p className="text-sm text-slate-600">
                          {!isPaid && hasExtraTime 
                            ? `Cobrar entrada + ${extraMinutes} min de tiempo extra`
                            : !isPaid 
                            ? "Cobrar entrada del cliente"
                            : `Cobrar ${extraMinutes} min de tiempo extra`}
                        </p>
                      </div>
                    </button>
                  ) : null}

                  {/* Finalizar Directamente - Siempre disponible si YA pagó */}
                  {isPaid && (
                    <button
                      onClick={confirmEndSession}
                      className="flex items-start gap-4 p-4 rounded-xl border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition-all text-left"
                    >
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">Finalizar Directamente</p>
                        <p className="text-sm text-slate-600">
                          {hasExtraTime 
                            ? `Cerrar sesión sin cobrar los ${extraMinutes} min extra`
                            : "Cerrar sesión sin cobros adicionales"}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCheckoutConfirmOpen(false)}
              className="w-full text-slate-500"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
