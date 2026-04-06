import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Gamepad2,
  CreditCard,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Calendar,
  FileText,
  Gift,
  Utensils,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { MenuItem } from "@/types";
import { useDatabase } from "@/hooks/useDatabase";
import type { SystemUser } from "@/types";

interface SidebarProps {
  onNavigate: (path: string) => void;
  currentPath: string;
  onLogout: () => void;
  currentUser: SystemUser;
  expiredSessionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  currentPath,
  onLogout,
  currentUser,
  expiredSessionsCount = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["operaciones"]);
  const [systemName, setSystemName] = useState("SIPARK");
  const [systemLogo, setSystemLogo] = useState("");
  const { getSetting } = useDatabase();

  useEffect(() => {
    loadSystemName();
    const interval = setInterval(loadSystemName, 5000); 
    return () => clearInterval(interval);
  }, []);

  const loadSystemName = async () => {
    try {
      const name = await getSetting("system_name");
      if (name && name !== systemName) {
        setSystemName(name);
      }
      
      const logo = await getSetting("system_logo");
      if (logo) {
        const isVite = window.location.port === "5173";
        const serverPort = isVite ? "9595" : (window.location.port || "80");
        const baseUrl = `http://${window.location.hostname}:${serverPort}`;
        setSystemLogo(`${baseUrl}/brand/${logo}`);
      }
    } catch (e) {}
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  // Verificar si el usuario tiene permiso para ver un módulo
  const hasPermission = (module: string): boolean => {
    // Admin siempre tiene acceso a todo
    if (currentUser.role === "admin") return true;

    // Buscar el permiso del módulo
    const permission = currentUser.permissions?.find(
      (p) => p.module === module,
    );
    return permission?.can_view || false;
  };

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard Principal",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: "/dashboard",
    },
    {
      id: "operaciones",
      label: "Operaciones",
      icon: <Gamepad2 className="w-5 h-5" />,
      path: "/operaciones",
      children: [
        {
          id: "operaciones-dashboard",
          label: "Dashboard",
          icon: <Gamepad2 className="w-4 h-4" />,
          path: "/operaciones",
        },
        {
          id: "operaciones-paquetes",
          label: "Paquetes",
          icon: <Package className="w-4 h-4" />,
          path: "/operaciones/paquetes",
        },
      ],
    },
    {
      id: "membresias",
      label: "Membresías",
      icon: <Users className="w-5 h-5" />,
      path: "/membresias",
      children: [
        {
          id: "membresias-tipos",
          label: "Tipos de Membresía",
          icon: <Users className="w-4 h-4" />,
          path: "/operaciones/membresias",
        },
        {
          id: "membresias-vender",
          label: "Vender Membresía",
          icon: <CreditCard className="w-4 h-4" />,
          path: "/operaciones/vender-membresia",
        },
        {
          id: "membresias-renovar",
          label: "Renovar Membresía",
          icon: <Package className="w-4 h-4" />,
          path: "/operaciones/renovar-membresia",
        },
        {
          id: "membresias-gestionar",
          label: "Gestionar Membresías",
          icon: <Settings className="w-4 h-4" />,
          path: "/operaciones/gestionar-membresias",
        },
      ],
    },
    {
      id: "pos",
      label: "Punto de Venta",
      icon: <CreditCard className="w-5 h-5" />,
      path: "/pos",
      children: [
        {
          id: "pos-venta",
          label: "Nueva Venta",
          icon: <CreditCard className="w-4 h-4" />,
          path: "/pos",
        },
        {
          id: "pos-mesero",
          label: "Toma de Pedidos",
          icon: <Utensils className="w-4 h-4" />,
          path: "/mesero",
        },
        {
          id: "pos-historial",
          label: "Historial",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/pos/historial",
        },
        {
          id: "pos-caja",
          label: "Gestión de Caja",
          icon: <Package className="w-4 h-4" />,
          path: "/pos/caja",
        },
      ],
    },
    {
      id: "clientes",
      label: "Clientes",
      icon: <Users className="w-5 h-5" />,
      path: "/clientes",
    },
    {
      id: "reservaciones",
      label: "Reservaciones",
      icon: <Calendar className="w-5 h-5" />,
      path: "/reservaciones",
    },
    {
      id: "cotizaciones",
      label: "Cotizaciones",
      icon: <FileText className="w-5 h-5" />,
      path: "/cotizaciones",
    },
    {
      id: "inventario",
      label: "Inventario",
      icon: <Package className="w-5 h-5" />,
      path: "/inventario",
      children: [
        {
          id: "inventario-productos",
          label: "Stock",
          icon: <Package className="w-4 h-4" />,
          path: "/inventario",
        },
        {
          id: "inventario-lista",
          label: "Productos",
          icon: <Package className="w-4 h-4" />,
          path: "/inventario/productos",
        },
        {
          id: "inventario-compras",
          label: "Compras",
          icon: <Package className="w-4 h-4" />,
          path: "/inventario/compras",
        },
        {
          id: "inventario-proveedores",
          label: "Proveedores",
          icon: <Package className="w-4 h-4" />,
          path: "/inventario/proveedores",
        },
        {
          id: "inventario-categorias",
          label: "Categorías",
          icon: <Package className="w-4 h-4" />,
          path: "/inventario/categorias",
        },
      ],
    },
    {
      id: "inventario-interno",
      label: "Gestión Interna",
      icon: <Package className="w-5 h-5" />,
      path: "/inventario-interno",
      children: [
        {
          id: "inventario-insumos",
          label: "Insumos",
          icon: <Package className="w-4 h-4" />,
          path: "/inventario-interno/insumos",
        },
        {
          id: "inventario-equipos",
          label: "Mobiliario y Equipos",
          icon: <Package className="w-4 h-4" />,
          path: "/inventario-interno/equipos",
        },
      ],
    },
    {
      id: "promociones",
      label: "Promociones",
      icon: <Gift className="w-5 h-5" />,
      path: "/promociones",
    },
    {
      id: "usuarios",
      label: "Usuarios",
      icon: <UserCog className="w-5 h-5" />,
      path: "/usuarios",
    },
    {
      id: "reportes",
      label: "Reportes",
      icon: <BarChart3 className="w-5 h-5" />,
      path: "/reportes",
    },
    {
      id: "configuracion",
      label: "Configuración",
      icon: <Settings className="w-5 h-5" />,
      path: "/configuracion",
      children: [
        {
          id: "configuracion-general",
          label: "General",
          icon: <Settings className="w-4 h-4" />,
          path: "/configuracion",
        },
        {
          id: "configuracion-tickets",
          label: "Tickets",
          icon: <CreditCard className="w-4 h-4" />,
          path: "/configuracion/tickets",
        },
        {
          id: "configuracion-facturas",
          label: "Facturas",
          icon: <CreditCard className="w-4 h-4" />,
          path: "/configuracion/facturas",
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
      )}
      style={{ minHeight: "calc(100vh - 40px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center overflow-hidden">
               <img 
                 src={systemLogo || "./icon.png"} 
                 alt="Logo" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   // Si no hay logo, mostramos la primera letra
                   e.currentTarget.style.display = 'none';
                 }}
               />
               <span className="text-white font-bold text-lg">
                 {systemName.charAt(0)}
               </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight truncate">
              {systemName}
            </h1>
          </div>
        )}
        <Button
          variant="sidebar"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Quick Action */}
      {hasPermission("pos") && (
        <div className="p-4 border-b border-slate-800">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            onClick={() => onNavigate("/pos")}
            title={isCollapsed ? "Nueva Venta" : undefined}
          >
            <CreditCard className="w-4 h-4" />
            {!isCollapsed && <span>Nueva Venta</span>}
          </Button>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {(() => {
          // Mapeo de IDs de menú a módulos de permisos
          const moduleMap: Record<string, string> = {
            dashboard: "dashboard",
            operaciones: "operations",
            membresias: "memberships",
            pos: "pos",
            clientes: "clients",
            reservaciones: "reservations",
            cotizaciones: "quotations",
            inventario: "inventory",
            "inventario-interno": "internal",
            reportes: "reports",
            configuracion: "settings",
            usuarios: "users",
            promociones: "promotions",
            "pos-mesero": "waiter",
          };

          return menuItems
            .filter((item) => {
              const module = moduleMap[item.id];
              return module ? hasPermission(module) : true;
            })
            .map((item) => {
              const isActive = currentPath === item.path;
              const isExpanded = expandedMenus.includes(item.id);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.id}>
                  <Button
                    variant="sidebar"
                    className={cn(
                      "w-full justify-start gap-3 transition-all duration-200 relative",
                      isCollapsed && "justify-center",
                      isActive
                        ? "bg-slate-800 text-blue-400 border-l-2 border-blue-500"
                        : "",
                    )}
                    onClick={() => {
                      if (hasChildren && !isCollapsed) {
                        toggleMenu(item.id);
                      } else if (item.path) {
                        onNavigate(item.path);
                      }
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="text-sm flex-1 text-left">
                          {item.label}
                        </span>
                        {/* Badge de sesiones vencidas en Operaciones */}
                        {item.id === "operaciones" && expiredSessionsCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {expiredSessionsCount}
                          </span>
                        )}
                        {hasChildren && (
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 transition-transform",
                              isExpanded && "rotate-90",
                            )}
                          />
                        )}
                      </>
                    )}
                    {/* Badge para modo colapsado */}
                    {isCollapsed && item.id === "operaciones" && expiredSessionsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {expiredSessionsCount}
                      </span>
                    )}
                  </Button>

                  {/* Submenú */}
                  {hasChildren && isExpanded && !isCollapsed && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.filter(child => {
                        const module = moduleMap[child.id];
                        return module ? hasPermission(module) : true;
                      }).map((child) => {
                        const isChildActive = currentPath === child.path;
                        return (
                          <Button
                            key={child.id}
                            variant="sidebar"
                            className={cn(
                              "w-full justify-start gap-2 text-xs transition-all duration-200",
                              isChildActive
                                ? "bg-slate-800 text-blue-400"
                                : "text-slate-400",
                            )}
                            onClick={() => child.path && onNavigate(child.path)}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
        })()}
      </nav>

      {/* Footer - Logout */}
      <div className="p-2 border-t border-slate-800">
        <Button
          variant="sidebar"
          className={cn(
            "w-full justify-start gap-3 transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-950/30",
            isCollapsed && "justify-center",
          )}
          onClick={onLogout}
          title={isCollapsed ? "Salir" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Cerrar Sesión</span>}
        </Button>
      </div>
    </aside>
  );
};
