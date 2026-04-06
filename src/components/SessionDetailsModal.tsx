import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ActiveSession } from "@/types";

interface SessionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ActiveSession | null;
  isPaused?: boolean;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  open,
  onOpenChange,
  session,
  isPaused = false,
}) => {
  if (!session) return null;

  const isPending = session.status === "pending";
  const startTime = new Date(session.start_time);
  const now = new Date();
  
  // Si está en pending, el tiempo no ha comenzado
  const elapsedMs = isPending ? 0 : Math.max(0, now.getTime() - startTime.getTime());
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedSecondsRemainder = elapsedSeconds % 60;
  
  const durationMinutes = session.duration_minutes || 60;
  const remainingMinutes = isPending
    ? durationMinutes
    : Math.max(0, durationMinutes - elapsedMinutes);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles de Sesión</DialogTitle>
          <DialogDescription>
            Información completa de la sesión
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cliente */}
          <Card className="shadow-md border-none">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-slate-600">Cliente</p>
              <p className="text-lg font-semibold text-slate-900">
                {session.client_name}
              </p>
            </CardContent>
          </Card>

          {/* Ticket */}
          <Card className="shadow-md border-none">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-slate-600">Número de Ticket</p>
              <p className="text-lg font-semibold text-slate-900">
                #{session.id.toString().padStart(4, "0")}
              </p>
            </CardContent>
          </Card>

          {/* Paquete */}
          <Card className="shadow-md border-none">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-slate-600">Paquete</p>
              <p className="text-lg font-semibold text-slate-900">
                {session.package_name || "Servicio estándar"}
              </p>
              <p className="text-sm text-slate-600">
                Duración: {session.duration_minutes} minutos
              </p>
            </CardContent>
          </Card>

          {/* Tiempo */}
          <Card className="shadow-md border-none bg-blue-50 sm:col-span-2">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">Hora de Registro</p>
                <p className="text-lg font-semibold text-slate-900">
                  {startTime.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Tiempo Transcurrido</p>
                <p className="text-lg font-semibold text-slate-900">
                  {isPending ? (
                    <span className="text-blue-600">En espera</span>
                  ) : (
                    `${elapsedMinutes}m ${elapsedSecondsRemainder}s`
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Tiempo Restante</p>
                <p className="text-lg font-semibold text-slate-900">
                  {isPending ? (
                    <span className="text-blue-600">{remainingMinutes}m (disponible)</span>
                  ) : (
                    `${remainingMinutes}m`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card className="shadow-md border-none">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-slate-600">Estado</p>
              <div className="flex items-center gap-2">
                {isPending ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    En espera de inicio
                  </span>
                ) : isPaused ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 text-slate-800 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-slate-600 rounded-full"></span>
                    Pausada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                    Activa
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
