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
import { SystemStatus, SystemUser } from "@/types";

interface MainLayoutProps {
  currentUser: SystemUser;
  onLogout: () => void;
}

export default function MainLayout({ currentUser, onLogout }: MainLayoutProps) {
  const [currentPath, setCurrentPath] = useState("/dashboard");
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: "connected",
    printer: "disconnected",
    cashBox: "closed",
    currentTime: new Date(),
    isOnline: true,
  });

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 5000); // Verificar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Verificar estado de la base de datos
      const dbStatus = await window.api.checkDatabaseConnection();

      // Verificar estado de la caja
      const activeCashBox = await window.api.getActiveCashBox();

      // Verificar impresora
      let printerStatus: "connected" | "disconnected" | "error" =
        "disconnected";
      try {
        const printers = await window.api.getPrinters();
        printerStatus =
          printers && printers.length > 0 ? "connected" : "disconnected";
      } catch {
        printerStatus = "disconnected";
      }

      setSystemStatus({
        database: dbStatus.connected ? "connected" : "error",
        printer: printerStatus,
        cashBox: activeCashBox ? "open" : "closed",
        currentTime: new Date(),
        isOnline: navigator.onLine,
      });
    } catch (error) {
      console.error("Error checking system status:", error);
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
        });

        // Navegar al POS
        setCurrentPath("/pos");
      }
    } catch (error) {
      console.error("Error en checkout:", error);
    }
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
        return <TimingDashboard onCheckout={handleCheckout} />;
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
      case "/reportes":
        return <Reports />;
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
