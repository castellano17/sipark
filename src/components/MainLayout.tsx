import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { Dashboard } from "./Dashboard";
import { TimingDashboard } from "./TimingDashboard";
import { Settings } from "./Settings";
import { TicketConfig } from "./TicketConfig";
import { InvoiceConfig } from "./InvoiceConfig";
import { POSScreen } from "./POSScreen";
import { SalesHistory } from "./SalesHistory";
import { CashManagement } from "./CashManagement";
import { MembershipTypes } from "./MembershipTypes";
import { SellMembership } from "./SellMembership";
import { RenewMembership } from "./RenewMembership";
import { ClientMembershipsManager } from "./ClientMembershipsManager";
import { Inventory } from "./Inventory";
import { Products } from "./Products";
import { Suppliers } from "./Suppliers";
import { Categories } from "./Categories";
import { Purchases } from "./Purchases";
import { Users as UsersComponent } from "./Users";
import { Clients } from "./Clients";
import { PackagesManager } from "./PackagesManager";
import { Reports } from "./Reports";
import { Reservaciones } from "./Reservaciones";
import { Cotizaciones } from "./Cotizaciones";
import { SuppliesInventory } from "./SuppliesInventory";
import { EquipmentInventory } from "./EquipmentInventory";
import Promotions from "./Promotions";
import { SystemStatus, SystemUser } from "@/types";

interface MainLayoutProps {
  currentUser: SystemUser;
  onLogout: () => void;
}

import { useGlobalScanner } from "../hooks/useGlobalScanner";

export default function MainLayout({ currentUser, onLogout }: MainLayoutProps) {
  const [currentPath, setCurrentPath] = useState("/dashboard");
  const [checkoutData, setCheckoutData] = useState<any>(null);
  
  // Oído Global NFC
  useGlobalScanner(currentPath);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: "loading",
    printer: "loading",
    cashBox: "loading",
    drawer: "loading",
    nfcReaders: 0,
    currentTime: new Date(),
    isOnline: true,
  });

  // Verificar estado de la base de datos y caja cada 5 segundos
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Verificar dispositivos USB cada 15 segundos (más lento para no saturar el sistema)
  useEffect(() => {
    checkDeviceStatus();
    const interval = setInterval(checkDeviceStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkDeviceStatus = async () => {
    try {
      const devices = await (window as any).api.getConnectedDevices();
      setSystemStatus((prev) => ({
        ...prev,
        drawer: devices.drawerAvailable ? "connected" : "disconnected",
        nfcReaders: devices.nfcReaders || 0,
      }));
    } catch {
      setSystemStatus((prev) => ({ ...prev, drawer: "disconnected", nfcReaders: 0 }));
    }
  };

  const checkSystemStatus = async () => {
    try {
      const dbStatus = await window.api.checkDatabaseConnection();
      const activeCashBox = await (window as any).api.getActiveCashBox();
      let printerStatus: "connected" | "disconnected" | "error" = "disconnected";
      try {
        const printers = await window.api.getPrinters();
        printerStatus = printers && printers.length > 0 ? "connected" : "disconnected";
      } catch {
        printerStatus = "disconnected";
      }
      setSystemStatus((prev) => ({
        ...prev,
        database: dbStatus.connected ? "connected" : "error",
        printer: printerStatus,
        cashBox: activeCashBox ? "open" : "closed",
        currentTime: new Date(),
        isOnline: navigator.onLine,
      }));
    } catch (error) {
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleCheckout = async (sessionId: number) => {
    try {
      // Obtener datos de la sesión
      const sessions = await window.api.getActiveSessions();
      const session = sessions.find((s: any) => s.id === sessionId);

      if (session) {
        // Preparar datos para el POS
        setCheckoutData({
          sessionId: session.id,
          clientId: session.client_id,
          clientName: session.client_name,
          packageId: session.package_id,
          packageName: session.package_name,
          packagePrice: session.package_price,
          isPaid: session.is_paid, // Pasar el estado de pago
          startTime: session.start_time,
          durationMinutes: session.duration_minutes,
        });

        // Navegar al POS
        setCurrentPath("/pos");
      }
    } catch (error) {
    }
  };

  const handleCheckIn = async (data: {
    sessionId?: number;
    clientId?: number;
    clientName: string;
    packageId: number;
    packageName: string;
    packagePrice: number;
  }) => {
    // Ir al POS con el paquete pre-cargado
    // isCheckIn = true: solo cobrar, NO terminar la sesión (aún no ha iniciado el tiempo)
    setCheckoutData({
      sessionId: data.sessionId ?? 0,
      clientId: data.clientId ?? null,
      clientName: data.clientName,
      packageId: data.packageId,
      packageName: data.packageName,
      packagePrice: data.packagePrice,
      isCheckIn: true,
    });
    setCurrentPath("/pos");
  };

  const renderContent = () => {
    switch (currentPath) {
      case "/dashboard":
        return (
          <Dashboard
            currentUser={currentUser}
            onNavigate={(path) => setCurrentPath(path)}
          />
        );
      case "/operaciones":
        return (
          <TimingDashboard
            onCheckout={handleCheckout}
            onCheckIn={handleCheckIn}
          />
        );
      case "/operaciones/paquetes":
        return <PackagesManager />;
      case "/operaciones/membresias":
        return <MembershipTypes />;
      case "/operaciones/vender-membresia":
        return <SellMembership />;
      case "/operaciones/renovar-membresia":
        return <RenewMembership />;
      case "/operaciones/gestionar-membresias":
        return <ClientMembershipsManager />;
      case "/pos":
        return (
          <POSScreen
            checkoutData={checkoutData}
            onCheckoutComplete={() => setCheckoutData(null)}
          />
        );
      case "/pos/historial":
        return <SalesHistory />;
      case "/pos/caja":
        return <CashManagement />;
      case "/clientes":
        return <Clients />;
      case "/reservaciones":
        return <Reservaciones />;
      case "/cotizaciones":
        return <Cotizaciones />;
      case "/inventario":
        return <Inventory />;
      case "/inventario/productos":
        return <Products />;
      case "/inventario/compras":
        return <Purchases />;
      case "/inventario/proveedores":
        return <Suppliers />;
      case "/inventario/categorias":
        return <Categories />;
      case "/inventario-interno/insumos":
        return <SuppliesInventory />;
      case "/inventario-interno/equipos":
        return <EquipmentInventory />;
      case "/reportes":
        return <Reports />;
      case "/promociones":
        return <Promotions />;
      case "/usuarios":
        return <UsersComponent />;
      case "/configuracion":
        return <Settings />;
      case "/configuracion/tickets":
        return <TicketConfig />;
      case "/configuracion/facturas":
        return <InvoiceConfig />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Módulo en Desarrollo
              </h2>
              <p className="text-muted-foreground">
                Esta sección está siendo desarrollada
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          onNavigate={handleNavigate}
          currentPath={currentPath}
          onLogout={onLogout}
          currentUser={currentUser}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>

      {/* Status Bar */}
      <StatusBar
        status={systemStatus}
        currentUser={`${currentUser.first_name} ${currentUser.last_name}`}
      />
    </div>
  );
}
