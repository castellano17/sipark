import { useEffect, useState } from "react";
import { X, Truck, Calendar, FileText, Package } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useCurrency } from "../hooks/useCurrency";
import { useNotification } from "../hooks/useNotification";

interface PurchaseItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

interface PurchaseDetail {
  id: number;
  supplier_id: number;
  supplier_name: string;
  supplier_phone?: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  total_items: number;
  notes?: string;
  created_at: string;
  items: PurchaseItem[];
}

interface PurchaseDetailModalProps {
  purchaseId: number | null;
  onClose: () => void;
}

export function PurchaseDetailModal({
  purchaseId,
  onClose,
}: PurchaseDetailModalProps) {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useCurrency();
  const { error } = useNotification();

  useEffect(() => {
    if (purchaseId) {
      loadPurchaseDetail();
    }
  }, [purchaseId]);

  const loadPurchaseDetail = async () => {
    if (!purchaseId) return;

    try {
      setLoading(true);
      const data = await window.api.getPurchaseOrderWithItems(purchaseId);
      setPurchase(data);
    } catch (err) {
      error("Error cargando detalle de compra");
      console.error("Error loading purchase detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!purchaseId) return null;

  return (
    <Dialog open={!!purchaseId} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col bg-white border-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Detalle de Compra
                </h2>
                <p className="text-sm text-purple-100">Orden #{purchaseId}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando...</p>
                </div>
              </div>
            ) : purchase ? (
              <div className="space-y-6">
                {/* Info de la compra */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Truck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Proveedor</p>
                        <p className="font-semibold">
                          {purchase.supplier_name}
                        </p>
                        {purchase.supplier_phone && (
                          <p className="text-xs text-gray-500">
                            {purchase.supplier_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">No. Factura</p>
                        <p className="font-semibold">
                          {purchase.invoice_number}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fecha Factura</p>
                        <p className="font-semibold">
                          {formatDate(purchase.invoice_date)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Package className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Items</p>
                        <p className="font-semibold">{purchase.total_items}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Items de la compra */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    Productos Comprados
                  </h3>
                  <Card>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                            Costo Unit.
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {purchase.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {formatCurrency(item.unit_cost)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>

                {/* Total */}
                <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      Total de la Compra:
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      {formatCurrency(purchase.total_amount)}
                    </span>
                  </div>
                </Card>

                {/* Notas */}
                {purchase.notes && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Notas:
                    </p>
                    <p className="text-sm text-blue-800">{purchase.notes}</p>
                  </Card>
                )}

                {/* Info de registro */}
                <div className="text-xs text-gray-500 text-center pt-4 border-t">
                  Registrado el {formatDateTime(purchase.created_at)}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontró la compra</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </Card>
      </div>
    </Dialog>
  );
}
