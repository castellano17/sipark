# Correcciones Sistema de Vouchers

## Resumen de Problemas
1. Los vouchers de descuento porcentual, descuento fijo y paquete gratis no funcionan correctamente
2. Al crear promoción de "paquete gratis" pide un ID numérico en lugar de permitir seleccionar de una lista
3. Los vouchers impresos muestran "parque infantil" en lugar de la información correcta del negocio

## Cambios Realizados

### 1. Promotions.tsx - Selector de Paquetes ✅
- Agregado estado `packages` y `benefitPackageId` al formulario
- Agregada función `loadPackages()` para cargar paquetes disponibles
- Modificado el formulario para mostrar un selector de paquetes cuando el tipo es "free_package"
- Agregada validación para requerir selección de paquete en promociones de paquete gratis

### 2. POSScreen.tsx - Lógica de Canje de Vouchers (PENDIENTE)

Necesitas modificar la función `handleConfirmVoucher` (línea 374) para:

#### a) Agregar estado para modal de selección de paquetes
Después de la línea 69, agregar:
```typescript
const [showPackageSelectionModal, setShowPackageSelectionModal] = useState(false);
```

#### b) Reemplazar la función `handleConfirmVoucher` completa (líneas 374-407) con:

```typescript
  // Confirmar canje de voucher en el carrito
  const handleConfirmVoucher = () => {
    if (!voucherInfo) return;
    
    const voucherType = voucherInfo.type;
    
    // Para vouchers de descuento o paquete gratis, necesitamos validar que haya un paquete seleccionado
    if (voucherType === "discount_pct" || voucherType === "discount_fixed" || voucherType === "free_package") {
      const hasPackageInCart = currentSale.items.some(item => item.product_type === "package");
      
      if (!hasPackageInCart) {
        // Mostrar modal para seleccionar paquete
        setShowVoucherModal(false);
        setShowPackageSelectionModal(true);
        return;
      }
    }
    
    // Procesar el voucher según su tipo
    processVoucherBenefit();
  };
  
  const processVoucherBenefit = () => {
    if (!voucherInfo) return;
    
    const voucherType = voucherInfo.type;
    const benefitValue = parseFloat(voucherInfo.benefit_value);
    
    if (voucherType === "hours") {
      // Horas gratis - agregar como item de C$0
      const benefitLabel = `${benefitValue}h de juego gratis`;
      const voucherItem: SaleItem = {
        id: crypto.randomUUID(),
        product_id: -98,
        product_name: `🎟 Voucher [${pendingVoucherCode}]: ${voucherInfo.campaign_name} (${benefitLabel})`,
        product_type: "service",
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
        discount: 0,
        nfc_membership_id: undefined,
        voucher_code: pendingVoucherCode,
        _voucher_info: voucherInfo,
      } as any;
      
      setCurrentSale(prev => {
        const items = [...prev.items, voucherItem];
        const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
        return { ...prev, items, subtotal, total: Math.max(0, subtotal - prev.discount) };
      });
      success(`Voucher ${pendingVoucherCode} agregado al carrito`);
      
    } else if (voucherType === "discount_pct") {
      // Descuento porcentual - aplicar al paquete
      setCurrentSale(prev => {
        const items = prev.items.map(item => {
          if (item.product_type === "package") {
            const discountAmount = item.unit_price * (benefitValue / 100);
            return {
              ...item,
              discount: (item.discount || 0) + discountAmount,
              subtotal: item.unit_price * item.quantity - ((item.discount || 0) + discountAmount),
            };
          }
          return item;
        });
        
        // Agregar item informativo del voucher
        const voucherItem: SaleItem = {
          id: crypto.randomUUID(),
          product_id: -98,
          product_name: `🎟 Voucher [${pendingVoucherCode}]: ${benefitValue}% descuento aplicado`,
          product_type: "service",
          quantity: 1,
          unit_price: 0,
          subtotal: 0,
          discount: 0,
          nfc_membership_id: undefined,
          voucher_code: pendingVoucherCode,
          _voucher_info: voucherInfo,
        } as any;
        items.push(voucherItem);
        
        const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
        return { ...prev, items, subtotal, total: Math.max(0, subtotal - prev.discount) };
      });
      success(`Descuento del ${benefitValue}% aplicado al paquete`);
      
    } else if (voucherType === "discount_fixed") {
      // Descuento fijo - aplicar al paquete
      setCurrentSale(prev => {
        const items = prev.items.map(item => {
          if (item.product_type === "package") {
            const newDiscount = Math.min(benefitValue, item.unit_price * item.quantity);
            return {
              ...item,
              discount: (item.discount || 0) + newDiscount,
              subtotal: item.unit_price * item.quantity - ((item.discount || 0) + newDiscount),
            };
          }
          return item;
        });
        
        // Agregar item informativo del voucher
        const voucherItem: SaleItem = {
          id: crypto.randomUUID(),
          product_id: -98,
          product_name: `🎟 Voucher [${pendingVoucherCode}]: C$${benefitValue.toFixed(2)} descuento aplicado`,
          product_type: "service",
          quantity: 1,
          unit_price: 0,
          subtotal: 0,
          discount: 0,
          nfc_membership_id: undefined,
          voucher_code: pendingVoucherCode,
          _voucher_info: voucherInfo,
        } as any;
        items.push(voucherItem);
        
        const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
        return { ...prev, items, subtotal, total: Math.max(0, subtotal - prev.discount) };
      });
      success(`Descuento de C$${benefitValue.toFixed(2)} aplicado al paquete`);
      
    } else if (voucherType === "free_package") {
      // Paquete gratis - buscar el paquete específico y agregarlo con precio 0
      const packageId = voucherInfo.benefit_package_id;
      const packageProduct = products.find(p => p.id === packageId && p.type === "package");
      
      if (packageProduct) {
        const voucherItem: SaleItem = {
          id: crypto.randomUUID(),
          product_id: packageProduct.id,
          product_name: `🎟 ${packageProduct.name} (GRATIS - Voucher ${pendingVoucherCode})`,
          product_type: "package",
          quantity: 1,
          unit_price: 0,
          subtotal: 0,
          discount: 0,
          nfc_membership_id: undefined,
          voucher_code: pendingVoucherCode,
          _voucher_info: voucherInfo,
        } as any;
        
        setCurrentSale(prev => {
          const items = [...prev.items, voucherItem];
          const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
          return { ...prev, items, subtotal, total: Math.max(0, subtotal - prev.discount) };
        });
        success(`Paquete gratis "${packageProduct.name}" agregado al carrito`);
      } else {
        error("El paquete de la promoción no está disponible");
      }
    }
    
    setShowVoucherModal(false);
    setShowPackageSelectionModal(false);
    setVoucherInfo(null);
  };
```

#### c) Agregar modal de selección de paquetes en el JSX

Buscar donde está el modal de vouchers (alrededor de la línea 1450) y agregar después de él:

```typescript
      {/* Modal: Selección de Paquete para Voucher */}
      {showPackageSelectionModal && voucherInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Selecciona un Paquete
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Este voucher requiere que selecciones un paquete para aplicar el beneficio.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products
                .filter(p => p.type === "package")
                .map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      // Agregar el paquete al carrito
                      addItemToSale(pkg);
                      // Procesar el voucher
                      processVoucherBenefit();
                    }}
                    className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  >
                    <div className="font-semibold text-slate-800">{pkg.name}</div>
                    <div className="text-sm text-slate-500">{formatCurrency(pkg.price)}</div>
                  </button>
                ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowPackageSelectionModal(false);
                  setShowVoucherModal(true);
                }}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
```

### 3. Corrección de Información en Vouchers Impresos

El problema de "parque infantil" en los vouchers impresos ya está parcialmente resuelto en el código actual. La función `handlePrint` en Promotions.tsx ya obtiene la información del negocio con:

```typescript
const [vouchers, business] = await Promise.all([
  api.getVouchersForPrint(campaignId),
  api.getBusinessSettings().catch(() => ({ name: "SIPARK", phone: "", address: "" })),
]);
```

Y usa `business.name` en lugar de texto hardcodeado. Si aún muestra "parque infantil", verifica que:
1. La configuración del negocio esté guardada correctamente en la base de datos
2. La función `getBusinessSettings()` esté retornando los datos correctos

## Pruebas Recomendadas

1. Crear una promoción de "Paquete Gratis" y verificar que muestre el selector de paquetes
2. Escanear un voucher de descuento porcentual en el POS sin paquete en el carrito
3. Agregar un paquete y luego escanear el voucher de descuento
4. Verificar que el descuento se aplique correctamente
5. Probar voucher de paquete gratis
6. Imprimir vouchers y verificar que muestren el nombre correcto del negocio
