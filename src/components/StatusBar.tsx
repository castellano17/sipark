import React, { useState, useEffect } from "react";
import { User, Clock } from "lucide-react";
import { SystemStatus } from "@/types";

interface StatusBarProps {
  status: SystemStatus;
  currentUser: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  status,
  currentUser,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusColor = (
    status: "connected" | "disconnected" | "error" | "open" | "closed",
  ) => {
    switch (status) {
      case "connected":
      case "open":
        return "bg-emerald-500";
      case "disconnected":
      case "closed":
        return "bg-amber-500";
      case "error":
        return "bg-rose-500";
      default:
        return "bg-slate-400";
    }
  };

  const getStatusLabel = (
    status: "connected" | "disconnected" | "error" | "open" | "closed",
  ) => {
    switch (status) {
      case "connected":
        return "Conectada";
      case "disconnected":
        return "Desconectada";
      case "error":
        return "Error";
      case "open":
        return "Abierta";
      case "closed":
        return "Cerrada";
      default:
        return status;
    }
  };

  return (
    <footer className="h-10 bg-white border-t border-slate-200 flex items-center px-4 gap-4 text-xs overflow-x-auto">
      {/* Database Status */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(status.database)}`}
        />
        <span className="text-slate-700">
          BD: {getStatusLabel(status.database)}
        </span>
      </div>

      {/* User */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <User className="w-4 h-4 text-slate-600" />
        <span className="text-slate-700">{currentUser}</span>
      </div>

      {/* Printer Status */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(status.printer)}`}
        />
        <span className="text-slate-700">
          Impresora: {getStatusLabel(status.printer)}
        </span>
      </div>

      {/* Cash Box Status */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(status.cashBox)}`}
        />
        <span className="text-slate-700">
          Caja: {getStatusLabel(status.cashBox)}
        </span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-slate-300" />

      {/* Clock */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Clock className="w-4 h-4 text-slate-600" />
        <span className="font-mono text-slate-700">
          {formatTime(currentTime)}
        </span>
      </div>

      {/* Online Status */}
      <div className="flex items-center gap-2 whitespace-nowrap ml-auto">
        {status.isOnline ? (
          <>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700">Online</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-700">Offline</span>
          </>
        )}
      </div>
    </footer>
  );
};
