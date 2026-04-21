// Nuevas funciones para manejar vouchers en POSScreen.tsx
// Reemplazar handleConfirmVoucher (línea ~374) con estas dos funciones:

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
