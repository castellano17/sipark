import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  AlertTriangle,
  Wallet,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ExecutiveDashboardProps {
  onBack: () => void;
}

interface DashboardData {
  daily: {
    sales: number;
    count: number;
    average: number;
  };
  monthly: {
    sales: number;
    count: number;
    lastMonth: number;
    growth: number;
  };
  clients: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  lowStock: Array<{
    id: number;
    name: string;
    stock: number;
    price: number;
  }>;
  cashBox: {
    id: number;
    opening_amount: number;
    current_balance: number;
    opened_at: string;
    opened_by: string;
  } | null;
  topProducts: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  last30DaysSales: Array<{
    date: string;
    count: number;
    total: number;
  }>;
  activeSessions: number;
}

export function ExecutiveDashboard({ onBack }: ExecutiveDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrency } = useCurrency();
  const { error, success } = useNotification();

  useEffect(() => {
    loadDashboard();
    // Recargar cada 30 segundos
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async (showNotification = false) => {
    try {
      if (showNotification) {
        setRefreshing(true);
      }
      const dashboardData = await (window.api as any).getExecutiveDashboard();
      setData(dashboardData);
      if (showNotification) {
        success("Dashboard actualizado");
      }
    } catch (err) {
      error("Error cargando dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No se pudo cargar el dashboard</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📈 Dashboard Ejecutivo</h1>
            <p className="text-sm text-gray-600">
              Vista general del rendimiento del negocio
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Actualizando...
            </>
          ) : (
            <>🔄 Actualizar</>
          )}
        </Button>
      </div>

      {/* KPIs Row 1 - Ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Ventas del Día */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-blue-700 font-medium mb-1">
            Ventas del Día
          </p>
          <p className="text-3xl font-bold text-blue-900 mb-2">
            {formatCurrency(data.daily.sales)}
          </p>
          <p className="text-xs text-blue-600">
            {data.daily.count} transacciones • Ticket prom:{" "}
            {formatCurrency(data.daily.average)}
          </p>
        </Card>

        {/* Ventas del Mes */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            {data.monthly.growth !== 0 && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  data.monthly.growth > 0
                    ? "bg-green-200 text-green-700"
                    : "bg-red-200 text-red-700"
                }`}
              >
                {data.monthly.growth > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-xs font-semibold">
                  {Math.abs(data.monthly.growth).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-green-700 font-medium mb-1">
            Ventas del Mes
          </p>
          <p className="text-3xl font-bold text-green-900 mb-2">
            {formatCurrency(data.monthly.sales)}
          </p>
          <p className="text-xs text-green-600">
            {data.monthly.count} transacciones • Mes anterior:{" "}
            {formatCurrency(data.monthly.lastMonth)}
          </p>
        </Card>

        {/* Clientes Atendidos */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-purple-700 font-medium mb-1">
            Clientes Atendidos
          </p>
          <p className="text-3xl font-bold text-purple-900 mb-2">
            {data.clients.today}
          </p>
          <p className="text-xs text-purple-600">
            Esta semana: {data.clients.thisWeek} • Este mes:{" "}
            {data.clients.thisMonth}
          </p>
        </Card>

        {/* Sesiones Activas */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            {data.activeSessions > 0 && (
              <span className="px-2 py-1 bg-orange-200 text-orange-700 text-xs font-semibold rounded">
                Activo
              </span>
            )}
          </div>
          <p className="text-sm text-orange-700 font-medium mb-1">
            Sesiones Activas
          </p>
          <p className="text-3xl font-bold text-orange-900 mb-2">
            {data.activeSessions}
          </p>
          <p className="text-xs text-orange-600">
            {data.activeSessions > 0
              ? "Clientes jugando ahora"
              : "Sin sesiones activas"}
          </p>
        </Card>
      </div>

      {/* Row 2 - Caja y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Estado de Caja */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Wallet className="w-5 h-5 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-lg">Estado de Caja</h3>
          </div>
          {data.cashBox ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monto Inicial:</span>
                <span className="font-semibold">
                  {formatCurrency(data.cashBox.opening_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Saldo Actual:</span>
                <span className="font-bold text-xl text-green-600">
                  {formatCurrency(data.cashBox.current_balance)}
                </span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500">
                  Abierta por: {data.cashBox.opened_by}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(data.cashBox.opened_at).toLocaleString("es-ES")}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Caja cerrada</p>
            </div>
          )}
        </Card>

        {/* Productos con Stock Bajo */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-lg">Stock Bajo</h3>
          </div>
          {data.lowStock.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-auto">
              {data.lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-2 bg-red-50 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-red-200 text-red-700 text-xs font-semibold rounded">
                    {product.stock} unid.
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Stock en niveles normales</p>
            </div>
          )}
        </Card>
      </div>

      {/* Row 3 - Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Gráfico de Ventas - Últimos 30 Días */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            Ventas - Últimos 30 Días
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.last30DaysSales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                style={{ fontSize: "12px" }}
              />
              <YAxis style={{ fontSize: "12px" }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => formatDate(label)}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top 5 Productos */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            Top 5 Productos del Mes
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" style={{ fontSize: "12px" }} />
              <YAxis
                dataKey="product_name"
                type="category"
                width={120}
                style={{ fontSize: "11px" }}
              />
              <Tooltip formatter={(value: number) => Number(value).toLocaleString()} />
              <Bar
                dataKey="quantity_sold"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 4 - Tabla de Top Productos */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-lg">Detalle de Top Productos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Producto
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Ingresos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {product.product_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">
                    {product.quantity_sold}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
