import { useEffect, useState, useRef } from "react";
import JsBarcode from "jsbarcode";
import { X, Printer, User, Calendar, CreditCard, Package, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useCurrency } from "../hooks/useCurrency";
import { useNotification } from "../hooks/useNotification";
import { usePrinter } from "../hooks/usePrinter";

interface SaleItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface SaleDetail {
  id: number;
  client_id?: number;
  client_name?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  timestamp: string;
  items: SaleItem[];
  sale_type?: string;
}

function SaleTypeBadge({ type }: { type?: string }) {
  if (type === 'promo') return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">🎟️ Promo</span>;
  if (type === 'membership') return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">🪪 Membresía</span>;
  if (type === 'package') return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">📦 Paquete</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">🛒 Producto</span>;
}

interface SaleDetailModalProps {
  saleId: number | null;
  onClose: () => void;
}

export function SaleDetailModal({ saleId, onClose }: SaleDetailModalProps) {
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useCurrency();
  const { error, info } = useNotification();
  const { printTicket } = usePrinter();
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (sale && barcodeRef.current) {
      JsBarcode(barcodeRef.current, sale.id.toString(), {
        format: "CODE128",
        displayValue: true,
        height: 50,
        margin: 10,
        background: "transparent",
      });
    }
  }, [sale]);

  useEffect(() => {
    if (saleId) {
      loadSaleDetail();
    }
  }, [saleId]);

  const loadSaleDetail = async () => {
    if (!saleId) return;

    try {
      setLoading(true);
      const data = await window.api.getSaleWithItems(saleId);
      setSale(data);
    } catch (err) {
      error("Error cargando detalle de venta");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!sale) return;
    info(`Imprimiendo ticket #${saleId}`);
    
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await printTicket({
        saleId: sale.id,
        clientName: sale.client_name,
        cashierName: currentUser.name || currentUser.username || "Admin",
        items: sale.items.map((i) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
        })),
        subtotal: sale.subtotal,
        discount: sale.discount || 0,
        total: sale.total,
        paymentMethod: sale.payment_method,
      });
    } catch (err) {
      error("Error al reimprimir el ticket");
    }
  };

  const handleCancelSale = async () => {
    if (!sale) return;

    const result = await Swal.fire({
      title: "¿Anular esta venta?",
      text: "El monto se restará de la caja y los productos volverán al inventario. Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, anular venta",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        await window.api.cancelSale(sale.id, currentUser.id, "Anulación manual por error");
        
        await Swal.fire({
          title: "¡Anulada!",
          text: "La venta ha sido anulada y el stock actualizado.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });

        window.dispatchEvent(new CustomEvent('sale-cancelled'));
        onClose();
      } catch (err: any) {
        error(err.message || "Error al anular la venta");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!saleId) return null;

  return (
    <Dialog open={!!saleId} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col bg-white border-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detalle de Venta</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-blue-100">Ticket #{saleId}</p>
                  {sale?.status === 'cancelled' && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">ANULADA</span>
                  )}
                  {sale && <SaleTypeBadge type={sale.sale_type} />}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20"><X className="w-5 h-5" /></Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando...</p>
                </div>
              </div>
            ) : sale ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg"><User className="w-5 h-5 text-blue-600" /></div>
                      <div><p className="text-xs text-gray-500">Cliente</p><p className="font-semibold">{sale.client_name || "Venta Rápida"}</p></div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg"><Calendar className="w-5 h-5 text-green-600" /></div>
                      <div><p className="text-xs text-gray-500">Fecha y Hora</p><p className="font-semibold text-sm">{formatDate(sale.timestamp)}</p></div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg"><CreditCard className="w-5 h-5 text-purple-600" /></div>
                      <div><p className="text-xs text-gray-500">Método de Pago</p><p className="font-semibold">{sale.payment_method === "cash" ? "Efectivo" : sale.payment_method === "card" ? "Tarjeta" : sale.payment_method === "transfer" ? "Transferencia" : sale.payment_method}</p></div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg"><Package className="w-5 h-5 text-orange-600" /></div>
                      <div><p className="text-xs text-gray-500">Items</p><p className="font-semibold">{sale.items.length}</p></div>
                    </div>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Package className="w-5 h-5 text-gray-600" />Productos/Servicios</h3>
                  <Card>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Cant.</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Precio Unit.</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sale.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{item.product_name}</td>
                            <td className="px-4 py-3 text-center text-sm font-semibold">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>

                <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm"><span className="text-gray-600">Subtotal:</span><span className="font-semibold">{formatCurrency(sale.subtotal)}</span></div>
                    {sale.discount > 0 && (
                      <div className="flex justify-between items-center text-sm"><span className="text-gray-600">Descuento:</span><span className="font-semibold text-red-600">-{formatCurrency(sale.discount)}</span></div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center"><span className="text-lg font-bold text-gray-900">Total:</span><span className="text-2xl font-bold text-green-600">{formatCurrency(sale.total)}</span></div>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-center mt-6"><svg ref={barcodeRef}></svg></div>
              </div>
            ) : (
              <div className="text-center py-12"><p className="text-gray-500">No se encontró la venta</p></div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
             <Button variant="outline" onClick={onClose}>Cerrar</Button>
             {sale?.status !== 'cancelled' && (
               <Button variant="destructive" onClick={handleCancelSale} className="gap-2" disabled={loading}><Trash2 className="w-4 h-4" />Anular Venta</Button>
             )}
             <Button onClick={handlePrint} className="gap-2" disabled={sale?.status === 'cancelled'}><Printer className="w-4 h-4" />Reimprimir</Button>
          </div>
        </Card>
      </div>
    </Dialog>
  );
}
