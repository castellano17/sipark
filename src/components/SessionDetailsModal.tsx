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

  const startTime = new Date(session.start_time);
  const now = new Date();
  const elapsedMs = now.getTime() - startTime.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles de Sesión</DialogTitle>
          <DialogDescription>
            Información completa de la sesión activa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
          <Card className="shadow-md border-none bg-blue-50">
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-sm text-slate-600">Hora de Entrada</p>
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
                  {elapsedMinutes}m {elapsedSeconds}s
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Tiempo Restante</p>
                <p className="text-lg font-semibold text-slate-900">
                  {Math.max(
                    0,
                    (session.duration_minutes || 60) - elapsedMinutes,
                  )}
                  m
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card className="shadow-md border-none">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-slate-600">Estado</p>
              <div className="flex items-center gap-2">
                {isPaused ? (
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
