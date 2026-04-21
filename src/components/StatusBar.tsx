import React, { useState, useEffect } from "react";
import { User, Clock, Monitor, HardDrive } from "lucide-react";
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
  const [tvActive, setTvActive] = useState(true);
  const [showDeviceStatus, setShowDeviceStatus] = useState(() => {
    // Cargar preferencia del localStorage
    const saved = localStorage.getItem('showDeviceStatus');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleDeviceStatus = () => {
    const newValue = !showDeviceStatus;
    setShowDeviceStatus(newValue);
    localStorage.setItem('showDeviceStatus', String(newValue));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusColor = (
    status: "connected" | "disconnected" | "error" | "open" | "closed" | "loading",
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
      case "loading":
        return "bg-slate-300 animate-pulse";
      default:
        return "bg-slate-400";
    }
  };

  const getStatusLabel = (
    status: "connected" | "disconnected" | "error" | "open" | "closed" | "loading",
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
      case "loading":
        return "Cargando...";
      default:
        return status;
    }
  };

  return (
    <footer className="h-10 bg-white border-t border-slate-200 flex items-center px-2 sm:px-4 gap-2 sm:gap-4 text-xs overflow-x-auto scrollbar-hide">
      {/* Database Status */}
      <div className="hidden md:flex items-center gap-2 whitespace-nowrap">
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
        <span className="text-slate-700 font-medium truncate max-w-[100px] sm:max-w-none">{currentUser}</span>
      </div>

      {/* Database Dot (Mobile only) */}
      <div className="flex md:hidden items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status.database)}`} title="Base de Datos" />
      </div>

      {/* Cash Box Status - Always visible */}
      <div className="hidden md:flex items-center gap-2 whitespace-nowrap">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(status.cashBox)}`}
        />
        <span className="text-slate-700">
          Caja: {getStatusLabel(status.cashBox)}
        </span>
      </div>

      {/* Device Status Indicators - Can be toggled */}
      {showDeviceStatus && (
        <>
          {/* Printer Status */}
          <div className="hidden lg:flex items-center gap-2 whitespace-nowrap">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(status.printer)}`}
            />
            <span className="text-slate-700">
              Impresora: {getStatusLabel(status.printer)}
            </span>
          </div>

          {/* Cash Drawer Status */}
          <div className="hidden lg:flex items-center gap-2 whitespace-nowrap">
            <div
              className={`w-2 h-2 rounded-full ${
                status.drawer === "loading"
                  ? "bg-slate-300 animate-pulse"
                  : status.drawer === "connected"
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />
            <span className="text-slate-700">
              Cajón:{" "}
              {status.drawer === "loading"
                ? "..."
                : status.drawer === "connected"
                ? "Conectado"
                : "Desconectado"}
            </span>
          </div>

          {/* NFC Reader Status */}
          <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
            <div
              className={`w-2 h-2 rounded-full ${
                status.nfcReaders > 0 ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-slate-700">
              NFC:{" "}
              <span className="hidden lg:inline">
              {status.nfcReaders > 0
                ? `${status.nfcReaders} lector${status.nfcReaders > 1 ? "es" : ""}`
                : "No detectado"}
              </span>
              <span className="inline lg:hidden">{status.nfcReaders > 0 ? "OK" : "No"}</span>
            </span>
          </div>
        </>
      )}

      {/* Separator */}
      <div className="hidden sm:block h-4 w-px bg-slate-300" />

      {/* Clock */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Clock className="w-4 h-4 text-slate-600" />
        <span className="font-mono text-slate-700">
          {formatTime(currentTime)}
        </span>
      </div>

      {/* Display Toggle Action */}
      <button 
        onClick={() => {
          setTvActive(prev => {
            const nv = !prev;
            (window as any).api.toggleAdsWindow(!nv);
            return nv;
          });
        }}
        className={`flex items-center gap-2 px-3 py-1 ml-auto rounded transition-colors ${tvActive ? 'hover:bg-slate-100' : 'bg-slate-200'}`}
        title="Ocultar/Mostrar Publicidad en Segunda Pantalla"
      >
        <Monitor className={`w-4 h-4 ${tvActive ? 'text-emerald-500' : 'text-slate-500'}`} />
        <span className="text-slate-700 hidden sm:inline">TV</span>
      </button>

      {/* Device Status Toggle */}
      <button 
        onClick={toggleDeviceStatus}
        className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${showDeviceStatus ? 'hover:bg-slate-100' : 'bg-slate-200'}`}
        title={showDeviceStatus ? "Ocultar estado de dispositivos" : "Mostrar estado de dispositivos"}
      >
        <HardDrive className={`w-4 h-4 ${showDeviceStatus ? 'text-blue-500' : 'text-slate-500'}`} />
        <span className="text-slate-700 hidden sm:inline">HW</span>
      </button>

      {/* Online Status */}
      <div className="flex items-center gap-2 whitespace-nowrap ml-4">
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
