import { useState, useEffect, useRef } from "react";
import { Search, Scan, User, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { useDatabase } from "../hooks/useDatabase";
import { usePrinter } from "../hooks/usePrinter";
import { useNotification } from "../hooks/useNotification";
import { useCurrency } from "../hooks/useCurrency";
import { useCashBox } from "../hooks/useCashBox";
import { usePermissions } from "../hooks/usePermissions";
import { ClientSelectorModal } from "./ClientSelectorModal";
import { PaymentModal } from "./PaymentModal";
import type {
  ProductService,
  SaleItem,
  CurrentSale,
  Client,
  PaymentDetails,
} from "../types";



interface POSScreenProps {
  checkoutData?: {
    sessionId: number;
    clientId: number;
    clientName: string;
    packageId: number;
    packageName: string;
    packagePrice: number;
    isCheckIn?: boolean;
    isPaid?: boolean;
    startTime?: string;
    durationMinutes?: number;
  } | null;
  onCheckoutComplete?: () => void;
}

export function POSScreen({
  checkoutData,
  onCheckoutComplete,
}: POSScreenProps = {}) {
  const { getProductsServices } = useDatabase();
  const { printTicket, openDrawer } = usePrinter();
  const { warning, error, success } = useNotification();
  const { formatCurrency } = useCurrency();
  const { createSaleWithItems, getActiveCashBox } = useCashBox();
  const { canOpenDrawer } = usePermissions();
  const [products, setProducts] = useState<ProductService[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductService[]>(
    [],
  );
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashBoxOpen, setCashBoxOpen] = useState(false);
  const [isCheckingCashBox, setIsCheckingCashBox] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [currentSale, setCurrentSale] = useState<CurrentSale>({
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
  });
  const [isCheckIn, setIsCheckIn] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cargar productos y verificar estado de caja
  useEffect(() => {
    loadProducts();
    loadCategories();
    checkCashBoxStatus();

    // Enfocar automáticamente el input de código de barras al cargar
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 300);

    // Verificar estado de caja cada 5 segundos
    const interval = setInterval(checkCashBoxStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Manejar datos de checkout (cuando viene desde TimingDashboard)
  useEffect(() => {
    if (checkoutData && products.length > 0 && cashBoxOpen) {
      const product = products.find((p) => p.id === checkoutData.packageId);
      
      setActiveSessionId(checkoutData.sessionId);
      setIsCheckIn(!!checkoutData.isCheckIn);

      setCurrentSale((prev) => {
        let updatedItems: SaleItem[] = [];
        
        if (product && !checkoutData.isPaid) {
          updatedItems.push({
            id: crypto.randomUUID(),
            product_id: product.id,
            product_name: product.name,
            product_type: product.type,
            quantity: 1,
            unit_price: product.price,
            subtotal: product.price,
            duration_minutes: product.duration_minutes,
          });
        }

        if (checkoutData.startTime && checkoutData.durationMinutes) {
          const start = new Date(checkoutData.startTime);
          const duration = checkoutData.durationMinutes;
          const end = new Date(start.getTime() + duration * 60000);
          const now = new Date();
          
          if (now > end) {
            const extraMins = Math.floor((now.getTime() - end.getTime()) / 60000);
            if (extraMins > 0) {
              updatedItems.push({
                id: crypto.randomUUID(),
                product_id: -1, 
                product_name: `Tiempo Extra (${extraMins} min)`,
                product_type: "time",
                quantity: 1,
                unit_price: 0,
                subtotal: 0,
              });
              warning(`Se han detectado ${extraMins} minutos de tiempo extra.`);
            }
          }
        }

        const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
        return {
          ...prev,
          client_id: checkoutData.clientId,
          client_name: checkoutData.clientName,
          items: updatedItems,
          subtotal,
          total: Math.max(0, subtotal - prev.discount),
        };
      });

      if (onCheckoutComplete) onCheckoutComplete();
    }
  }, [checkoutData, products, cashBoxOpen, onCheckoutComplete, warning]);

  const loadProducts = async () => {
    const rows = await getProductsServices();
    setProducts(rows);
    setFilteredProducts(rows);
  };

  const checkCashBoxStatus = async () => {
    const activeCashBox = await getActiveCashBox();
    setCashBoxOpen(!!activeCashBox);
    setIsCheckingCashBox(false);
  };

  const loadCategories = async () => {
    try {
      const data = await (window as any).api.getCategories();
      // Filtrar para ocultar las categorías que el usuario no quiere (excepto Paquetes)
      const systemCategoriesToHide = ["Bebidas", "Comida", "Alquiler", "Eventos", "Membresía", "Snacks", "Tiempo"];
      const filtered = data.filter((cat: any) => 
        cat.name === "Paquetes" || !systemCategoriesToHide.includes(cat.name)
      );
      setDbCategories(filtered);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  // Filtrar productos por categoría y búsqueda
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
          p.barcode?.toLowerCase().includes(query),
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery, products]);

  // Buscar por código de barras
  const handleBarcodeSearch = (barcode: string) => {
    if (!barcode.trim()) return;

    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      addItemToSale(product);
      setBarcodeInput("");
    } else {
      error(`Producto con código ${barcode} no encontrado`);
      setBarcodeInput("");
    }
  };

  // Agregar producto al ticket
  const addItemToSale = (product: ProductService) => {
    if (!cashBoxOpen) {
      warning("No se puede agregar productos. Debe aperturar la caja primero.");
      return;
    }

    const existingItem = currentSale.items.find(
      (item) => item.product_id === product.id,
    );

    let updatedItems: SaleItem[];
    if (existingItem) {
      updatedItems = currentSale.items.map((item) =>
        item.product_id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.unit_price,
            }
          : item,
      );
    } else {
      const newItem: SaleItem = {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price,
        duration_minutes: product.duration_minutes,
      };
      updatedItems = [...currentSale.items, newItem];
    }

    updateSaleTotals(updatedItems, currentSale.discount);
  };

  // Actualizar cantidad
  const updateQuantity = (itemId: string, delta: number) => {
    const updatedItems = currentSale.items
      .map((item) => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.unit_price,
          };
        }
        return item;
      })
      .filter((item): item is SaleItem => item !== null);

    updateSaleTotals(updatedItems, currentSale.discount);
  };

  // Eliminar item
  const removeItem = (itemId: string) => {
    const updatedItems = currentSale.items.filter((item) => item.id !== itemId);
    updateSaleTotals(updatedItems, currentSale.discount);
  };

  // Actualizar totales
  const updateSaleTotals = (items: SaleItem[], discount: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal - discount;

    setCurrentSale({
      ...currentSale,
      items,
      subtotal,
      discount,
      total: Math.max(0, total),
    });
  };

  // Aplicar descuento
  const applyDiscount = (amount: number) => {
    updateSaleTotals(currentSale.items, amount);
  };

  // Limpiar venta
  const clearSale = () => {
    setCurrentSale({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
    });
    setActiveSessionId(null); // Limpiar sessionId también
  };

  const handleSelectClient = (client: Client) => {
    setCurrentSale({
      ...currentSale,
      client_id: client.id === -1 ? undefined : client.id,
      client_name: client.name,
    });
    setShowClientSelector(false);
  };

  // Procesar pago
  const handlePayment = async (payment: PaymentDetails) => {
    try {
      // Registrar venta...

      // Obtener caja activa
      const activeCashBox = await getActiveCashBox();
      if (!activeCashBox) {
        error("No hay caja abierta");
        return;
      }

      // Guardar venta en BD
      const saleId = await createSaleWithItems({
        client_id: currentSale.client_id,
        client_name: currentSale.client_name,
        items: currentSale.items,
        subtotal: currentSale.subtotal,
        discount: currentSale.discount,
        total: currentSale.total,
        payment_method: payment.method,
        cash_box_id: activeCashBox.id,
      });

      if (!saleId) {
        error("Error al guardar la venta");
        return;
      }

      // Si hay una sesión activa vinculada
      if (activeSessionId) {
        try {
          if (isCheckIn) {
            // Si es check-in, solo marcamos como pagada
            await (window as any).api.updateSessionPaidStatus(activeSessionId, true);
          } else {
            // Si es check-out, finalizamos la sesión completamente
            await (window as any).api.endSession(
              activeSessionId,
              currentSale.total,
            );
          }
          setActiveSessionId(null);
        } catch (err) {
          console.error("Error actualizando sesión:", err);
        }
      }

      // Imprimir ticket
      await printTicket({
        saleId,
        clientName: currentSale.client_name,
        items: currentSale.items,
        subtotal: currentSale.subtotal,
        discount: currentSale.discount,
        total: currentSale.total,
        paymentMethod: payment.method,
        amountReceived: payment.amount_received,
        change: payment.change,
      });

      // Limpiar venta
      clearSale();
      setShowPaymentModal(false);
      success("Venta procesada exitosamente");
    } catch (err) {
      console.error("Error procesando venta:", err);
      error("Error al procesar la venta");
    }
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Alerta de Caja Cerrada */}
      {!isCheckingCashBox && !cashBoxOpen && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-center gap-3">
          <div className="text-red-600 text-2xl">⚠️</div>
          <div className="flex-1">
            <div className="font-bold text-red-900">Caja Cerrada</div>
            <div className="text-sm text-red-700">
              Debe aperturar la caja antes de realizar ventas. Vaya a Punto de
              Venta → Gestión de Caja.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Punto de Venta</h1>
          {!isCheckingCashBox && (
            cashBoxOpen ? (
              <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                ✓ Caja Abierta
              </span>
            ) : (
              <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold">
                ✗ Caja Cerrada
              </span>
            )
          )}
        </div>
        <div className="flex gap-2">
          {canOpenDrawer("pos") && (
            <Button
              variant="outline"
              className="gap-2 bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200"
              onClick={() => openDrawer("Apertura manual desde Punto de Venta")}
              disabled={!cashBoxOpen}
              title="Abrir cajón de dinero manualmente"
            >
              💰 Abrir Cajón
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowClientSelector(true)}
            disabled={!cashBoxOpen}
          >
            <User className="w-4 h-4" />
            {currentSale.client_name || "Seleccionar Cliente"}
          </Button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar producto por nombre..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="pl-10"
            disabled={!cashBoxOpen}
          />
        </div>
        <div className="w-64 relative">
          <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            ref={barcodeInputRef}
            placeholder="Código de barras"
            value={barcodeInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setBarcodeInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                handleBarcodeSearch(barcodeInput);
              }
            }}
            className="pl-10"
            disabled={!cashBoxOpen}
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          size="sm"
          disabled={!cashBoxOpen}
        >
          Todos
        </Button>
        {dbCategories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.name ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat.name)}
            size="sm"
            className="gap-2"
            disabled={!cashBoxOpen}
          >
            <span>{cat.type === 'food' ? '🍔' : 
                   cat.type === 'drink' ? '🥤' :
                   cat.type === 'snack' ? '🍿' :
                   cat.type === 'time' ? '⏱️' :
                   cat.type === 'package' ? '🎮' :
                   cat.type === 'event' ? '🎂' :
                   cat.type === 'rental' ? '🏠' :
                   cat.type === 'membership' ? '🎟️' : '🏷️'}</span>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Grid de Productos */}
        <div className="flex-1 overflow-auto">
          {!cashBoxOpen ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Caja Cerrada</div>
                <div className="text-sm">
                  Aperture la caja para comenzar a vender
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => addItemToSale(product)}
                >
                  <div className="font-semibold text-sm mb-1">
                    {product.name}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(product.price)}
                  </div>
                  {product.duration_minutes && (
                    <div className="text-xs text-gray-500">
                      {product.duration_minutes} min
                    </div>
                  )}
                  {product.barcode && (
                    <div className="text-xs text-gray-400 mt-1">
                      {product.barcode}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Actual */}
        <Card className="w-96 p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Ticket Actual</h2>

          {/* Items */}
          <div className="flex-1 overflow-auto space-y-2 mb-4">
            {currentSale.items.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No hay productos agregados
              </div>
            ) : (
              currentSale.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {item.product_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(item.unit_price)} c/u
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="w-16 text-right font-semibold">
                    {formatCurrency(item.subtotal)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Totales */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(currentSale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span>Descuento:</span>
              <Input
                type="number"
                value={currentSale.discount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  applyDiscount(Number(e.target.value))
                }
                className="w-24 h-8 text-right"
              />
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>TOTAL:</span>
              <span>{formatCurrency(currentSale.total)}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={clearSale}
              className="flex-1"
              disabled={!cashBoxOpen}
            >
              Limpiar
            </Button>
            <Button
              className="flex-1"
              disabled={currentSale.items.length === 0 || !cashBoxOpen}
              onClick={() => setShowPaymentModal(true)}
            >
              💳 COBRAR
            </Button>
          </div>
        </Card>
      </div>

      {/* Modales */}
      {showClientSelector && (
        <ClientSelectorModal
          onClose={() => setShowClientSelector(false)}
          onSelect={handleSelectClient}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          sale={currentSale}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePayment}
        />
      )}
    </div>
  );
}
