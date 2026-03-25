import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { Dashboard } from "./Dashboard";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "./ui/button";
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
import { WaiterPOS } from "./WaiterPOS";
import Promotions from "./Promotions";
import { SystemStatus, SystemUser } from "@/types";

interface MainLayoutProps {
  currentUser: SystemUser;
  onLogout: () => void;
}

import { useGlobalScanner } from "../hooks/useGlobalScanner";

export default function MainLayout({ currentUser, onLogout }: MainLayoutProps) {
  const [currentPath, setCurrentPath] = useState(currentUser.role === "mesero" ? "/mesero" : "/dashboard");
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const [systemName, setSystemName] = useState("SIPARK");
  const [systemLogo, setSystemLogo] = useState("");

  useEffect(() => {
    loadName();
    const interval = setInterval(loadName, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadName = async () => {
    try {
      const name = await (window as any).api.getSetting("system_name");
      if (name) setSystemName(name);
      
      const logo = await (window as any).api.getSetting("system_logo");
      if (logo) {
        // En desarrollo Vite corre en 5173 pero Express en 9595
        const isVite = window.location.port === "5173";
        const serverPort = isVite ? "9595" : (window.location.port || "80");
        const baseUrl = `http://${window.location.hostname}:${serverPort}`;
        setSystemLogo(`${baseUrl}/brand/${logo}`);
      }
    } catch {}
  };

  // Verificar estado de la base de datos y caja cada 5 segundos
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 10000);
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
    setIsMobileMenuOpen(false);
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
    // Verificar permisos dinámicamente según la ruta
    const moduleMap: Record<string, string> = {
      "/dashboard": "dashboard",
      "/operaciones": "operations",
      "/pos": "pos",
      "/pos/historial": "pos",
      "/pos/caja": "pos",
      "/mesero": "waiter",
      "/clientes": "clients",
      "/membresias": "memberships",
      "/membresias/vender": "memberships",
      "/membresias/renovar": "memberships",
      "/membresias/gestion": "memberships",
      "/cotizaciones": "quotations",
      "/reservaciones": "reservations",
      "/promociones": "promotions",
      "/inventario": "inventory",
      "/productos": "inventory",
      "/proveedores": "inventory",
      "/categorias": "inventory",
      "/compras": "inventory",
      "/insumos": "internal",
      "/equipo": "internal",
      "/reportes": "reports",
      "/usuarios": "users",
      "/configuracion": "settings",
      "/configuracion/facturas": "settings",
    };

    const module = moduleMap[currentPath];
    const hasPermission = (mod: string) => {
      if (currentUser.role === "admin") return true;
      return currentUser.permissions?.find((p: any) => p.module === mod)?.can_view;
    };

    if (module && !hasPermission(module)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <X className="w-16 h-16 mb-4 opacity-20" />
          <h2 className="text-xl font-bold">Acceso Denegado</h2>
          <p>No tienes permisos para ver este módulo.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setCurrentPath(currentUser.role === "mesero" ? "/mesero" : "/dashboard")}
          >
            Ir al inicio
          </Button>
        </div>
      );
    }

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
            onNavigate={handleNavigate}
          />
        );
      case "/mesero":
        return <WaiterPOS />;
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
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 z-40 relative shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center overflow-hidden">
             <img src={systemLogo || "./icon.png"} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
             <span className="text-white font-bold text-lg">{systemName.charAt(0)}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">{systemName}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onLogout} title="Cerrar Sesión" className="text-white hover:bg-slate-800">
            <LogOut className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:bg-slate-800">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Desktop */}
        <div className="hidden md:flex h-full">
          <Sidebar
            onNavigate={handleNavigate}
            currentPath={currentPath}
            onLogout={onLogout}
            currentUser={currentUser}
          />
        </div>

        {/* Sidebar Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex">
            <div className="w-[80vw] max-w-sm h-full bg-slate-950 shadow-2xl flex flex-col animate-in slide-in-from-left">
              <Sidebar
                onNavigate={handleNavigate}
                currentPath={currentPath}
                onLogout={onLogout}
                currentUser={currentUser}
              />
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

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
