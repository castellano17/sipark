import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  FileDown,
  Printer,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SalesByPeriodProps {
  onBack: () => void;
}

// Helper: badge de tipo de venta
function SaleTypeBadge({ type }: { type: string }) {
  if (type === 'membership') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
        🪪 Membresía
      </span>
    );
  }
  if (type === 'package') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
        📦 Paquete
      </span>
    );
  }
  if (type === 'promo') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
        🎟️ Promo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
      🛒 Producto
    </span>
  );
}

const getTypeName = (type: string) => {
  if (type === 'promo') return 'Promo';
  if (type === 'membership') return 'Membresía';
  if (type === 'package') return 'Paquete';
  return 'Producto';
};

export function SalesByPeriod({ onBack }: SalesByPeriodProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { formatCurrency } = useCurrency();
  const { error, success } = useNotification();
  const { exportToExcel, exportToPDF, printReport } = useReportExport();

  // Filtros
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [saleType, setSaleType] = useState("all");

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async (overrides?: { start?: string; end?: string; payment?: string; type?: string }) => {
    try {
      setLoading(true);
      const typeFilter = overrides?.type ?? saleType;

      // Fetch all data for the period to handle filtering and summary locally
      const result = await window.api.getSalesByPeriod(
        overrides?.start ?? startDate,
        overrides?.end ?? endDate,
        overrides?.payment ?? paymentMethod,
        "all"
      );

      // Apply the 'Tipo de Venta' filter in the frontend
      let filteredSales = result.sales;
      if (typeFilter && typeFilter !== "all") {
        filteredSales = result.sales.filter((s: any) => s.sale_type === typeFilter);
      }

      // Recalculate summary totals based on filtered results
      const total_sales = filteredSales.length;
      const total_revenue = filteredSales.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
      const total_discount = filteredSales.reduce((sum: number, s: any) => sum + (Number(s.discount) || 0), 0);
      const average_ticket = total_sales > 0 ? total_revenue / total_sales : 0;

      setData({
        ...result,
        sales: filteredSales,
        summary: {
          total_sales,
          total_revenue,
          total_discount,
          average_ticket
        }
      });
    } catch (err) {
      error("Error cargando reporte");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  };

  // Format date as DD/MM/YYYY for reports
  const formatDateDMY = (isoDate: string) => {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleExportExcel = () => {
    if (!data) return;

    exportToExcel({
      title: "Reporte de Ventas por Período",
      subtitle: `Del ${formatDateDMY(startDate)} al ${formatDateDMY(endDate)}`,
      filename: `ventas-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id", width: 10 },
        { header: "Fecha", key: "timestamp", format: "datetime", width: 20 },
        { header: "Cliente", key: "client_name", width: 25 },
        { header: "Productos", key: "products", width: 40 },
        { header: "Categoría", key: "sale_type", width: 15 },
        { header: "Método", key: "payment_method", width: 15 },
        { header: "Subtotal", key: "subtotal", format: "currency", width: 15 },
        { header: "Descuento", key: "discount", format: "currency", width: 15 },
        { header: "Total", key: "total", format: "currency", width: 15 },
      ],
      data: data.sales.map((s: any) => ({
        ...s,
        sale_type: getTypeName(s.sale_type),
        payment_method: s.payment_method === 'cash' ? 'Efectivo' : s.payment_method === 'card' ? 'Tarjeta' : s.payment_method === 'transfer' ? 'Transferencia' : s.payment_method
      })),
      summary: [
        { label: "Total Ventas", value: data.summary.total_revenue },
        { label: "Total Transacciones", value: data.summary.total_sales },
        { label: "Total Descuentos", value: data.summary.total_discount },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!data) return;

    exportToPDF({
      title: "Reporte de Ventas por Período",
      subtitle: `Del ${formatDateDMY(startDate)} al ${formatDateDMY(endDate)}`,
      filename: `ventas-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id", width: 5 },
        { header: "Fecha", key: "timestamp", format: "datetime", width: 16 },
        { header: "Cliente", key: "client_name", width: 18 },
        { header: "Productos", key: "products", width: 28 },
        { header: "Categoría", key: "sale_type", width: 14 },
        { header: "Método", key: "payment_method", width: 12 },
        { header: "Total", key: "total", format: "currency", width: 12 },
      ],
      data: data.sales.map((s: any) => ({
        ...s,
        products: s.products || '—',
        sale_type: getTypeName(s.sale_type),
        payment_method: s.payment_method === 'cash' ? 'Efectivo' : s.payment_method === 'card' ? 'Tarjeta' : s.payment_method === 'transfer' ? 'Transferencia' : s.payment_method
      })),
      summary: [
        { label: "Total Ventas", value: data.summary.total_revenue },
        { label: "Total Transacciones", value: data.summary.total_sales },
        { label: "Total Descuentos", value: data.summary.total_discount },
      ],
    });
  };

  const handlePrint = () => {
    if (!data) return;

    printReport({
      title: "Reporte de Ventas por Período",
      subtitle: `Del ${formatDateDMY(startDate)} al ${formatDateDMY(endDate)}`,
      filename: `ventas-${startDate}-${endDate}`,
      columns: [
        { header: "ID", key: "id", width: 6 },
        { header: "Fecha", key: "timestamp", format: "datetime", width: 18 },
        { header: "Cliente", key: "client_name", width: 20 },
        { header: "Productos", key: "products", width: 35 },
        { header: "Categoría", key: "sale_type", width: 14 },
        { header: "Método", key: "payment_method", width: 12 },
        { header: "Total", key: "total", format: "currency", width: 15 },
      ],
      data: data.sales.map((s: any) => ({
        ...s,
        products: s.products || '—',
        sale_type: getTypeName(s.sale_type),
        payment_method: s.payment_method === 'cash' ? 'Efectivo' : s.payment_method === 'card' ? 'Tarjeta' : s.payment_method === 'transfer' ? 'Transferencia' : s.payment_method
      })),
      summary: [
        { label: "Total Ventas", value: data.summary.total_revenue },
        { label: "Total Transacciones", value: data.summary.total_sales },
        { label: "Total Descuentos", value: data.summary.total_discount },
      ],
    });
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📊 Ventas por Período</h1>
            <p className="text-sm text-gray-600">
              Análisis detallado de ventas por rango de fechas
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Método de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Tipo de Venta
            </label>
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Todos los tipos</option>
              <option value="product">🛒 Producto</option>
              <option value="package">📦 Paquete</option>
              <option value="membership">🪪 Membresía</option>
              <option value="promo">🎟️ Promo</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={() => loadReport({ start: startDate, end: endDate, payment: paymentMethod, type: saleType })}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                setStartDate(today);
                setEndDate(today);
                setPaymentMethod("all");
                setSaleType("all");
                loadReport({ start: today, end: today, payment: "all", type: "all" });
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-green-700">
                  Total Ventas
                </p>
              </div>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(data.summary.total_revenue)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-blue-700">
                  Transacciones
                </p>
              </div>
              <p className="text-lg font-bold text-blue-900 break-words">
                {data.summary.total_sales}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-purple-700">
                  Ticket Promedio
                </p>
              </div>
              <p className="text-lg font-bold text-purple-900 break-words">
                {formatCurrency(data.summary.average_ticket)}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-orange-700">
                  Descuentos
                </p>
              </div>
              <p className="text-lg font-bold text-orange-900 break-words">
                {formatCurrency(data.summary.total_discount)}
              </p>
            </Card>
          </div>

          {/* Tabla de Ventas */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle de Ventas</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Exportar Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Productos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Método
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Descuento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.sales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">#{sale.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(sale.timestamp).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm">{sale.client_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {sale.products || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <SaleTypeBadge type={sale.sale_type || 'product'} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {sale.payment_method === 'cash' ? 'Efectivo'
                          : sale.payment_method === 'card' ? 'Tarjeta'
                          : sale.payment_method === 'transfer' ? 'Transferencia'
                          : sale.payment_method}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(sale.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {sale.discount > 0
                          ? `-${formatCurrency(sale.discount)}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
