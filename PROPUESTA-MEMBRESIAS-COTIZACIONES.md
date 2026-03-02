# Sistema de Membresías y Cotizaciones - SIPARK

## ANÁLISIS DE ESTRUCTURA ACTUAL

### Tablas Existentes de Membresías

#### 1. `memberships` (Tipos de Membresía)

```sql
- id: INTEGER PRIMARY KEY
- name: TEXT (ej: "Mensual", "Trimestral", "Anual")
- description: TEXT
- price: REAL
- duration_days: INTEGER
- benefits: TEXT (JSON o texto con beneficios)
- is_active: BOOLEAN
- created_at: DATETIME
```

#### 2. `client_memberships` (Membresías Asignadas)

```sql
- id: INTEGER PRIMARY KEY
- client_id: INTEGER (FK → clients)
- membership_id: INTEGER (FK → memberships)
- start_date: DATE
- end_date: DATE
- status: TEXT ('active', 'expired', 'cancelled')
- payment_amount: REAL
- notes: TEXT
- created_by: INTEGER (FK → users)
- created_at: DATETIME
```

---

## MEJORAS PROPUESTAS PARA MEMBRESÍAS

### 1. Campos Adicionales Recomendados

#### Tabla `memberships` - Agregar:

```sql
ALTER TABLE memberships ADD COLUMN membership_type TEXT DEFAULT 'standard';
-- Tipos: 'standard', 'premium', 'vip', 'student', 'family'

ALTER TABLE memberships ADD COLUMN max_sessions_per_day INTEGER;
-- Límite de sesiones diarias (NULL = ilimitado)

ALTER TABLE memberships ADD COLUMN discount_percentage REAL DEFAULT 0;
-- Descuento en productos/servicios

ALTER TABLE memberships ADD COLUMN priority_level INTEGER DEFAULT 0;
-- Nivel de prioridad (0=normal, 1=alta, 2=vip)

ALTER TABLE memberships ADD COLUMN auto_renew BOOLEAN DEFAULT 0;
-- Renovación automática

ALTER TABLE memberships ADD COLUMN grace_period_days INTEGER DEFAULT 0;
-- Días de gracia después del vencimiento
```

#### Tabla `client_memberships` - Agregar:

```sql
ALTER TABLE client_memberships ADD COLUMN payment_method TEXT;
-- 'cash', 'card', 'transfer', 'online'

ALTER TABLE client_memberships ADD COLUMN invoice_number TEXT;
-- Número de factura/recibo

ALTER TABLE client_memberships ADD COLUMN auto_renew BOOLEAN DEFAULT 0;
-- Si se renueva automáticamente

ALTER TABLE client_memberships ADD COLUMN renewed_from_id INTEGER;
-- ID de la membresía anterior (para historial de renovaciones)
-- FOREIGN KEY (renewed_from_id) REFERENCES client_memberships(id)

ALTER TABLE client_memberships ADD COLUMN cancelled_at DATETIME;
-- Fecha de cancelación

ALTER TABLE client_memberships ADD COLUMN cancelled_by INTEGER;
-- Usuario que canceló
-- FOREIGN KEY (cancelled_by) REFERENCES users(id)

ALTER TABLE client_memberships ADD COLUMN cancellation_reason TEXT;
-- Motivo de cancelación
```

### 2. Nueva Tabla: `membership_usage` (Uso de Membresías)

```sql
CREATE TABLE IF NOT EXISTS membership_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_membership_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  usage_date DATE NOT NULL,
  usage_type TEXT NOT NULL, -- 'session', 'product_discount', 'service_discount'
  session_id INTEGER, -- FK → active_sessions (si aplica)
  sale_id INTEGER, -- FK → sales (si aplica)
  discount_applied REAL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_membership_id) REFERENCES client_memberships(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (session_id) REFERENCES active_sessions(id),
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);
```

**Propósito**: Rastrear cada vez que un cliente usa su membresía (sesiones, descuentos aplicados, etc.)

### 3. Nueva Tabla: `membership_renewals` (Historial de Renovaciones)

```sql
CREATE TABLE IF NOT EXISTS membership_renewals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  old_membership_id INTEGER NOT NULL,
  new_membership_id INTEGER NOT NULL,
  renewal_date DATE NOT NULL,
  old_end_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  payment_amount REAL NOT NULL,
  payment_method TEXT,
  discount_applied REAL DEFAULT 0,
  notes TEXT,
  processed_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (old_membership_id) REFERENCES client_memberships(id),
  FOREIGN KEY (new_membership_id) REFERENCES client_memberships(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);
```

**Propósito**: Mantener historial completo de renovaciones para análisis y reportes.

---

## SISTEMA DE COTIZACIONES (NUEVO)

### 1. Tabla Principal: `quotations`

```sql
CREATE TABLE IF NOT EXISTS quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_number TEXT NOT NULL UNIQUE, -- QT-2026-0001
  client_id INTEGER,
  client_name TEXT NOT NULL, -- Por si es cliente nuevo
  client_phone TEXT,
  client_email TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'approved', 'rejected', 'expired', 'converted'
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total REAL NOT NULL,
  valid_until DATE NOT NULL, -- Fecha de vencimiento
  notes TEXT,
  terms_conditions TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME, -- Cuándo se envió al cliente
  approved_at DATETIME, -- Cuándo fue aprobada
  converted_to_sale_id INTEGER, -- FK → sales (si se convirtió en venta)
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (converted_to_sale_id) REFERENCES sales(id)
);
```

### 2. Tabla de Items: `quotation_items`

```sql
CREATE TABLE IF NOT EXISTS quotation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  product_id INTEGER, -- Puede ser NULL si es item personalizado
  product_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL DEFAULT 0,
  subtotal REAL NOT NULL,
  item_order INTEGER DEFAULT 0, -- Orden de visualización
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products_services(id)
);
```

### 3. Tabla de Historial: `quotation_history`

```sql
CREATE TABLE IF NOT EXISTS quotation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'sent', 'approved', 'rejected', 'expired', 'converted'
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  performed_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id)
);
```

### 4. Tabla de Plantillas: `quotation_templates`

```sql
CREATE TABLE IF NOT EXISTS quotation_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  terms_conditions TEXT,
  footer_text TEXT,
  validity_days INTEGER DEFAULT 15, -- Días de validez por defecto
  is_default BOOLEAN DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## FLUJO DE TRABAJO PROPUESTO

### Membresías

1. **Creación de Tipos de Membresía**
   - Admin crea tipos: Mensual, Trimestral, Anual, VIP, etc.
   - Define precio, duración, beneficios, descuentos

2. **Venta de Membresía**
   - Desde POS o módulo de Clientes
   - Seleccionar cliente → Seleccionar tipo de membresía
   - Procesar pago → Generar recibo
   - Registrar en `client_memberships`

3. **Uso de Membresía**
   - Al iniciar sesión o hacer compra, verificar membresía activa
   - Aplicar descuentos automáticos si aplica
   - Registrar uso en `membership_usage`

4. **Renovación**
   - Alertas automáticas 7 días antes del vencimiento
   - Proceso de renovación desde módulo de Clientes
   - Mantener historial en `membership_renewals`

5. **Reportes**
   - Membresías activas/vencidas/por vencer ✅ (ya implementado)
   - Ingresos por membresías
   - Uso promedio de membresías
   - Tasa de renovación

### Cotizaciones

1. **Crear Cotización**
   - Desde menú "Punto de Venta" → "Cotizaciones"
   - Seleccionar/crear cliente
   - Agregar productos/servicios
   - Aplicar descuentos
   - Establecer validez (ej: 15 días)
   - Guardar como borrador o enviar

2. **Gestionar Cotización**
   - Ver lista de cotizaciones (pendientes, aprobadas, vencidas)
   - Editar cotización en borrador
   - Enviar por email/WhatsApp
   - Imprimir PDF

3. **Convertir a Venta**
   - Cuando cliente aprueba, convertir cotización a venta
   - Copiar items a `sales` y `sale_items`
   - Marcar cotización como "convertida"
   - Vincular con `converted_to_sale_id`

4. **Seguimiento**
   - Dashboard con cotizaciones pendientes
   - Alertas de cotizaciones por vencer
   - Tasa de conversión (cotizaciones → ventas)

---

## UBICACIÓN EN MENÚ

### Punto de Venta (Expandir)

```
📍 Punto de Venta
  ├─ 💰 Venta Rápida (actual)
  ├─ 📋 Cotizaciones (NUEVO)
  │   ├─ Nueva Cotización
  │   ├─ Lista de Cotizaciones
  │   └─ Plantillas
  ├─ 🎫 Membresías (NUEVO)
  │   ├─ Vender Membresía
  │   ├─ Renovar Membresía
  │   └─ Tipos de Membresía
  └─ 📜 Historial de Ventas (actual)
```

### Clientes (Agregar)

```
👥 Clientes
  ├─ Lista de Clientes (actual)
  ├─ 🎫 Membresías del Cliente (NUEVO)
  │   └─ Ver membresías activas/historial
  └─ 📋 Cotizaciones del Cliente (NUEVO)
      └─ Ver cotizaciones enviadas
```

### Reportes (Ya implementados)

```
📊 Reportes
  └─ Clientes
      ├─ Membresías Activas ✅
      ├─ Membresías por Vencer ✅
      └─ Historial de Sesiones ✅
```

---

## COMPONENTES A CREAR

### Membresías

1. `MembershipTypes.tsx` - Gestión de tipos de membresía
2. `SellMembership.tsx` - Vender nueva membresía
3. `RenewMembership.tsx` - Renovar membresía existente
4. `ClientMemberships.tsx` - Ver membresías de un cliente
5. `MembershipUsageReport.tsx` - Reporte de uso

### Cotizaciones

1. `Quotations.tsx` - Lista de cotizaciones
2. `QuotationForm.tsx` - Crear/editar cotización
3. `QuotationDetail.tsx` - Ver detalle de cotización
4. `QuotationTemplates.tsx` - Gestión de plantillas
5. `ConvertToSale.tsx` - Convertir cotización a venta

---

## FUNCIONES API A CREAR

### Membresías

```javascript
// Tipos de membresía
getMembershipTypes();
createMembershipType(data);
updateMembershipType(id, data);
deleteMembershipType(id);

// Venta y renovación
sellMembership(clientId, membershipId, paymentData);
renewMembership(clientMembershipId, paymentData);
cancelMembership(clientMembershipId, reason);

// Uso
recordMembershipUsage(clientMembershipId, usageData);
getMembershipUsageHistory(clientMembershipId);

// Reportes
getMembershipRevenue(startDate, endDate);
getMembershipRenewalRate(startDate, endDate);
```

### Cotizaciones

```javascript
// CRUD
getQuotations(filters);
getQuotationById(id);
createQuotation(data);
updateQuotation(id, data);
deleteQuotation(id);

// Acciones
sendQuotation(id, method); // email, whatsapp
approveQuotation(id);
rejectQuotation(id, reason);
convertQuotationToSale(id, paymentData);

// Plantillas
getQuotationTemplates();
createQuotationTemplate(data);

// Reportes
getQuotationConversionRate(startDate, endDate);
getQuotationsByStatus(status);
```

---

## PRIORIZACIÓN DE IMPLEMENTACIÓN

### Fase 1: Mejoras a Membresías (1-2 días)

1. Agregar campos adicionales a tablas existentes
2. Crear tabla `membership_usage`
3. Crear componente `MembershipTypes.tsx`
4. Crear componente `SellMembership.tsx`
5. Integrar en menú POS

### Fase 2: Sistema de Cotizaciones (3-4 días)

1. Crear tablas de cotizaciones
2. Implementar funciones API
3. Crear componente `QuotationForm.tsx`
4. Crear componente `Quotations.tsx`
5. Implementar conversión a venta
6. Generación de PDF

### Fase 3: Funcionalidades Avanzadas (2-3 días)

1. Renovación automática de membresías
2. Plantillas de cotizaciones
3. Envío por email/WhatsApp
4. Reportes adicionales
5. Dashboard de cotizaciones

---

## BENEFICIOS

### Membresías Mejoradas

✅ Control completo del ciclo de vida
✅ Historial de renovaciones
✅ Análisis de uso y rentabilidad
✅ Alertas automáticas de vencimiento
✅ Descuentos automáticos en ventas

### Sistema de Cotizaciones

✅ Profesionalización del proceso de venta
✅ Seguimiento de oportunidades
✅ Conversión rápida a venta
✅ Historial de negociaciones
✅ Análisis de tasa de conversión
✅ Plantillas reutilizables

---

## ESTIMACIÓN TOTAL

- **Fase 1 (Membresías)**: 1-2 días
- **Fase 2 (Cotizaciones)**: 3-4 días
- **Fase 3 (Avanzado)**: 2-3 días
- **Total**: 6-9 días de desarrollo
