import React, { useState, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Plus, Search } from "lucide-react";
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
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(
    null,
  );
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

  // Atajo de teclado Ctrl+F para búsqueda
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
    const data = await getActiveSessions();
    setSessions(data || []);
  };

  const handleCheckout = (session: ActiveSession) => {
    setSessionToCheckout(session);
    setCheckoutConfirmOpen(true);
  };

  const confirmEndSession = async () => {
    if (!sessionToCheckout) return;
    try {
      // Precio 0 porque el usuario indica que ya fue cobrado al inicio
      const res = await endSession(sessionToCheckout.id, 0);
      if (res) {
        success(`Sesión de ${sessionToCheckout.client_name} finalizada correttamente`);
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
        loadSessions();
      } else {
        errorNotification("Error al iniciar el tiempo");
      }
    } catch (err) {
      errorNotification("Error al iniciar el tiempo");
    }
  };

  const handleCheckInSuccess = (data: {
    sessionId?: number;
    clientId?: number;
    clientName: string;
    packageId: number;
    packageName: string;
    packagePrice: number;
  }) => {
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

  // Filtrar sesiones por búsqueda
  const filteredSessions = sessions.filter((session) =>
    (session.client_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      {/* Barra de Herramientas */}
      <div className="flex items-center gap-3">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente... (Ctrl+F)"
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Botón Entrada Rápida */}
        <Button
          onClick={() => setModalOpen(true)}
          size="lg"
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Entrada Rápida</span>
          <span className="sm:hidden">+</span>
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Dashboard de Tiempos
        </h1>
        <p className="text-slate-600 mt-1">
          {filteredSessions.length} de {sessions.length} sesión(es) activa(s)
        </p>
      </div>

      {/* Grid de Tarjetas */}
      <ScrollArea className="flex-1">
        {filteredSessions.length > 0 ? (
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
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600 mb-4">
                {searchQuery
                  ? "No se encontraron resultados"
                  : "No hay sesiones activas en este momento"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setModalOpen(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Registrar Entrada
                </Button>
              )}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Check-in Modal */}
      <CheckInModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleCheckInSuccess}
      />

      {/* Modal de Confirmación de Check-out */}
      <Dialog open={checkoutConfirmOpen} onOpenChange={setCheckoutConfirmOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <LogOut className="w-6 h-6 text-blue-600" />
              Finalizar Sesión
            </DialogTitle>
            <DialogDescription className="text-base py-4 text-slate-600">
              El cliente <strong className="text-slate-900">{sessionToCheckout?.client_name}</strong> del ticket <strong className="text-slate-900">#{sessionToCheckout?.id.toString().padStart(4, '0')}</strong> ya se retira.
              <span className="mt-2 flex items-center gap-2">
                <span className="text-sm">Estado de pago:</span>
                {sessionToCheckout?.is_paid ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> PAGADO
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> PENDIENTE
                  </span>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>

          {sessionToCheckout && sessionToCheckout.start_time && (
            (() => {
              const start = new Date(sessionToCheckout.start_time);
              const duration = sessionToCheckout.duration_minutes || 60;
              const end = new Date(start.getTime() + duration * 60000);
              const now = new Date();
              const isEarly = now < end;
              const diffMs = now.getTime() - end.getTime();
              const extraMinutes = Math.floor(diffMs / 60000);
              const hasExtraTime = extraMinutes > 0;

              return (
                <div className="space-y-4 mb-4">
                  {isEarly ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">
                          ¡Atención! Salida Anticipada
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Aún tiene tiempo restante en su paquete. ¿Deseas finalizar el ticket #{sessionToCheckout.id.toString().padStart(4, "0")} antes de tiempo?
                        </p>
                      </div>
                    </div>
                  ) : hasExtraTime ? (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-rose-800">
                          ¡Tiempo Excedido! ({extraMinutes} min extra)
                        </p>
                        <p className="text-xs text-rose-700 mt-1">
                          Superó el tiempo del paquete. Se recomienda usar "Ir a Caja" para cobrar el excedente.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {sessionToCheckout.is_paid ? (
                        <>
                          <strong>Nota:</strong> El paquete base <strong>YA ESTÁ PAGADO</strong>. Elige "Finalizar Ahora" si no hay cargos extras o tiempo adicional.
                        </>
                      ) : (
                        <>
                          <strong>Nota:</strong> El paquete está <strong>PENDIENTE DE PAGO</strong>. Usa "Ir a Caja" para procesar el cobro total.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              );
            })()
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setCheckoutConfirmOpen(false)}
              className="flex-1 order-3 sm:order-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>

            <Button
              variant="outline"
              onClick={handlePOSRedirect}
              className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 order-2 sm:order-2"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Ir a Caja
            </Button>

            <Button
              onClick={confirmEndSession}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-3"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar Ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Details Modal */}
      <SessionDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        session={selectedSession}
        isPaused={
          selectedSession ? pausedSessions.has(selectedSession.id) : false
        }
      />
    </div>
  );
};
