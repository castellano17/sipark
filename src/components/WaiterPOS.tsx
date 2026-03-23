import { useState, useEffect } from "react";
import { Search, Utensils, Minus, Plus, ShoppingCart, Trash2, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { useDatabase } from "../hooks/useDatabase";
import { useNotification } from "../hooks/useNotification";
import { useCurrency } from "../hooks/useCurrency";
import type { ProductService } from "../types";

interface WaiterSaleItem {
  id: string;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export function WaiterPOS() {
  const { getProductsServices } = useDatabase();
  const { warning, success, error } = useNotification();
  const { formatCurrency } = useCurrency();

  const [products, setProducts] = useState<ProductService[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductService[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [cartItems, setCartItems] = useState<WaiterSaleItem[]>([]);
  const [tableName, setTableName] = useState("");
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadActiveOrders();
  }, []);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory || p.type === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
      );
    }
    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery, products]);

  const loadProducts = async () => {
    const rows = await getProductsServices();
    const validTypes = ["food", "drink", "snack", "rental", "event"];
    // Filtramos tipos válidos Y que tengan stock disponible (o sean de tipo renta/evento que no siempre usan stock numérico)
    const validProducts = rows.filter(p => {
      const hasStock = (p.stock !== undefined && p.stock !== null) ? p.stock > 0 : true;
      const isRentalOrEvent = p.type === "rental" || p.type === "event";
      return validTypes.includes(p.type) && (isRentalOrEvent || hasStock);
    });
    setProducts(validProducts);
    setFilteredProducts(validProducts);
  };

  const loadCategories = async () => {
    try {
      const data = await (window as any).api.getCategories();
      const validTypes = ["food", "drink", "snack", "rental", "event"];
      const filtered = data.filter((cat: any) => validTypes.includes(cat.type));
      setDbCategories(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const loadActiveOrders = async () => {
    try {
      const data = await (window as any).api.getPendingWaiterOrders();
      setActiveOrders(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addItemToCart = (product: ProductService) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.price,
          subtotal: product.price
        }
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSendOrder = async () => {
    if (!tableName.trim()) {
      warning("Debe ingresar el nombre del cliente o número de mesa.");
      return;
    }
    if (cartItems.length === 0) {
      warning("El pedido está vacío.");
      return;
    }

    setIsSending(true);
    try {
      const orderData = {
        table_or_client_name: tableName.trim(),
        subtotal: cartTotal,
        total: cartTotal,
        items: cartItems
      };

      const orderId = await (window as any).api.createWaiterOrder(orderData);
      
      success("Pedido enviado correctamente.", 2500);
      setCartItems([]);
      setTableName("");
      setIsMobileCartOpen(false);
      loadActiveOrders();

      // Imprimir Comanda
      try {
        const ticketPrinter = await (window as any).api.getSetting("ticket_printer");
        if (ticketPrinter) {
          const comandaHtml = `
            <div style="font-family: monospace; width: 100%; font-size: 14px; text-align: center;">
              <h2>COMANDA</h2>
              <h1 style="font-size: 24px; margin: 5px 0;">MESA: ${tableName.trim()}</h1>
              <p>Fecha: ${new Date().toLocaleString()}</p>
              <p>Orden #: ${orderId}</p>
              <hr style="border-top: 1px dashed black;" />
              <table style="width: 100%; text-align: left; font-size: 16px; margin-top: 10px;">
                ${cartItems.map(item => `
                  <tr>
                    <td style="font-weight: bold; padding: 5px 0;">${item.quantity}x</td>
                    <td style="padding: 5px 0;">${item.product_name}</td>
                  </tr>
                `).join('')}
              </table>
              <hr style="border-top: 1px dashed black; margin-top: 10px;" />
            </div>
          `;
          await (window as any).api.printHtmlSilent(comandaHtml);
        }
      } catch (printErr) {
        console.warn("Fallo al imprimir la comanda", printErr);
      }
    } catch (err) {
      error("Error al enviar el pedido");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden pb-10">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-4">
          <Utensils className="text-blue-600 w-6 h-6" />
          <h1 className="text-xl font-bold text-slate-800">Toma de Pedidos</h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Buscar producto..."
            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            className="rounded-full flex-shrink-0"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>
          {dbCategories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.name ? "default" : "outline"}
              size="sm"
              className="rounded-full flex-shrink-0"
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group rounded-xl">
              <div className="p-4">
                <div className="font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors uppercase text-sm">
                  {product.name}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xl font-bold text-blue-600">{formatCurrency(product.price)}</div>
                  <Button 
                    size="icon" 
                    variant="secondary"
                    className="rounded-full h-10 w-10 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-0 shadow-none transition-all"
                    onClick={() => addItemToCart(product)}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Botón Flotante Carrito Mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-40 transition-transform hover:scale-110 active:scale-95">
        <Button 
          size="lg" 
          className="rounded-full shadow-[0_10px_30px_rgba(37,99,235,0.4)] w-16 h-16 bg-blue-600 hover:bg-blue-700 relative flex items-center justify-center p-0"
          onClick={() => setIsMobileCartOpen(true)}
        >
          <ShoppingCart className="w-8 h-8 text-white" />
          {cartItems.length > 0 && cartItems.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Overlay/Drawer del Carrito Mobile */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMobileCartOpen ? "visible" : "invisible"}`}>
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMobileCartOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMobileCartOpen(false)}
        />
        <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 flex flex-col max-h-[85vh] ${isMobileCartOpen ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-blue-600 w-5 h-5" />
              <h2 className="text-lg font-bold text-slate-800">Pedido Actual</h2>
            </div>
            <Button variant="ghost" onClick={() => setIsMobileCartOpen(false)} className="text-slate-500">Cerrar</Button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Identificador (Mesa / Cliente)
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Ej: Mesa 5, Juan Perez..."
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-200 transition-all rounded-xl"
                />
              </div>
              
              {activeOrders.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setTableName(order.table_or_client_name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        tableName === order.table_or_client_name 
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-400"
                      }`}
                    >
                      {order.table_or_client_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[40vh] space-y-3 bg-slate-50 rounded-xl p-2">
              {cartItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>El pedido está vacío</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                    <div className="font-semibold text-slate-800 text-sm mb-2 uppercase">{item.product_name}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-blue-600 font-bold">{formatCurrency(item.subtotal)}</div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-full border border-slate-200 p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-slate-200"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                        </Button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-slate-200"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Total Estimado</span>
              <span className="text-2xl font-bold text-slate-800">{formatCurrency(cartTotal)}</span>
            </div>
            <Button 
              className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl"
              disabled={cartItems.length === 0 || isSending}
              onClick={handleSendOrder}
            >
              {isSending ? "Enviando..." : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar a Caja
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
