# Instrucciones Finales - Corrección Sistema de Vouchers

## Resumen
He corregido parcialmente el sistema de vouchers. Los cambios en `Promotions.tsx` están completos, pero necesitas aplicar manualmente los cambios en `POSScreen.tsx`.

## ✅ Cambios Completados

### 1. Promotions.tsx
- ✅ Agregado selector de paquetes para promociones de "Paquete Gratis"
- ✅ El formulario ahora carga y muestra todos los paquetes disponibles
- ✅ Validación para requerir selección de paquete en tipo "free_package"
- ✅ Campo de "benefitValue" se deshabilita cuando el tipo es "free_package"

### 2. POSScreen.tsx
- ✅ Agregado estado `showPackageSelectionModal`

## ⚠️ Cambios Pendientes (Aplicar Manualmente)

### POSScreen.tsx - Reemplazar función handleConfirmVoucher

**Ubicación:** Línea 374 aproximadamente

**Buscar esta función:**
```typescript
const handleConfirmVoucher = () => {
  if (!voucherInfo) return;
  const benefitLabel = voucherInfo.type === "hours"
    ? `${voucherInfo.benefit_value}h de juego gratis`
    ...
  success(`Voucher ${pendingVoucherCode} agregado al carrito`);
};
```

**Reemplazar con el contenido del archivo:** `pos-voucher-functions.tsx`

Este archivo contiene:
1. Nueva función `handleConfirmVoucher` que valida si hay paquete en el carrito
2. Nueva función `processVoucherBenefit` que maneja cada tipo de voucher correctamente:
   - `hours`: Agrega item de horas gratis (funciona actualmente)
   - `discount_pct`: Aplica descuento porcentual al paquete
   - `discount_fixed`: Aplica descuento fijo al paquete
   - `free_package`: Agrega el paquete gratis al carrito

### POSScreen.tsx - Agregar Modal de Selección de Paquetes

**Ubicación:** Buscar el modal de vouchers (alrededor de línea 1450)

**Agregar después del modal de vouchers:**
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

## 🔍 Cómo Aplicar los Cambios

1. Abre `src/components/POSScreen.tsx`
2. Busca la función `handleConfirmVoucher` (línea ~374)
3. Selecciona toda la función desde `const handleConfirmVoucher = () => {` hasta el `};` que la cierra
4. Reemplázala con el contenido de `pos-voucher-functions.tsx` (las dos funciones completas)
5. Busca donde está el modal de vouchers (busca `showVoucherModal &&`)
6. Después de ese modal completo, agrega el nuevo modal de selección de paquetes

## 📋 Flujo de Funcionamiento

### Voucher de Horas Gratis (Ya funciona)
1. Escanear voucher → Agregar al carrito como item de C$0 → Crear sesión al pagar

### Voucher de Descuento Porcentual (Nuevo)
1. Escanear voucher
2. Si NO hay paquete en carrito → Mostrar modal para seleccionar paquete
3. Si hay paquete → Aplicar descuento % al paquete existente
4. Agregar item informativo del voucher

### Voucher de Descuento Fijo (Nuevo)
1. Escanear voucher
2. Si NO hay paquete en carrito → Mostrar modal para seleccionar paquete
3. Si hay paquete → Aplicar descuento fijo al paquete existente
4. Agregar item informativo del voucher

### Voucher de Paquete Gratis (Nuevo)
1. Escanear voucher
2. Buscar el paquete específico de la promoción
3. Agregar el paquete al carrito con precio C$0
4. Marcar como voucher canjeado

## 🧪 Pruebas Recomendadas

1. **Crear Promoción de Paquete Gratis:**
   - Ir a Promociones → Crear
   - Seleccionar tipo "Paquete Gratis"
   - Verificar que aparece selector de paquetes
   - Crear la promoción

2. **Probar Voucher de Descuento Porcentual:**
   - Escanear voucher sin paquete → Debe mostrar modal de selección
   - Seleccionar paquete → Debe aplicar descuento
   - Verificar que el precio del paquete se reduce correctamente

3. **Probar Voucher de Descuento Fijo:**
   - Agregar paquete al carrito primero
   - Escanear voucher → Debe aplicar descuento fijo
   - Verificar que no descuenta más del precio del paquete

4. **Probar Voucher de Paquete Gratis:**
   - Escanear voucher → Debe agregar el paquete específico con precio C$0
   - Completar venta → Debe canjear el voucher

5. **Verificar Impresión:**
   - Imprimir vouchers
   - Verificar que muestra el nombre correcto del negocio (no "parque infantil")

## 📝 Notas Adicionales

- Los vouchers de descuento solo se aplican a items de tipo "package"
- El descuento fijo nunca puede ser mayor al precio del paquete
- Los vouchers se canjean automáticamente al completar la venta
- La información del negocio en los vouchers viene de la configuración en Settings
