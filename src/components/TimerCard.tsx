import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LogOut, Pause, Eye, X } from "lucide-react";
import { useTimer, TimerStatus } from "@/hooks/useTimer";
import { useNotification } from "@/hooks/useNotification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TimerCardProps {
  id: number;
  clientName: string;
  ticketNumber: string;
  startTime: string;
  durationMinutes: number;
  onCheckout: (id: number) => void;
  onPause?: (id: number) => void;
  onViewDetails?: (id: number) => void;
  isPaused?: boolean;
  isPending?: boolean;
  onStartTimer?: (id: number) => void;
  onDelete?: (id: number) => void;
  childrenCount?: number;
  pauseStartTime?: string;
  enableExtraTimeCharge?: boolean;
}

export const TimerCard: React.FC<TimerCardProps> = ({
  id,
  clientName,
  ticketNumber,
  startTime,
  durationMinutes,
  onCheckout,
  onPause,
  onViewDetails,
  isPaused = false,
  isPending = false,
  onStartTimer,
  onDelete,
   childrenCount = 1,
  pauseStartTime,
  enableExtraTimeCharge = true,
}) => {
  const { warning } = useNotification();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExpire = () => {
    warning(`¡Tiempo vencido para ${clientName}!`, 6000);
  };

  const { formattedTime, formattedRemaining, status, elapsed } = useTimer(
    startTime,
    durationMinutes,
    handleExpire,
    isPaused,
    isPending,
    pauseStartTime,
  );

  const getStatusStyles = (
    status: TimerStatus,
    isPaused: boolean,
    isPending: boolean,
    enableExtraTimeCharge: boolean,
  ) => {
    if (isPending) {
      return {
        borderColor: "border-blue-400",
        bgColor: "bg-blue-50",
        indicatorColor: "bg-blue-400",
        badgeColor: "bg-blue-200 text-blue-800",
        badgeText: "En espera",
      };
    }

    if (isPaused) {
      return {
        borderColor: "border-slate-400",
        bgColor: "bg-slate-100",
        indicatorColor: "bg-slate-400",
        badgeColor: "bg-slate-200 text-slate-800",
        badgeText: "Pausada",
      };
    }

    switch (status) {
      case "active":
        return {
          borderColor: "border-emerald-500",
          bgColor: "bg-white",
          indicatorColor: "bg-emerald-500",
          badgeColor: "bg-emerald-100 text-emerald-800",
          badgeText: "Activo",
        };
      case "warning":
        return {
          borderColor: "border-amber-500",
          bgColor: "bg-amber-50",
          indicatorColor: "bg-amber-500",
          badgeColor: "bg-amber-100 text-amber-800",
          badgeText: "Próximo a vencer",
        };
      case "expired":
        return {
          borderColor: enableExtraTimeCharge ? "border-rose-500" : "border-blue-400",
          bgColor: enableExtraTimeCharge ? "bg-rose-50" : "bg-blue-50",
          indicatorColor: enableExtraTimeCharge ? "bg-rose-500" : "bg-blue-400",
          badgeColor: enableExtraTimeCharge ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800",
          badgeText: enableExtraTimeCharge ? "Vencido" : "Tiempo Cumplido",
        };
    }
  };

  const styles = getStatusStyles(status, isPaused, isPending, enableExtraTimeCharge);

  return (
    <Card
      className={`relative shadow-md border-2 ${styles.borderColor} ${styles.bgColor} overflow-hidden hover:shadow-lg transition-shadow`}
    >
      {/* Indicador superior */}
      <div className={`h-1 ${styles.indicatorColor}`} />

      {/* Botón para eliminar */}
      {onDelete && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-colors"
          title="Eliminar tarjeta"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <CardContent className="p-4 space-y-3 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {clientName}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Ticket #{ticketNumber} • {childrenCount} {childrenCount === 1 ? 'niño' : 'niños'}
            </p>
          </div>
          <Badge
            className={`${styles.badgeColor} whitespace-nowrap text-xs sm:text-sm`}
          >
            {styles.badgeText}
          </Badge>
        </div>

        {/* Cronómetro */}
        <div className="text-center py-3 bg-slate-50 rounded-lg">
          <div
            className="text-3xl sm:text-4xl font-bold font-mono text-slate-900"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {isPending ? "00:00:00" : formattedTime}
          </div>
          <div className="text-xs sm:text-sm text-slate-600 mt-2">
            {isPending ? (
              <span className="text-blue-600 font-semibold">Esperando inicio...</span>
            ) : isPaused ? (
              <span className="text-slate-600 font-semibold">
                Sesión pausada
              </span>
            ) : status === "expired" ? (
              <span className="text-rose-600 font-semibold">
                Tiempo vencido
              </span>
            ) : (
              <span>Quedan {formattedRemaining}</span>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-2">
          {isPending ? (
            <Button
              onClick={() => onStartTimer?.(id)}
              className="w-full h-12 text-base font-bold text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 shadow-md"
            >
              <span>▶ Empezar</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={() => onPause?.(id)}
                variant="outline"
                className="w-full h-10 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-0.5"
              >
                <Pause className="w-4 h-4" />
                <span>{isPaused ? "Reanudar" : "Pausar"}</span>
              </Button>

              <Button
                onClick={() => onViewDetails?.(id)}
                variant="outline"
                className="w-full h-10 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-0.5"
              >
                <Eye className="w-4 h-4" />
                <span>Detalles</span>
              </Button>

              <Button
                onClick={() => onCheckout(id)}
                className={`w-full h-10 text-sm font-semibold text-white flex items-center justify-center gap-2 ${
                  status === "expired"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Check-out</span>
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <X className="w-5 h-5" />
              Eliminar Tarjeta
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la sesión de <span className="font-semibold text-slate-900">{clientName}</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => {
                setShowDeleteConfirm(false);
                if (onDelete) onDelete(id);
              }}
            >
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
