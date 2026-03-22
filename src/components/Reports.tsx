import { useState } from "react";
import {
  BarChart3,
  DollarSign,
  Users,
  Package,
  FileText,
  ShoppingCart,
  Clock,
  Shield,
  Receipt,
  Activity,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ExecutiveDashboard } from "./reports/ExecutiveDashboard";
import { SalesByPeriod } from "./reports/SalesByPeriod";
import { CashBoxReport } from "./reports/CashBoxReport";
import { StockReport } from "./reports/StockReport";
import { TopClientsReport } from "./reports/TopClientsReport";
import { SalesByProductReport } from "./reports/SalesByProductReport";
import { CashFlowReport } from "./reports/CashFlowReport";
import { InventoryMovementsReport } from "./reports/InventoryMovementsReport";
import { PurchasesByPeriodReport } from "./reports/PurchasesByPeriodReport";
import { SessionsByPeriodReport } from "./reports/SessionsByPeriodReport";
// Fase 3
import { SalesByPaymentMethod } from "./reports/SalesByPaymentMethod";
import { SalesByHour } from "./reports/SalesByHour";
import { ProductsWithoutMovement } from "./reports/ProductsWithoutMovement";
import { FrequentClients } from "./reports/FrequentClients";
import { InactiveClients } from "./reports/InactiveClients";
import { PurchasesBySupplier } from "./reports/PurchasesBySupplier";
// Fase 3 - Adicionales
import SalesByClient from "./reports/SalesByClient";
import SalesComparison from "./reports/SalesComparison";
import IncomeVsExpenses from "./reports/IncomeVsExpenses";
import InventoryValuation from "./reports/InventoryValuation";
import ActiveClients from "./reports/ActiveClients";
import NewClients from "./reports/NewClients";
import BestSellingPackages from "./reports/BestSellingPackages";
import AverageSessionDuration from "./reports/AverageSessionDuration";
import ActiveMemberships from "./reports/ActiveMemberships";
import ExpiringMemberships from "./reports/ExpiringMemberships";
import SessionsHistory from "./reports/SessionsHistory";
import DiscountsReport from "./reports/DiscountsReport";
import { DailyCashSummary } from "./reports/DailyCashSummary";
import { UserActivityReport } from "./reports/UserActivityReport";
import { InventoryChangesReport } from "./reports/InventoryChangesReport";
import { SystemAccessReport } from "./reports/SystemAccessReport";
import { InventoryAdjustmentsReport } from "./reports/InventoryAdjustmentsReport";
import { PriceChangesReport } from "./reports/PriceChangesReport";
import { SalesAuditReport } from "./reports/SalesAuditReport";
import { MostPurchasedProductsReport } from "./reports/MostPurchasedProductsReport";
import { PurchaseOrdersHistoryReport } from "./reports/PurchaseOrdersHistoryReport";
import { HourlyOccupancy } from "./reports/HourlyOccupancy";
import { SuppliesReport } from "./reports/SuppliesReport";
import { EquipmentReport } from "./reports/EquipmentReport";

type ReportCategory =
  | "dashboard"
  | "sales"
  | "accounting"
  | "inventory"
  | "purchases"
  | "clients"
  | "operations"
  | "audit";

type SpecificReport =
  | "sales-by-period"
  | "sales-by-product"
  | "sales-by-payment-method"
  | "sales-by-hour"
  | "sales-by-client"
  | "sales-comparison"
  | "cash-box"
  | "cash-flow"
  | "income-vs-expenses"
  | "stock"
  | "inventory-movements"
  | "inventory-valuation"
  | "products-without-movement"
  | "top-clients"
  | "frequent-clients"
  | "inactive-clients"
  | "active-clients"
  | "new-clients"
  | "purchases-by-period"
  | "purchases-by-supplier"
  | "sessions-by-period"
  | "best-selling-packages"
  | "average-session-duration"
  | "active-memberships"
  | "expiring-memberships"
  | "sessions-history"
  | "discounts-report"
  | "daily-cash-summary"
  | "user-activity"
  | "inventory-changes"
  | "system-access"
  | "inventory-adjustments"
  | "price-changes"
  | "sales-audit"
  | "most-purchased-products"
  | "purchase-orders-history"
  | "hourly-occupancy"
  | "supplies-report"
  | "equipment-report";

interface CategoryCard {
  id: ReportCategory;
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  bgColor: string;
}

export function Reports() {
  const [selectedCategory, setSelectedCategory] =
    useState<ReportCategory | null>(null);
  const [selectedReport, setSelectedReport] = useState<SpecificReport | null>(
    null,
  );

  const categories: CategoryCard[] = [
    {
      id: "dashboard",
      name: "Dashboard Ejecutivo",
      icon: <BarChart3 className="w-6 h-6" />,
      count: 1,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "sales",
      name: "Ventas",
      icon: <DollarSign className="w-6 h-6" />,
      count: 8,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "accounting",
      name: "Contable",
      icon: <FileText className="w-6 h-6" />,
      count: 5,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "inventory",
      name: "Inventario",
      icon: <Package className="w-6 h-6" />,
      count: 7,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: "purchases",
      name: "Compras",
      icon: <ShoppingCart className="w-6 h-6" />,
      count: 4,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      id: "clients",
      name: "Clientes",
      icon: <Users className="w-6 h-6" />,
      count: 7,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      id: "operations",
      name: "Operaciones",
      icon: <Clock className="w-6 h-6" />,
      count: 5,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      id: "audit",
      name: "Auditoría",
      icon: <Shield className="w-6 h-6" />,
      count: 5,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  // Renderizar reportes específicos
  if (selectedCategory === "dashboard") {
    return <ExecutiveDashboard onBack={() => setSelectedCategory(null)} />;
  }

  if (selectedReport === "sales-by-period") {
    return <SalesByPeriod onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "sales-by-product") {
    return <SalesByProductReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "cash-box") {
    return <CashBoxReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "cash-flow") {
    return <CashFlowReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "stock") {
    return <StockReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "inventory-movements") {
    return <InventoryMovementsReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "top-clients") {
    return <TopClientsReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "purchases-by-period") {
    return <PurchasesByPeriodReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "sessions-by-period") {
    return <SessionsByPeriodReport onBack={() => setSelectedReport(null)} />;
  }

  // Fase 3 Reports
  if (selectedReport === "sales-by-payment-method") {
    return <SalesByPaymentMethod onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "sales-by-hour") {
    return <SalesByHour onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "products-without-movement") {
    return <ProductsWithoutMovement onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "frequent-clients") {
    return <FrequentClients onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "inactive-clients") {
    return <InactiveClients onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "purchases-by-supplier") {
    return <PurchasesBySupplier onBack={() => setSelectedReport(null)} />;
  }

  // Fase 3 - Adicionales
  if (selectedReport === "sales-by-client") {
    return <SalesByClient onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "sales-comparison") {
    return <SalesComparison onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "income-vs-expenses") {
    return <IncomeVsExpenses onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "inventory-valuation") {
    return <InventoryValuation onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "active-clients") {
    return <ActiveClients onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "new-clients") {
    return <NewClients onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "best-selling-packages") {
    return <BestSellingPackages onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "average-session-duration") {
    return <AverageSessionDuration onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "active-memberships") {
    return <ActiveMemberships onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "expiring-memberships") {
    return <ExpiringMemberships onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "sessions-history") {
    return <SessionsHistory onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "discounts-report") {
    return <DiscountsReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "daily-cash-summary") {
    return <DailyCashSummary onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "user-activity") {
    return <UserActivityReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "inventory-changes") {
    return <InventoryChangesReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "system-access") {
    return <SystemAccessReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "inventory-adjustments") {
    return (
      <InventoryAdjustmentsReport onBack={() => setSelectedReport(null)} />
    );
  }

  if (selectedReport === "supplies-report") {
    return <SuppliesReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "equipment-report") {
    return <EquipmentReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "price-changes") {
    return <PriceChangesReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "sales-audit") {
    return <SalesAuditReport onBack={() => setSelectedReport(null)} />;
  }

  if (selectedReport === "most-purchased-products") {
    return (
      <MostPurchasedProductsReport onBack={() => setSelectedReport(null)} />
    );
  }

  if (selectedReport === "purchase-orders-history") {
    return (
      <PurchaseOrdersHistoryReport onBack={() => setSelectedReport(null)} />
    );
  }

  if (selectedReport === "hourly-occupancy") {
    return <HourlyOccupancy onBack={() => setSelectedReport(null)} />;
  }

  // Mostrar lista de reportes de una categoría
  if (selectedCategory === "sales") {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">📊 Reportes de Ventas</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sales-by-period")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Ventas por Período</h3>
            <p className="text-sm text-gray-600">
              Análisis de ventas por rango de fechas con filtros y gráficos
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sales-by-product")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Ventas por Producto</h3>
            <p className="text-sm text-gray-600">
              Productos más vendidos y análisis de rendimiento
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sales-by-payment-method")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Ventas por Método de Pago
            </h3>
            <p className="text-sm text-gray-600">
              Distribución de ventas por forma de pago
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sales-by-hour")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Ventas por Hora</h3>
            <p className="text-sm text-gray-600">
              Análisis de horas pico de ventas
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sales-by-client")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Ventas por Cliente</h3>
            <p className="text-sm text-gray-600">
              Análisis de compras por cliente
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sales-comparison")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Comparativo de Ventas
            </h3>
            <p className="text-sm text-gray-600">
              Comparar ventas entre períodos
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedCategory === "accounting") {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">💰 Reportes Contables</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("cash-box")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Reporte de Caja</h3>
            <p className="text-sm text-gray-600">
              Detalle de movimientos y cierre de caja
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("cash-flow")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Flujo de Efectivo</h3>
            <p className="text-sm text-gray-600">
              Entradas y salidas de dinero
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("income-vs-expenses")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Ingresos vs Gastos</h3>
            <p className="text-sm text-gray-600">
              Comparativo de ingresos y egresos
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("discounts-report")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Descuentos Aplicados</h3>
            <p className="text-sm text-gray-600">
              Análisis de descuentos otorgados
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("daily-cash-summary")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Resumen Diario de Caja
            </h3>
            <p className="text-sm text-gray-600">
              Corte de caja simplificado para imprimir
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedCategory === "inventory") {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">📦 Reportes de Inventario</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("stock")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Stock Actual</h3>
            <p className="text-sm text-gray-600">
              Inventario actual con alertas de stock bajo
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("inventory-movements")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Movimientos de Inventario
            </h3>
            <p className="text-sm text-gray-600">
              Historial de entradas y salidas
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("products-without-movement")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Productos Sin Movimiento
            </h3>
            <p className="text-sm text-gray-600">
              Productos que no se han vendido
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("inventory-valuation")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Valorización de Inventario
            </h3>
            <p className="text-sm text-gray-600">Valor total del inventario</p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("inventory-adjustments")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Ajustes de Inventario
            </h3>
            <p className="text-sm text-gray-600">
              Historial de ajustes manuales de stock
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("supplies-report")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Inventario de Insumos
            </h3>
            <p className="text-sm text-gray-600">
              Reporte de stock actual de insumos
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("equipment-report")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Mobiliario y Equipos
            </h3>
            <p className="text-sm text-gray-600">
              Reporte de estado de mobiliario y equipos
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedCategory === "purchases") {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">🛒 Reportes de Compras</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("purchases-by-period")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-pink-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-pink-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Compras por Período</h3>
            <p className="text-sm text-gray-600">
              Análisis de compras a proveedores
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("purchases-by-supplier")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-pink-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-pink-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Compras por Proveedor
            </h3>
            <p className="text-sm text-gray-600">Ranking de proveedores</p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("most-purchased-products")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Package className="w-6 h-6 text-pink-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Productos Más Comprados
            </h3>
            <p className="text-sm text-gray-600">
              Productos con mayor reposición
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("purchase-orders-history")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-pink-100 rounded-lg">
                <FileText className="w-6 h-6 text-pink-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Historial de Órdenes de Compra
            </h3>
            <p className="text-sm text-gray-600">
              Detalle de todas las órdenes
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedCategory === "operations") {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">⏱️ Reportes de Operaciones</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sessions-by-period")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Sesiones por Período</h3>
            <p className="text-sm text-gray-600">
              Análisis de sesiones de juego
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("best-selling-packages")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Paquetes Más Vendidos
            </h3>
            <p className="text-sm text-gray-600">
              Ranking de paquetes de tiempo
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("average-session-duration")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Duración Promedio</h3>
            <p className="text-sm text-gray-600">
              Tiempo promedio de permanencia
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sessions-history")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Historial de Sesiones
            </h3>
            <p className="text-sm text-gray-600">
              Registro completo de visitas
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("hourly-occupancy")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Ocupación por Hora</h3>
            <p className="text-sm text-gray-600">
              Análisis de horas pico y ocupación
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedCategory === "clients") {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">👥 Reportes de Clientes</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("top-clients")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Clientes Top</h3>
            <p className="text-sm text-gray-600">
              Ranking de mejores clientes por compras
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("frequent-clients")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Clientes Frecuentes</h3>
            <p className="text-sm text-gray-600">Clientes con más visitas</p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("inactive-clients")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Clientes Inactivos</h3>
            <p className="text-sm text-gray-600">
              Clientes sin actividad reciente
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("active-clients")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Clientes Activos</h3>
            <p className="text-sm text-gray-600">
              Clientes con actividad reciente
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("new-clients")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Nuevos Clientes</h3>
            <p className="text-sm text-gray-600">
              Clientes registrados recientemente
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("active-memberships")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Membresías Activas</h3>
            <p className="text-sm text-gray-600">
              Estado de membresías de clientes
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("expiring-memberships")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Membresías por Vencer
            </h3>
            <p className="text-sm text-gray-600">
              Alertas de vencimiento próximo
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedCategory === "audit") {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">🔐 Reportes de Auditoría</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("user-activity")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Actividad de Usuarios
            </h3>
            <p className="text-sm text-gray-600">
              Acciones realizadas por usuarios del sistema
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("inventory-changes")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Cambios en Inventario
            </h3>
            <p className="text-sm text-gray-600">
              Auditoría de modificaciones de stock
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("system-access")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Accesos al Sistema</h3>
            <p className="text-sm text-gray-600">
              Log de inicios de sesión y accesos
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("price-changes")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Modificaciones de Precios
            </h3>
            <p className="text-sm text-gray-600">
              Historial de cambios de precios
            </p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedReport("sales-audit")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded">
                Disponible
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Ventas Canceladas/Modificadas
            </h3>
            <p className="text-sm text-gray-600">
              Ventas con cambios o anulaciones
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">
            Reportes de{" "}
            {categories.find((c) => c.id === selectedCategory)?.name}
          </h1>
        </div>
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Reportes en desarrollo</p>
            <p className="text-sm mt-2">
              Esta sección estará disponible próximamente
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📊 Reportes y Análisis</h1>
        <p className="text-gray-600">
          Accede a reportes detallados y análisis de tu negocio
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => setSelectedCategory(category.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${category.bgColor}`}>
                <div className={category.color}>{category.icon}</div>
              </div>
              {category.id === "dashboard" && (
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded">
                  Nuevo
                </span>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
            <p className="text-sm text-gray-500">
              {category.count} reporte{category.count !== 1 ? "s" : ""}
            </p>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-bold mb-4">📌 Acceso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedCategory("dashboard")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Dashboard Ejecutivo</p>
                <p className="text-xs text-gray-500">
                  Vista general del negocio
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedReport("sales-by-period")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Ventas por Período</p>
                <p className="text-xs text-gray-500">Análisis de ventas</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedReport("stock")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold">Stock Actual</p>
                <p className="text-xs text-gray-500">Inventario y alertas</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedReport("top-clients")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50 rounded-lg">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="font-semibold">Clientes Top</p>
                <p className="text-xs text-gray-500">Mejores clientes</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
