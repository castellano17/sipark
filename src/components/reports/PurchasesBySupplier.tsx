import { useState, useEffect } from "react";
import { ShoppingCart, FileDown } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotification } from "../../hooks/useNotification";
import { useReportExport } from "../../hooks/useReportExport";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PurchasesBySupplierProps {
  onBack: () => void;
}

export function PurchasesBySupplier({ onBack }: PurchasesBySupplierProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { formatCurrency } = useCurrency();
  const { error } = useNotification();
  const { exportToExcel } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await (window.api as any).getPurchasesBySupplier(
        startDate,
        endDate,
      );
      setData(result);
    } catch (err) {
      error("Error cargando reporte");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🏪 Compras por Proveedor</h1>
            <p className="text-sm text-gray-600">Ranking de proveedores</p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={loadReport} disabled={loading} className="flex-1">
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Total Proveedores
              </p>
              <p className="text-lg font-bold text-blue-900">
                {data.summary.totalSuppliers}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Total Comprado
              </p>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(data.summary.totalPurchased)}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Total Órdenes
              </p>
              <p className="text-lg font-bold text-purple-900">
                {data.summary.totalOrders}
              </p>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              Compras por Proveedor
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.suppliers.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  style={{ fontSize: "11px" }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis style={{ fontSize: "12px" }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar
                  dataKey="total_purchased"
                  name="Total Comprado"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Detalle por Proveedor</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Compras por Proveedor",
                    subtitle: `Del ${startDate} al ${endDate}`,
                    filename: `compras-proveedor-${startDate}-${endDate}`,
                    columns: [
                      { header: "Proveedor", key: "name", width: 30 },
                      { header: "Contacto", key: "contact_name", width: 25 },
                      { header: "Teléfono", key: "phone", width: 15 },
                      { header: "Órdenes", key: "order_count", width: 10 },
                      {
                        header: "Total Comprado",
                        key: "total_purchased",
                        format: "currency",
                        width: 15,
                      },
                      {
                        header: "Orden Promedio",
                        key: "average_order",
                        format: "currency",
                        width: 15,
                      },
                    ],
                    data: data.suppliers,
                  });
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Órdenes
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Total Comprado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">
                      Orden Prom.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.suppliers.map((supplier: any) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {supplier.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{supplier.contact_name || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {supplier.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {supplier.order_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(supplier.total_purchased || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(supplier.average_order || 0)}
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
