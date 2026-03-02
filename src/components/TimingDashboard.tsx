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

interface TimingDashboardProps {
  onCheckout: (sessionId: number) => void;
}

export const TimingDashboard: React.FC<TimingDashboardProps> = ({
  onCheckout,
}) => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(
    null,
  );
  const [pausedSessions, setPausedSessions] = useState<Set<number>>(new Set());
  const { getActiveSessions, endSession } = useDatabase();
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

  const handleCheckout = async (session: ActiveSession) => {
    try {
      // NO llamar a endSession aquí, solo navegar a POS
      // La sesión se completará cuando se procese el pago
      success(`Procesando check-out para ${session.client_name}`);
      onCheckout(session.id);
    } catch (err) {
      console.error("Error en checkout:", err);
      errorNotification("Error al registrar el check-out");
    }
  };

  const handleCheckInSuccess = () => {
    loadSessions();
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
    session.client_name.toLowerCase().includes(searchQuery.toLowerCase()),
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
