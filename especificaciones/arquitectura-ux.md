# Arquitectura UX - Sistema POS Ludoteca

## 1. ESTRUCTURA DE LAYOUT MAESTRO

```
┌─────────────────────────────────────────────────────────────┐
│                    BARRA DE TÍTULO                          │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ SIDEBAR  │           MAIN CONTENT AREA                      │
│ (Menú    │         (Módulos Dinámicos)                      │
│ Vertical)│                                                  │
│          │                                                  │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│ STATUS BAR: [DB Status] | [Usuario: Admin] | [Impresora OK] │
│ [Caja: Abierta] | [Hora: 14:32] | [Conexión: Online]       │
└─────────────────────────────────────────────────────────────┘
```

### Componentes:

**SIDEBAR (Izquierdo - 250px)**

- Colapsable con toggle button
- Iconos + Texto (expandido) o solo iconos (colapsado)
- Scroll interno si hay muchos items
- Highlight del módulo activo
- Logo/Nombre empresa en header

**MAIN CONTENT (Centro - Flexible)**

- Área dinámica donde se cargan pantallas
- Breadcrumb de navegación
- Transiciones suaves entre módulos

**STATUS BAR (Inferior - 40px)**

- Información en tiempo real
- Indicadores visuales (colores: verde=OK, rojo=error, amarillo=alerta)
- Reloj sincronizado con sistema

---

## 2. JERARQUÍA DE MENÚS (SIDEBAR)

### NIVEL 1: Menú Principal (Iconos + Etiquetas)

```
📊 DASHBOARD
├─ 🎮 OPERACIONES
├─ 💳 PUNTO DE VENTA
├─ 👥 CLIENTES
├─ 📦 INVENTARIO
├─ 📈 REPORTES
├─ ⚙️ CONFIGURACIÓN
└─ 🚪 SALIR
```

---

## 3. ESTRUCTURA DETALLADA DE MENÚS Y SUBMENÚS

### 📊 DASHBOARD (Pantalla de Inicio)

**Propósito:** Vista general del negocio en tiempo real
**Acceso:** Todos los roles
**Submenús:** Ninguno (es una pantalla única)

---

### 🎮 OPERACIONES (Corazón del Sistema)

**Propósito:** Gestión de usuarios activos y eventos
**Acceso:** Admin, Monitor, Cajero

**Submenús:**

```
🎮 OPERACIONES
├─ ⏱️ Dashboard de Tiempos
│  └─ Tarjetas de usuarios activos
│  └─ Check-in rápido
│  └─ Check-out
├─ 📅 Calendario de Eventos
│  └─ Vista mensual/semanal
│  └─ Crear evento
│  └─ Editar reservación
└─ 🔔 Alertas de Tiempo
   └─ Usuarios con tiempo próximo a vencer
```

**Pantallas Principales:**

1. **Dashboard de Tiempos** - Grid de tarjetas con cronómetros
2. **Detalle de Usuario** - Modal/panel con info completa
3. **Calendario de Eventos** - Vista calendario interactiva

---

### 💳 PUNTO DE VENTA (Comercial)

**Propósito:** Ventas y gestión de caja
**Acceso:** Admin, Cajero

**Submenús:**

```
💳 PUNTO DE VENTA
├─ 🛒 Nueva Venta
│  └─ Seleccionar cliente
│  └─ Agregar productos/servicios
│  └─ Aplicar descuentos
│  └─ Procesar pago
├─ 💰 Gestión de Caja
│  └─ Apertura de caja
│  └─ Cierre de caja
│  └─ Registro de gastos
│  └─ Historial de movimientos
├─ 🎟️ Membresías
│  └─ Activar membresía
│  └─ Renovar membresía
│  └─ Ver beneficios
└─ 🧾 Historial de Ventas
   └─ Búsqueda por fecha/cliente
   └─ Reimpresión de tickets
```

**Pantallas Principales:**

1. **POS - Nueva Venta** - Interfaz de caja (carrito, cliente, pago)
2. **Gestión de Caja** - Apertura/cierre y movimientos
3. **Membresías** - Activación y renovación
4. **Historial de Ventas** - Tabla con búsqueda

---

### 👥 CLIENTES (Gestión de Datos)

**Propósito:** Directorio y gestión de clientes
**Acceso:** Admin, Cajero, Monitor

**Submenús:**

```
👥 CLIENTES
├─ 📋 Directorio
│  └─ Búsqueda avanzada
│  └─ Filtros (activos, inactivos, VIP)
│  └─ Crear cliente
├─ 📊 Historial de Visitas
│  └─ Gráfica de asistencia
│  └─ Últimas 10 visitas
├─ 💵 Gestión de Saldos
│  └─ Clientes con saldo pendiente
│  └─ Registrar pago
└─ 🏷️ Etiquetas/Categorías
   └─ VIP, Cumpleaños próximo, etc.
```

**Pantallas Principales:**

1. **Directorio de Clientes** - Tabla con búsqueda y filtros
2. **Perfil de Cliente** - Detalle completo + historial
3. **Gestión de Saldos** - Tabla de deudores

---

### 📦 INVENTARIO (Configuración de Servicios)

**Propósito:** Gestión de productos, servicios y paquetes
**Acceso:** Admin

**Submenús:**

```
📦 INVENTARIO
├─ 🎮 Servicios de Juego
│  └─ Configurar precios por hora
│  └─ Fracciones de tiempo (30min, 1h, etc.)
│  └─ Paquetes promocionales
├─ 🍔 Productos Físicos
│  └─ Snacks y bebidas
│  └─ Stock actual
│  └─ Alertas de bajo stock
├─ 📦 Paquetes
│  └─ Crear paquete
│  └─ Editar paquete
│  └─ Descuentos por volumen
└─ 🏷️ Categorías
   └─ Gestionar categorías
```

**Pantallas Principales:**

1. **Servicios de Juego** - Tabla de configuración
2. **Productos** - Inventario con stock
3. **Paquetes** - Gestión de combos

---

### 📈 REPORTES (Análisis y Estadísticas)

**Propósito:** Análisis de negocio
**Acceso:** Admin

**Submenús:**

```
📈 REPORTES
├─ 📊 Dashboard Financiero
│  └─ Ingresos del día
│  └─ Ingresos del mes
│  └─ Comparativa mes anterior
├─ 👥 Ocupación y Asistencia
│  └─ Ocupación actual
│  └─ Pico de horas
│  └─ Clientes nuevos vs recurrentes
├─ 💰 Reportes Contables
│  └─ Descargar PDF
│  └─ Descargar Excel
│  └─ Rango de fechas personalizado
└─ 🎂 Eventos y Cumpleaños
   └─ Próximos eventos
   └─ Historial de eventos
```

**Pantallas Principales:**

1. **Dashboard Financiero** - Gráficas en tiempo real
2. **Ocupación** - Gráficas de asistencia
3. **Reportes Descargables** - Generador de reportes

---

### ⚙️ CONFIGURACIÓN (Sistema)

**Propósito:** Administración del sistema
**Acceso:** Admin

**Submenús:**

```
⚙️ CONFIGURACIÓN
├─ 👤 Usuarios y Seguridad
│  └─ Crear usuario
│  └─ Editar usuario
│  └─ Gestionar roles (Admin, Cajero, Monitor)
│  └─ Permisos específicos
├─ 🏢 Perfil de Empresa
│  └─ Logo
│  └─ NIT/RUC
│  └─ Dirección
│  └─ Datos para factura
├─ 🖨️ Hardware Local
│  └─ Configurar impresora térmica
│  └─ Puerto COM/USB
│  └─ Formato de ticket
│  └─ Prueba de impresión
├─ 💾 Base de Datos
│  └─ Backup manual
│  └─ Restaurar backup
│  └─ Ubicación de BD
└─ 🔐 Seguridad
   └─ Cambiar contraseña
   └─ Logs de actividad
   └─ Auditoría
```

**Pantallas Principales:**

1. **Gestión de Usuarios** - Tabla de usuarios
2. **Perfil de Empresa** - Formulario de datos
3. **Configuración de Hardware** - Impresora y puertos
4. **Backup y Restauración** - Gestión de BD

---

## 4. PANTALLAS PRINCIPALES DEL SISTEMA

| #   | Pantalla                  | Módulo         | Propósito                    | Acceso                 |
| --- | ------------------------- | -------------- | ---------------------------- | ---------------------- |
| 1   | Dashboard                 | Dashboard      | Vista general en tiempo real | Todos                  |
| 2   | Dashboard de Tiempos      | Operaciones    | Cronómetros activos          | Admin, Monitor, Cajero |
| 3   | Calendario de Eventos     | Operaciones    | Reservaciones                | Admin, Monitor, Cajero |
| 4   | POS - Nueva Venta         | Punto de Venta | Procesar ventas              | Admin, Cajero          |
| 5   | Gestión de Caja           | Punto de Venta | Apertura/cierre              | Admin, Cajero          |
| 6   | Membresías                | Punto de Venta | Activar/renovar              | Admin, Cajero          |
| 7   | Historial de Ventas       | Punto de Venta | Búsqueda de tickets          | Admin, Cajero          |
| 8   | Directorio de Clientes    | Clientes       | Listado y búsqueda           | Todos                  |
| 9   | Perfil de Cliente         | Clientes       | Detalle + historial          | Todos                  |
| 10  | Gestión de Saldos         | Clientes       | Deudores                     | Admin, Cajero          |
| 11  | Servicios de Juego        | Inventario     | Configuración                | Admin                  |
| 12  | Productos                 | Inventario     | Stock                        | Admin                  |
| 13  | Paquetes                  | Inventario     | Combos                       | Admin                  |
| 14  | Dashboard Financiero      | Reportes       | Gráficas ingresos            | Admin                  |
| 15  | Ocupación                 | Reportes       | Asistencia                   | Admin                  |
| 16  | Reportes Descargables     | Reportes       | PDF/Excel                    | Admin                  |
| 17  | Gestión de Usuarios       | Configuración  | CRUD usuarios                | Admin                  |
| 18  | Perfil de Empresa         | Configuración  | Datos empresa                | Admin                  |
| 19  | Configuración de Hardware | Configuración  | Impresora                    | Admin                  |
| 20  | Backup y Restauración     | Configuración  | BD                           | Admin                  |

---

## 5. FLUJO DE TRABAJO OPTIMIZADO (UX)

### Escenario 1: Cliente Entra a Jugar

```
1. Operador abre Dashboard de Tiempos
2. Hace clic en "Entrada Rápida" o busca cliente
3. Sistema abre modal de check-in
4. Selecciona servicio/paquete
5. Confirma → Cronómetro inicia
6. Tarjeta aparece en grid con tiempo en vivo
```

### Escenario 2: Cliente Se Va

```
1. Operador ve tarjeta del cliente en Dashboard
2. Hace clic en "Check-out"
3. Sistema calcula tiempo extra (si aplica)
4. Muestra resumen de cargos
5. Redirige a POS para pago
6. Genera ticket y lo imprime
7. Tarjeta desaparece del grid
```

### Escenario 3: Venta de Productos

```
1. Operador abre POS - Nueva Venta
2. Busca/selecciona cliente
3. Agrega productos al carrito
4. Aplica descuentos si aplica
5. Selecciona método de pago
6. Confirma → Imprime ticket
7. Venta registrada en historial
```

---

## 6. CONSIDERACIONES DE DISEÑO UX

### Prioridades de Acceso (Frecuencia de Uso)

1. **Dashboard de Tiempos** - Acceso más rápido (botón destacado)
2. **POS - Nueva Venta** - Segundo acceso más rápido
3. **Directorio de Clientes** - Búsqueda global visible
4. **Gestión de Caja** - Acceso rápido desde status bar

### Indicadores Visuales

- **Cronómetros:** Cambio de color según tiempo restante (verde → amarillo → rojo)
- **Alertas:** Notificaciones en tiempo real para tiempos próximos a vencer
- **Status Bar:** Indicadores de estado con colores (verde=OK, rojo=error)

### Atajos de Teclado Recomendados

- `Ctrl+N` - Nueva venta
- `Ctrl+E` - Entrada rápida
- `Ctrl+S` - Salir/Check-out
- `Ctrl+F` - Buscar cliente
- `Ctrl+P` - Imprimir

### Responsive Design

- Sidebar colapsable en pantallas pequeñas
- Grid de tarjetas adaptable
- Tablas con scroll horizontal si es necesario

---

## 7. ESTRUCTURA DE DATOS EN STATUS BAR

```
[🟢 BD: Conectada] | [👤 Usuario: Juan (Admin)] |
[🖨️ Impresora: Conectada] | [💰 Caja: Abierta] |
[🕐 14:32:45] | [📡 Online]
```

Cada indicador es clickeable para acceder a su configuración rápida.

---

## 8. RESUMEN EJECUTIVO

**Estructura Óptima para Ludoteca:**

- **Sidebar:** 7 módulos principales + Salir
- **Pantallas:** 20 pantallas especializadas
- **Flujo Principal:** Dashboard → Operaciones → POS → Reportes
- **Roles:** Admin, Cajero, Monitor (permisos granulares)
- **Prioridad UX:** Velocidad en check-in/check-out y ventas
