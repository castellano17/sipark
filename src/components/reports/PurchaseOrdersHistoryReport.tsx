import { useState, useEffect } from "react";
import {
  ShoppingCart,
  FileDown,
  Calendar,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";

interface PurchaseOrdersHistoryReportProps {
  onBack: () => void;
}

export function PurchaseOrdersHistoryReport({
  onBack,
}: PurchaseOrdersHistoryReportProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [supplierFilter, setSupplierFilter] = useState("");

  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel, exportToPDF } = useReportExport();

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.getPurchaseOrdersHistory(
        startDate,
        endDate,
        supplierFilter || null,
      );
      setData(result);
    } catch (err) {
      error("Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    if (!data || !data.orders || data.orders.length === 0) {
      error("No hay datos para exportar");
      return;
    }

    const exportOptions = {
      title: "Historial de Órdenes de Compra",
      subtitle: `Período: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      filename: "historial-ordenes-compra",
      columns: [
        { header: "Orden #", key: "id", width: 10 },
        { header: "Proveedor", key: "supplier_name", width: 30 },
        {
          header: "Fecha",
          key: "invoice_date",
          width: 15,
          format: "date" as const,
        },
        {
          header: "Items",
          key: "item_count",
          width: 10,
          format: "number" as const,
        },
        {
          header: "Total",
          key: "total_amount",
          width: 15,
          format: "currency" as const,
        },
      ],
      data: data.orders.map((order: any) => ({
        id: order.id,
        supplier_name: order.supplier_name,
        invoice_date: order.invoice_date,
        item_count: order.item_count,
        total_amount: order.total_amount,
      })),
      summary: [
        { label: "Total Órdenes", value: data.totals.total_orders },
        { label: "Total Items", value: data.totals.total_items },
        { label: "Monto Total", value: data.totals.total_amount },
      ],
    };

    if (format === "excel") {
      exportToExcel(exportOptions);
    } else {
      exportToPDF(exportOptions);
    }
  };

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-8 h-8 text-pink-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              📋 Historial de Órdenes de Compra
            </h2>
            <p className="text-sm text-gray-600">
              Registro completo de órdenes a proveedores
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Fin
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor
            </label>
            <Input
              type="text"
              placeholder="Filtrar por proveedor..."
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={loadReport}
              className="bg-pink-600 hover:bg-pink-700 w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {data && data.totals && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Órdenes</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.totals.total_orders || 0}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Items</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {data.totals.total_items || 0}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-600 mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monto Total</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {formatCurrency(data.totals.total_amount || 0)}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-purple-600 mt-2" />
              </div>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                {data.orders?.length || 0} Órdenes
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport("excel")}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  onClick={() => handleExport("pdf")}
                  className="bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {data.orders && data.orders.length > 0 ? (
                data.orders.map((order: any) => (
                  <div key={order.id} className="border rounded-lg">
                    <div
                      className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      <div className="flex-1 grid grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Orden #</p>
                          <p className="font-medium text-gray-900">
                            {order.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Proveedor</p>
                          <p className="font-medium text-gray-900">
                            {order.supplier_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(order.invoice_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Items</p>
                          <p className="text-sm text-gray-900">
                            {order.item_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                      </div>
                      <div>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedOrder === order.id && order.items && (
                      <div className="border-t bg-gray-50 p-4">
                        <h4 className="font-semibold text-sm mb-3 text-gray-700">
                          Detalle de Items
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Producto
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                  Cantidad
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                  Precio Unit.
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                                  Subtotal
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {order.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 text-gray-900">
                                    {item.product_name}
                                  </td>
                                  <td className="px-3 py-2 text-right text-gray-900">
                                    {item.quantity}
                                  </td>
                                  <td className="px-3 py-2 text-right text-gray-900">
                                    {formatCurrency(item.unit_cost)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium text-gray-900">
                                    {formatCurrency(item.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No se encontraron órdenes de compra</p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
