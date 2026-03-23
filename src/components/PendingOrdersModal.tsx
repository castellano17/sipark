import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, Utensils, Clock, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useCurrency } from "../hooks/useCurrency";
import { useNotification } from "../hooks/useNotification";
import Swal from "sweetalert2";

interface PendingOrder {
  id: number;
  table_or_client_name: string;
  subtotal: number;
  total: number;
  status: string;
  created_at: string;
  items: any[];
}

interface PendingOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: PendingOrder) => void;
}

export const PendingOrdersModal: React.FC<PendingOrdersModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const { formatCurrency } = useCurrency();
  const { success, error } = useNotification();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await (window as any).api.getPendingWaiterOrders();
      setOrders(data || []);
    } catch (err) {
      error("Error al cargar ordenes pendientes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: "¿Eliminar pedido?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#f43f5e",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      background: "#ffffff",
    });

    if (result.isConfirmed) {
      try {
        await (window as any).api.deleteWaiterOrder(orderId);
        success("Pedido eliminado");
        loadOrders();
      } catch (err) {
        error("Error al eliminar pedido");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] relative z-10 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="text-blue-600" />
            Pedidos de Mesas / Pendientes
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Cargando pedidos...</div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Utensils className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-semibold text-slate-500">No hay pedidos pendientes</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group relative"
                  onClick={() => onSelectOrder(order)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 text-red-500 w-8 h-8 rounded-full"
                    onClick={(e) => handleDelete(order.id, e)}
                    title="Eliminar pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <div>
                    <div className="flex justify-between items-start mb-2 pr-8">
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{order.table_or_client_name}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">
                        #{order.id}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 mb-4">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {format(new Date(order.created_at), "hh:mm a", { locale: es })}
                    </div>
                    <div className="space-y-1 mb-4">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-600 line-clamp-1"><span className="font-medium mr-1">{item.quantity}x</span>{item.product_name}</span>
                          <span className="text-slate-400">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-xs text-slate-400 italic">... y {order.items.length - 3} más</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between items-center mt-auto">
                    <span className="text-slate-500 font-medium text-sm">Total</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
