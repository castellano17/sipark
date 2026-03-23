import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Scan, User, Trash2, Plus, Minus, CreditCard, Wifi, Utensils } from "lucide-react";
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
import { PendingOrdersModal } from "./PendingOrdersModal";
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
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  // Voucher modal state
  const [voucherInfo, setVoucherInfo] = useState<any>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [pendingVoucherCode, setPendingVoucherCode] = useState("");
  const [currentSale, setCurrentSale] = useState<CurrentSale>({
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
  });
  const [isCheckIn, setIsCheckIn] = useState(false);
  // Waiter pending orders
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const [activeWaiterOrderId, setActiveWaiterOrderId] = useState<number | null>(null);

  // NFC state
  type NfcMode = 'charge' | 'recharge' | null;
  const [nfcMode, setNfcMode] = useState<NfcMode>(null);
  const [nfcInput, setNfcInput] = useState("");
  const [nfcRechargeAmount, setNfcRechargeAmount] = useState("");
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'scanning' | 'found' | 'error'>('idle');
  const [nfcCardInfo, setNfcCardInfo] = useState<any | null>(null);
  const nfcInputRef = useRef<HTMLInputElement>(null);

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
    const interval = setInterval(checkCashBoxStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Manejar datos de checkout (cuando viene desde TimingDashboard)
  useEffect(() => {
    const processCheckout = async () => {
      if (checkoutData && products.length > 0 && cashBoxOpen) {
        const product = products.find((p) => p.id === checkoutData.packageId);
        
        setActiveSessionId(checkoutData.sessionId);
        setIsCheckIn(!!checkoutData.isCheckIn);

        let updatedItems: SaleItem[] = [];
        
        // 1. Añadir el paquete base (si no está pagado)
        if (product && !checkoutData.isPaid) {
          updatedItems.push({
            id: crypto.randomUUID(),
            product_id: product.id,
            product_name: product.name,
            product_type: product.type,
            quantity: 1,
            unit_price: Number(product.price),
            subtotal: Number(product.price),
            duration_minutes: product.duration_minutes,
          });
        }

        // 2. Calcular Tiempo Extra
        let extraMins = 0;
        if (checkoutData.startTime && checkoutData.durationMinutes) {
          const start = new Date(checkoutData.startTime);
          const duration = checkoutData.durationMinutes;
          const end = new Date(start.getTime() + duration * 60000);
          const now = new Date();
          
          if (now > end) {
            extraMins = Math.floor((now.getTime() - end.getTime()) / 60000);
            if (extraMins > 0) {
              // Obtener precio por minuto extra de los ajustes
              const extraPriceStr = await (window as any).api.getSetting('extra_minute_price');
              const extraPricePerMin = parseFloat(extraPriceStr || "1.0");
              const totalExtraPrice = extraMins * extraPricePerMin;

              updatedItems.push({
                id: crypto.randomUUID(),
                product_id: -1, 
                product_name: `Tiempo Extra (${extraMins} min)`,
                product_type: "time",
                quantity: 1,
                unit_price: extraPricePerMin,
                subtotal: totalExtraPrice,
              });
              
              // Disparamos la alerta fuera del render
              warning(`¡Tiempo Excedido! ${extraMins} min extra registrados.`);
            }
          }
        }

        const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        setCurrentSale((prev) => ({
          ...prev,
          client_id: checkoutData.clientId,
          client_name: checkoutData.clientName,
          items: updatedItems,
          subtotal,
          total: Math.max(0, subtotal - prev.discount),
        }));

        if (onCheckoutComplete) onCheckoutComplete();
      }
    };

    processCheckout();
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

  // Buscar por código de barras — detecta vouchers SIPARK-VOUCHER:
  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;

    const VOUCHER_OLD = "SIPARK-VOUCHER:";
    const VOUCHER_NEW = "SIPARK-VOUCHER-";
    const cleanBarcode = barcode.trim();

    // ── Voucher de promoción ──
    if (cleanBarcode.toUpperCase().startsWith(VOUCHER_OLD) || cleanBarcode.toUpperCase().startsWith(VOUCHER_NEW) || cleanBarcode.length >= 8) {
      const codeCandidate = cleanBarcode.replace(/^SIPARK-VOUCHER[:-]/i, "").trim();
      try {
        const result = await (window as any).api.getVoucherByCode(codeCandidate);
        if (result?.valid && result?.voucher) {
          setVoucherInfo(result.voucher);
          setPendingVoucherCode(codeCandidate);
          setShowVoucherModal(true);
          setBarcodeInput("");
          return;
        } else if (result?.valid === false && result?.reason !== "Voucher no encontrado") {
          error(result.reason);
          setBarcodeInput("");
          return;
        }
      } catch { /* si falla, continúa buscando producto normal */ }
    }

    // ── Producto normal ──
    const product = products.find((p) => p.barcode === cleanBarcode);
    if (product) {
      addItemToSale(product);
      setBarcodeInput("");
    } else {
      error(`Producto con código ${cleanBarcode} no encontrado`);
      setBarcodeInput("");
    }
  };

  // Confirmar canje de voucher en el carrito (genera item en C$0)
  const handleConfirmVoucher = () => {
    if (!voucherInfo) return;
    const benefitLabel = voucherInfo.type === "hours"
      ? `${voucherInfo.benefit_value}h de juego gratis`
      : voucherInfo.type === "discount_pct"
      ? `${voucherInfo.benefit_value}% descuento`
      : voucherInfo.type === "discount_fixed"
      ? `C$${parseFloat(voucherInfo.benefit_value).toFixed(2)} descuento`
      : "Paquete gratis";

    const voucherItem: SaleItem = {
      id: crypto.randomUUID(),
      product_id: -98,                          // ID especial voucher
      product_name: `🎟 Voucher [${pendingVoucherCode}]: ${voucherInfo.campaign_name} (${benefitLabel})`,
      product_type: "service",
      quantity: 1,
      unit_price: 0,
      subtotal: 0,
      discount: 0,
      nfc_membership_id: undefined,
      voucher_code: pendingVoucherCode,          // guardado para redeemVoucher al pagar
    } as any;

    setCurrentSale(prev => {
      const items = [...prev.items, voucherItem];
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      return { ...prev, items, subtotal, total: Math.max(0, subtotal - prev.discount) };
    });
    setShowVoucherModal(false);
    setVoucherInfo(null);
    success(`Voucher ${pendingVoucherCode} agregado al carrito`);
  };

  // NFC: Interceptar al Oído Global
  useEffect(() => {
    const handleGlobalNfc = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (nfcMode !== null) {
         e.preventDefault(); // Detenemos el cobro rápido
         setNfcInput(customEvent.detail.uid);
         handleNfcScan(customEvent.detail.uid);
         success(`¡Tarjeta escaneada automáticamente! (${customEvent.detail.uid})`);
      }
    };
    window.addEventListener('nfc-scanned', handleGlobalNfc);
    return () => window.removeEventListener('nfc-scanned', handleGlobalNfc);
  }, [nfcMode, success]);

  // NFC: abrir modal
  const openNfcModal = useCallback((mode: 'charge' | 'recharge') => {
    setNfcMode(mode);
    setNfcInput("");
    setNfcRechargeAmount("");
    setNfcStatus('idle');
    setNfcCardInfo(null);
    setTimeout(() => nfcInputRef.current?.focus(), 150);
  }, []);

  // NFC: cerrar modal
  const closeNfcModal = () => {
    setNfcMode(null);
    setNfcInput("");
    setNfcStatus('idle');
    setNfcCardInfo(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 150);
  };

  // NFC: buscar tarjeta
  const handleNfcScan = async (uid: string) => {
    if (!uid.trim()) return;
    setNfcStatus('scanning');
    try {
      const cardInfo = await (window as any).api.getNfcCardByUid(uid.trim());
      if (cardInfo) {
        setNfcCardInfo(cardInfo);
        setNfcStatus('found');
      } else {
        setNfcStatus('error');
        error("Tarjeta no encontrada o membresía inactiva");
      }
    } catch (err) {
      setNfcStatus('error');
      error("Error leyendo tarjeta NFC");
    }
  };

  // NFC: cobrar entrada
  const handleNfcChargeEntry = async () => {
    if (!nfcCardInfo) return;
    try {
      const settings = await window.api.getAllSettings();
      const entryPriceSetting = Array.isArray(settings)
        ? settings.find((s: any) => s.key === 'nfc_entry_price')
        : null;
      const entryPrice = parseFloat(entryPriceSetting?.value || '100');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const result = await (window as any).api.chargeNfcEntry({
        uid: nfcInput.trim(),
        amount: entryPrice,
        userId: currentUser.id || null,
      });
      success(`Entrada cobrada. Nuevo saldo: C$ ${result.newBalance.toFixed(2)}`);
      closeNfcModal();
    } catch (err: any) {
      error(`Error cobrando entrada: ${err.message}`);
    }
  };

  // NFC: recargar membresía (agrega al carrito como producto especial)
  const handleNfcRecharge = async () => {
    const amount = parseFloat(nfcRechargeAmount);
    if (!nfcCardInfo || isNaN(amount) || amount <= 0) {
      error("Ingrese un monto válido");
      return;
    }
    if (!cashBoxOpen) {
      error("Debe abrir la caja antes de recargar");
      return;
    }

    // Agrega la recarga al carrito para que pase por caja
    const rechargeItem: SaleItem = {
      id: crypto.randomUUID(),
      product_id: -99,                              // ID especial para recarga NFC
      product_name: `Recarga NFC – ${nfcCardInfo.client_name}`,
      product_type: 'membership',
      quantity: 1,
      unit_price: amount,
      subtotal: amount,
      _nfc_recharge: { clientMembershipId: nfcCardInfo.client_membership_id, amount },
    } as any;

    const updatedItems = [...currentSale.items, rechargeItem];
    updateSaleTotals(updatedItems, currentSale.discount);
    success(`Recarga de C$ ${amount.toFixed(2)} añadida al carrito`);
    closeNfcModal();
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
    setActiveWaiterOrderId(null); // Limpiar waiter order también
  };

  const handleSelectClient = (client: Client) => {
    setCurrentSale({
      ...currentSale,
      client_id: client.id === -1 ? undefined : client.id,
      client_name: client.name,
    });
    setShowClientSelector(false);
  };

  // Cargar un pedido pendiente del mesero al carrito del cajero
  const handleLoadPendingOrder = (order: any) => {
    if (!cashBoxOpen) {
      warning("Debe abrir la caja antes de cargar un pedido pendiente.");
      return;
    }
    const items: SaleItem[] = order.items.map((item: any) => ({
      id: crypto.randomUUID(),
      product_id: item.product_id ?? -1,
      product_name: item.product_name,
      product_type: item.product_type || "service",
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      subtotal: parseFloat(item.subtotal),
    }));
    const subtotal = items.reduce((sum: number, i: SaleItem) => sum + i.subtotal, 0);
    setCurrentSale({
      items,
      subtotal,
      discount: 0,
      total: subtotal,
      client_name: order.table_or_client_name,
    });
    setActiveWaiterOrderId(order.id);
    setShowPendingOrders(false);
    success(`Pedido "${order.table_or_client_name}" cargado al carrito`);
  };

  // Procesar pago
  const handlePayment = async (payment: PaymentDetails) => {
    try {
      const activeCashBox = await getActiveCashBox();
      if (!activeCashBox) {
        error("No hay caja abierta");
        return;
      }

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

      // Post-proceso: recargas NFC vinculadas en el carrito
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      for (const item of currentSale.items) {
        if ((item as any)._nfc_recharge) {
          const { clientMembershipId, amount } = (item as any)._nfc_recharge;
          try {
            await (window as any).api.rechargeNfcCard({
              clientMembershipId,
              amount,
              saleId,
              userId: currentUser.id || null,
            });
          } catch { /* silencioso en producción */ }
        }
        // Post-proceso: vouchers de promoción canjeados
        if ((item as any).voucher_code) {
          try {
            await (window as any).api.redeemVoucher({
              code: (item as any).voucher_code,
              saleId,
              clientId: currentSale.client_id || null,
              redeemedBy: currentUser.id || null,
              benefitApplied: { type: (item as any).product_name },
            });
          } catch { /* silencioso en producción */ }
        }
      }

      // Si hay una sesión activa vinculada
      if (activeSessionId) {
        try {
          if (isCheckIn) {
            await (window as any).api.updateSessionPaidStatus(activeSessionId, true);
          } else {
            await (window as any).api.endSession(activeSessionId, currentSale.total);
          }
          setActiveSessionId(null);
        } catch { /* silencioso en producción */ }
      }

      // Si vino de un pedido de mesero, marcarlo como completado
      if (activeWaiterOrderId) {
        try {
          await (window as any).api.updateWaiterOrderStatus({ orderId: activeWaiterOrderId, status: 'completed' });
          setActiveWaiterOrderId(null);
        } catch { /* silencioso */ }
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

      clearSale();
      setShowPaymentModal(false);
      success("Venta procesada exitosamente");
    } catch {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="flex flex-wrap md:flex-nowrap gap-2">
          {canOpenDrawer("pos") && (
            <Button
              variant="outline"
              className="flex-1 md:flex-none gap-2 bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200"
              onClick={() => openDrawer("Apertura manual desde Punto de Venta")}
              disabled={!cashBoxOpen}
              title="Abrir cajón de dinero manualmente"
            >
              💰 <span className="hidden md:inline">Abrir Cajón</span>
            </Button>
          )}
          {/* Pedidos Pendientes de Meseros */}
          <Button
            variant="outline"
            className="flex-1 md:flex-none gap-2 border-orange-400 text-orange-700 hover:bg-orange-50 font-semibold relative"
            onClick={() => setShowPendingOrders(true)}
            disabled={!cashBoxOpen}
            title="Ver pedidos pendientes de los meseros"
          >
            <Utensils className="w-4 h-4" />
            <span className="hidden md:inline">Pedidos Mesas</span>
            {activeWaiterOrderId && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">1</span>
            )}
          </Button>
          {/* NFC Buttons */}
          <Button
            variant="outline"
            className="flex-1 md:flex-none gap-2 border-purple-400 text-purple-700 hover:bg-purple-50 font-semibold"
            onClick={() => openNfcModal('charge')}
            disabled={!cashBoxOpen}
            title="Cobrar entrada con tarjeta NFC"
          >
            <Wifi className="w-4 h-4" />
            <span className="hidden md:inline">Cobrar NFC</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 md:flex-none gap-2 border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold"
            onClick={() => openNfcModal('recharge')}
            disabled={!cashBoxOpen}
            title="Recargar membresía con tarjeta NFC"
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden md:inline">Recargar NFC</span>
          </Button>
          <Button
            variant="outline"
            className="w-full md:w-auto gap-2"
            onClick={() => setShowClientSelector(true)}
            disabled={!cashBoxOpen}
          >
            <User className="w-4 h-4" />
            {currentSale.client_name || "Seleccionar Cliente"}
          </Button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="pl-10"
            disabled={!cashBoxOpen}
          />
        </div>
        <div className="w-full sm:w-64 relative">
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
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        {/* Grid de Productos */}
        <div className="flex-1 overflow-auto pb-24 md:pb-0">
          {isCheckingCashBox ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 font-medium">Verificando estado de caja...</p>
            </div>
          ) : !cashBoxOpen ? (
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col justify-between"
                  onClick={() => addItemToSale(product)}
                >
                  <div className="font-semibold text-sm mb-1 line-clamp-2">
                    {product.name}
                  </div>
                  <div className="text-lg font-bold text-blue-600 mt-auto">
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

        {/* Ticket Actual (Desktop) */}
        <Card className="hidden md:flex w-96 p-4 flex-col">
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
                  <div className="w-16 text-right font-semibold text-sm">
                    {formatCurrency(item.subtotal)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="h-6 w-6 p-0 text-red-500"
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
              disabled={currentSale.items.length === 0 || !cashBoxOpen}
              onClick={() => setShowPaymentModal(true)}
            >
              💳 COBRAR
            </Button>
          </div>
        </Card>

        {/* Floating Cart Button (Mobile) style "Rappi" / "UberEats" */}
        {currentSale.items.length > 0 && cashBoxOpen && (
          <div 
            className="md:hidden absolute bottom-4 left-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform" 
            onClick={() => setIsMobileCartOpen(true)}
          >
            <div className="font-bold flex items-center gap-2">
              <div className="bg-blue-700 px-3 py-1 rounded-full">{currentSale.items.reduce((acc, item) => acc + item.quantity, 0)}</div>
              <span className="text-sm">Ver Carrito</span>
            </div>
            <div className="flex items-center gap-3 font-bold">
              <span>{formatCurrency(currentSale.total)}</span>
              <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">&gt;</span>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {/* Mobile Cart Modal */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Resumen de Compra</h2>
              <button 
                onClick={() => setIsMobileCartOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {currentSale.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <div className="font-bold text-sm text-gray-900">{item.product_name}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.unit_price)} c/u</div>
                  </div>
                  <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold">-</button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold">+</button>
                  </div>
                  <div className="w-16 text-right font-bold text-sm text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </div>
                  <button onClick={() => removeItem(item.id)} className="w-8 h-8 ml-1 flex items-center justify-center text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(currentSale.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border">
                <span className="text-sm font-semibold text-gray-700">Descuento:</span>
                <Input
                  type="number"
                  value={currentSale.discount}
                  onChange={(e) => applyDiscount(Number(e.target.value))}
                  className="w-24 h-8 text-right font-bold"
                />
              </div>
              <div className="flex justify-between text-2xl font-black text-blue-600 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(currentSale.total)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => { clearSale(); setIsMobileCartOpen(false); }} className="w-1/3 p-6 text-gray-600 font-bold">Limpiar</Button>
                <Button 
                  className="w-2/3 bg-blue-600 p-6 text-lg font-bold shadow-lg" 
                  onClick={() => { setIsMobileCartOpen(false); setShowPaymentModal(true); }}
                >
                  💳 COBRAR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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

      {/* Modal NFC */}
      {nfcMode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            {/* Header */}
            <div className={`p-5 rounded-t-lg text-white ${nfcMode === 'charge' ? 'bg-gradient-to-r from-purple-600 to-purple-800' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`}>
              <div className="flex items-center gap-3">
                {nfcMode === 'charge'
                  ? <Wifi className="w-7 h-7" />
                  : <CreditCard className="w-7 h-7" />}
                <div>
                  <h2 className="text-xl font-bold">
                    {nfcMode === 'charge' ? 'Cobrar Entrada NFC' : 'Recargar Membresía NFC'}
                  </h2>
                  <p className="text-sm opacity-80">
                    {nfcMode === 'charge'
                      ? 'Acerque la tarjeta para descontar la entrada'
                      : 'Acerque la tarjeta para cargar una recarga al carrito'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* NFC UID reader */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  UID de la Tarjeta
                </label>
                <div className="relative">
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    ref={nfcInputRef}
                    type="text"
                    value={nfcInput}
                    onChange={(e) => setNfcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNfcScan(nfcInput);
                    }}
                    placeholder="Acerque la tarjeta al lector..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-dashed border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-center font-mono text-sm bg-purple-50"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleNfcScan(nfcInput)}
                  className="mt-2 w-full text-sm py-2 bg-gray-100 hover:bg-gray-200 border rounded-lg font-medium text-gray-700"
                >
                  🔍 Buscar tarjeta manualmente
                </button>
              </div>

              {/* Card info */}
              {nfcStatus === 'scanning' && (
                <div className="text-center py-3 text-gray-500">
                  <div className="animate-spin text-2xl inline-block">⌛</div>
                  <p className="mt-1 text-sm">Buscando tarjeta...</p>
                </div>
              )}

              {nfcStatus === 'found' && nfcCardInfo && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <p className="text-green-700 font-bold text-base">✅ Tarjeta encontrada</p>
                  <div className="mt-2 text-sm space-y-1 text-gray-700">
                    <p><span className="font-semibold">Cliente:</span> {nfcCardInfo.client_name}</p>
                    <p><span className="font-semibold">Membresía:</span> {nfcCardInfo.membership_name}</p>
                    <p className="text-lg font-bold text-green-800">
                      Saldo: C$ {Number(nfcCardInfo.balance).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {nfcStatus === 'error' && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 text-sm">
                  ❌ Tarjeta no encontrada o membresía inactiva.
                </div>
              )}

              {/* Recharge amount */}
              {nfcMode === 'recharge' && nfcStatus === 'found' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monto de Recarga (C$)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nfcRechargeAmount}
                    onChange={(e) => setNfcRechargeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-xl font-bold"
                  />
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={closeNfcModal}
                className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                Cancelar
              </button>
              {nfcMode === 'charge' && nfcStatus === 'found' && (
                <button
                  type="button"
                  onClick={handleNfcChargeEntry}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                >
                  ✓ Cobrar Entrada
                </button>
              )}
              {nfcMode === 'recharge' && nfcStatus === 'found' && (
                <button
                  type="button"
                  onClick={handleNfcRecharge}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                >
                  + Agregar Recarga al Carrito
                </button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Voucher Confirmation Modal ── */}
      {showVoucherModal && voucherInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎟</div>
              <h3 className="text-lg font-bold text-slate-800">Voucher Válido</h3>
              <p className="text-sm text-slate-500 mt-1">{voucherInfo.campaign_name}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm space-y-2 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficio:</span>
                <span className="font-bold text-purple-700">
                  {voucherInfo.type === "hours"
                    ? `${voucherInfo.benefit_value}h de juego gratis`
                    : voucherInfo.type === "discount_pct"
                    ? `${voucherInfo.benefit_value}% descuento`
                    : voucherInfo.type === "discount_fixed"
                    ? `C$${parseFloat(voucherInfo.benefit_value).toFixed(2)} descuento`
                    : "Paquete gratis"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Código:</span>
                <span className="font-mono font-bold text-slate-700">{pendingVoucherCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Usos restantes:</span>
                <span className="font-medium">{voucherInfo.max_uses - voucherInfo.times_used}</span>
              </div>
              {voucherInfo.valid_until && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Vence:</span>
                  <span>{voucherInfo.valid_until}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 text-center mb-4">
              Se agregará al carrito con total C$0.00 y quedará registrado en el sistema al procesar la venta.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowVoucherModal(false); setVoucherInfo(null); setBarcodeInput(""); }}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmVoucher}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
              >
                ✓ Canjear Voucher
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Pending Orders Modal (Mesero) ── */}
      <PendingOrdersModal
        isOpen={showPendingOrders}
        onClose={() => setShowPendingOrders(false)}
        onSelectOrder={handleLoadPendingOrder}
      />
    </div>
  );
}
