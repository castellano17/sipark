import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LogOut, Pause, Eye } from "lucide-react";
import { useTimer, TimerStatus } from "@/hooks/useTimer";
import { useNotification } from "@/hooks/useNotification";

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
}) => {
  const { warning } = useNotification();

  const handleExpire = () => {
    warning(`¡Tiempo vencido para ${clientName}!`, 6000);
  };

  const { formattedTime, formattedRemaining, status } = useTimer(
    startTime,
    durationMinutes,
    handleExpire,
    isPaused,
  );

  const getStatusStyles = (status: TimerStatus, isPaused: boolean) => {
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
          borderColor: "border-rose-500",
          bgColor: "bg-rose-50",
          indicatorColor: "bg-rose-500",
          badgeColor: "bg-rose-100 text-rose-800",
          badgeText: "Vencido",
        };
    }
  };

  const styles = getStatusStyles(status, isPaused);

  return (
    <Card
      className={`shadow-md border-2 ${styles.borderColor} ${styles.bgColor} overflow-hidden hover:shadow-lg transition-shadow`}
    >
      {/* Indicador superior */}
      <div className={`h-1 ${styles.indicatorColor}`} />

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {clientName}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Ticket #{ticketNumber}
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
            {isPaused ? "PAUSADA" : formattedTime}
          </div>
          <div className="text-xs sm:text-sm text-slate-600 mt-2">
            {isPaused ? (
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
          <Button
            onClick={() => onPause?.(id)}
            variant="outline"
            className="w-full h-10 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-2"
          >
            <Pause className="w-4 h-4" />
            <span>{isPaused ? "Reanudar" : "Pausar"}</span>
          </Button>

          <Button
            onClick={() => onViewDetails?.(id)}
            variant="outline"
            className="w-full h-10 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-2"
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
        </div>
      </CardContent>
    </Card>
  );
};
