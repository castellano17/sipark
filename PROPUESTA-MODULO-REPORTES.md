# Módulo de Reportes - Sistema SIPARK

## Estructura del Módulo

El módulo de reportes estará organizado en 6 categorías principales con una interfaz moderna tipo dashboard con tarjetas.

---

## 1. 📊 REPORTES DE VENTAS

### 1.1 Ventas por Período

- **Descripción**: Reporte de ventas filtrado por rango de fechas
- **Datos**: Total ventas, cantidad de transacciones, ticket promedio
- **Filtros**: Fecha inicio, fecha fin, método de pago
- **Visualización**: Gráfico de líneas + tabla detallada
- **Exportar**: PDF, Excel

### 1.2 Ventas por Producto/Servicio

- **Descripción**: Productos más vendidos y menos vendidos
- **Datos**: Cantidad vendida, ingresos generados, % del total
- **Filtros**: Período, categoría de producto
- **Visualización**: Gráfico de barras + tabla ranking
- **Exportar**: PDF, Excel

### 1.3 Ventas por Cliente

- **Descripción**: Clientes con más compras y mayor gasto
- **Datos**: Total gastado, número de visitas, ticket promedio
- **Filtros**: Período, tipo de cliente (general/registrado)
- **Visualización**: Tabla con ranking + gráfico circular
- **Exportar**: PDF, Excel

### 1.4 Ventas por Método de Pago

- **Descripción**: Distribución de ventas por forma de pago
- **Datos**: Efectivo, tarjeta, transferencia
- **Filtros**: Período
- **Visualización**: Gráfico circular + tabla
- **Exportar**: PDF, Excel

### 1.5 Ventas por Hora del Día

- **Descripción**: Análisis de horas pico de ventas
- **Datos**: Ventas por franja horaria
- **Filtros**: Período, día de la semana
- **Visualización**: Gráfico de barras por hora
- **Exportar**: PDF, Excel

### 1.6 Comparativo de Ventas

- **Descripción**: Comparar ventas entre períodos
- **Datos**: Mes actual vs mes anterior, año actual vs año anterior
- **Visualización**: Gráficos comparativos + % de crecimiento
- **Exportar**: PDF, Excel

---

## 2. 💰 REPORTES CONTABLES/FINANCIEROS

### 2.1 Reporte de Caja

- **Descripción**: Detalle de apertura y cierre de caja
- **Datos**: Monto inicial, ventas, gastos, monto final, diferencias
- **Filtros**: Fecha, usuario que abrió/cerró
- **Visualización**: Tabla detallada con totales
- **Exportar**: PDF, Excel

### 2.2 Flujo de Efectivo

- **Descripción**: Entradas y salidas de dinero
- **Datos**: Ingresos por ventas, gastos registrados, saldo
- **Filtros**: Período
- **Visualización**: Gráfico de flujo + tabla
- **Exportar**: PDF, Excel

### 2.3 Ingresos vs Gastos

- **Descripción**: Comparativo de ingresos y egresos
- **Datos**: Total ingresos, total gastos, utilidad neta
- **Filtros**: Período
- **Visualización**: Gráfico de barras comparativo
- **Exportar**: PDF, Excel

### 2.4 Descuentos Aplicados

- **Descripción**: Reporte de descuentos otorgados
- **Datos**: Monto total descontado, % sobre ventas, cantidad de descuentos
- **Filtros**: Período, rango de descuento
- **Visualización**: Tabla + gráfico
- **Exportar**: PDF, Excel

### 2.5 Resumen Diario de Caja

- **Descripción**: Corte de caja diario simplificado
- **Datos**: Ventas del día, gastos, saldo
- **Visualización**: Formato de ticket/recibo
- **Exportar**: PDF (para imprimir)

---

## 3. 📦 REPORTES DE INVENTARIO

### 3.1 Stock Actual

- **Descripción**: Inventario actual de productos
- **Datos**: Producto, stock actual, precio, valor total
- **Filtros**: Categoría, stock bajo (alertas)
- **Visualización**: Tabla con alertas de stock bajo
- **Exportar**: PDF, Excel

### 3.2 Movimientos de Inventario

- **Descripción**: Historial de entradas y salidas
- **Datos**: Producto, tipo de movimiento, cantidad, fecha
- **Filtros**: Período, producto, tipo de movimiento
- **Visualización**: Tabla cronológica
- **Exportar**: PDF, Excel

### 3.3 Productos con Stock Bajo

- **Descripción**: Alertas de productos por agotarse
- **Datos**: Producto, stock actual, stock mínimo
- **Visualización**: Tabla con alertas rojas/amarillas
- **Exportar**: PDF, Excel

### 3.4 Valorización de Inventario

- **Descripción**: Valor total del inventario
- **Datos**: Costo total, valor de venta, margen potencial
- **Filtros**: Categoría
- **Visualización**: Tabla + totales
- **Exportar**: PDF, Excel

### 3.5 Productos Sin Movimiento

- **Descripción**: Productos que no se han vendido
- **Datos**: Producto, última venta, días sin movimiento
- **Filtros**: Período mínimo sin movimiento
- **Visualización**: Tabla ordenada por días
- **Exportar**: PDF, Excel

### 3.6 Ajustes de Inventario

- **Descripción**: Historial de ajustes manuales
- **Datos**: Producto, tipo de ajuste, cantidad, razón, usuario
- **Filtros**: Período, tipo de ajuste
- **Visualización**: Tabla con detalles
- **Exportar**: PDF, Excel

---

## 4. 🛒 REPORTES DE COMPRAS

### 4.1 Compras por Período

- **Descripción**: Resumen de compras a proveedores
- **Datos**: Total comprado, número de órdenes, ticket promedio
- **Filtros**: Período, proveedor
- **Visualización**: Gráfico + tabla
- **Exportar**: PDF, Excel

### 4.2 Compras por Proveedor

- **Descripción**: Ranking de proveedores
- **Datos**: Proveedor, total comprado, número de órdenes
- **Filtros**: Período
- **Visualización**: Tabla ranking + gráfico
- **Exportar**: PDF, Excel

### 4.3 Productos Más Comprados

- **Descripción**: Productos con mayor reposición
- **Datos**: Producto, cantidad comprada, costo total
- **Filtros**: Período
- **Visualización**: Tabla + gráfico de barras
- **Exportar**: PDF, Excel

### 4.4 Historial de Órdenes de Compra

- **Descripción**: Detalle de todas las órdenes
- **Datos**: Número de orden, proveedor, fecha, total, items
- **Filtros**: Período, proveedor
- **Visualización**: Tabla detallada
- **Exportar**: PDF, Excel

---

## 5. 👥 REPORTES DE CLIENTES

### 5.1 Clientes Activos

- **Descripción**: Clientes con actividad reciente
- **Datos**: Nombre, última visita, total gastado, visitas
- **Filtros**: Período de actividad
- **Visualización**: Tabla
- **Exportar**: PDF, Excel

### 5.2 Clientes Frecuentes

- **Descripción**: Clientes con más visitas
- **Datos**: Nombre, número de visitas, gasto promedio
- **Filtros**: Período, mínimo de visitas
- **Visualización**: Tabla ranking
- **Exportar**: PDF, Excel

### 5.3 Clientes Top (Mayor Gasto)

- **Descripción**: Clientes que más gastan
- **Datos**: Nombre, total gastado, ticket promedio
- **Filtros**: Período, top N clientes
- **Visualización**: Tabla + gráfico
- **Exportar**: PDF, Excel

### 5.4 Clientes Inactivos

- **Descripción**: Clientes sin actividad reciente
- **Datos**: Nombre, última visita, días sin actividad
- **Filtros**: Días mínimos de inactividad
- **Visualización**: Tabla
- **Exportar**: PDF, Excel

### 5.5 Nuevos Clientes

- **Descripción**: Clientes registrados recientemente
- **Datos**: Nombre, fecha de registro, primera compra
- **Filtros**: Período
- **Visualización**: Tabla
- **Exportar**: PDF, Excel

### 5.6 Membresías Activas

- **Descripción**: Estado de membresías
- **Datos**: Cliente, tipo de membresía, fecha inicio/fin, estado
- **Filtros**: Estado, tipo de membresía
- **Visualización**: Tabla con alertas de vencimiento
- **Exportar**: PDF, Excel

### 5.7 Membresías por Vencer

- **Descripción**: Membresías próximas a expirar
- **Datos**: Cliente, tipo, fecha de vencimiento, días restantes
- **Filtros**: Días antes del vencimiento
- **Visualización**: Tabla con alertas
- **Exportar**: PDF, Excel

---

## 6. ⏱️ REPORTES DE OPERACIONES/TIEMPOS

### 6.1 Sesiones por Período

- **Descripción**: Resumen de sesiones de juego
- **Datos**: Total sesiones, tiempo promedio, ingresos
- **Filtros**: Período, paquete
- **Visualización**: Gráfico + tabla
- **Exportar**: PDF, Excel

### 6.2 Paquetes Más Vendidos

- **Descripción**: Ranking de paquetes de tiempo
- **Datos**: Paquete, cantidad vendida, ingresos
- **Filtros**: Período
- **Visualización**: Gráfico de barras + tabla
- **Exportar**: PDF, Excel

### 6.3 Ocupación por Hora

- **Descripción**: Análisis de ocupación del local
- **Datos**: Sesiones activas por franja horaria
- **Filtros**: Período, día de la semana
- **Visualización**: Mapa de calor por hora
- **Exportar**: PDF, Excel

### 6.4 Duración Promedio de Sesiones

- **Descripción**: Tiempo promedio de permanencia
- **Datos**: Duración promedio, mínima, máxima
- **Filtros**: Período, paquete
- **Visualización**: Gráfico + estadísticas
- **Exportar**: PDF, Excel

### 6.5 Historial de Sesiones

- **Descripción**: Detalle de todas las sesiones
- **Datos**: Cliente, fecha, hora inicio/fin, duración, paquete
- **Filtros**: Período, cliente, estado
- **Visualización**: Tabla detallada
- **Exportar**: PDF, Excel

---

## 7. 🔐 REPORTES DE AUDITORÍA

### 7.1 Actividad de Usuarios

- **Descripción**: Acciones realizadas por usuarios del sistema
- **Datos**: Usuario, acción, fecha/hora, detalles
- **Filtros**: Período, usuario, tipo de acción
- **Visualización**: Tabla cronológica
- **Exportar**: PDF, Excel

### 7.2 Cambios en Inventario

- **Descripción**: Auditoría de modificaciones de stock
- **Datos**: Producto, usuario, tipo de cambio, cantidad, razón
- **Filtros**: Período, usuario, producto
- **Visualización**: Tabla detallada
- **Exportar**: PDF, Excel

### 7.3 Modificaciones de Precios

- **Descripción**: Historial de cambios de precios
- **Datos**: Producto, precio anterior, precio nuevo, usuario, fecha
- **Filtros**: Período, producto
- **Visualización**: Tabla
- **Exportar**: PDF, Excel

### 7.4 Accesos al Sistema

- **Descripción**: Log de inicios de sesión
- **Datos**: Usuario, fecha/hora, IP, resultado (éxito/fallo)
- **Filtros**: Período, usuario
- **Visualización**: Tabla
- **Exportar**: PDF, Excel

### 7.5 Ventas Canceladas/Modificadas

- **Descripción**: Ventas con cambios o anulaciones
- **Datos**: Venta, usuario, acción, razón, fecha
- **Filtros**: Período, usuario
- **Visualización**: Tabla
- **Exportar**: PDF, Excel

---

## 8. 📈 DASHBOARD EJECUTIVO

### Panel Principal con KPIs

- **Ventas del Día**: Total, cantidad, ticket promedio
- **Ventas del Mes**: Total, comparativo mes anterior
- **Clientes Atendidos**: Hoy, esta semana, este mes
- **Productos con Stock Bajo**: Alertas
- **Caja Actual**: Estado, saldo
- **Top 5 Productos**: Más vendidos del mes
- **Gráfico de Ventas**: Últimos 30 días
- **Ocupación Actual**: Sesiones activas

---

## DISEÑO DE INTERFAZ

### Página Principal de Reportes

```
┌─────────────────────────────────────────────────────────┐
│  📊 REPORTES Y ANÁLISIS                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [🔍 Buscar reporte...]                    [📅 Período] │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  📊 VENTAS   │  │  💰 CONTABLE │  │  📦 INVENTAR │ │
│  │              │  │              │  │              │ │
│  │  12 reportes │  │  5 reportes  │  │  6 reportes  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  🛒 COMPRAS  │  │  👥 CLIENTES │  │  ⏱️ OPERAC.  │ │
│  │              │  │              │  │              │ │
│  │  4 reportes  │  │  7 reportes  │  │  5 reportes  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  🔐 AUDITORÍA│  │  📈 DASHBOARD│                    │
│  │              │  │              │                    │
│  │  5 reportes  │  │  Ejecutivo   │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                          │
│  📌 REPORTES FAVORITOS                                  │
│  • Ventas del Día                                       │
│  • Stock Bajo                                           │
│  • Clientes Top                                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Vista de Reporte Individual

```
┌─────────────────────────────────────────────────────────┐
│  ← Volver   📊 Ventas por Período                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FILTROS:                                               │
│  [📅 01/01/2026] - [📅 31/01/2026]  [Aplicar] [Limpiar]│
│  [💳 Todos los métodos ▼]                               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  RESUMEN                                           │ │
│  │  Total Ventas: C$45,230.00  ↑ 15% vs mes anterior │ │
│  │  Transacciones: 234         Ticket Prom: C$193.29 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [GRÁFICO DE LÍNEAS - Ventas por día]                  │
│                                                          │
│  DETALLE POR DÍA:                                       │
│  ┌──────┬────────────┬──────────┬─────────────────┐   │
│  │ Día  │ Ventas     │ Trans.   │ Ticket Prom     │   │
│  ├──────┼────────────┼──────────┼─────────────────┤   │
│  │ 01   │ C$1,450.00 │ 8        │ C$181.25        │   │
│  │ 02   │ C$1,890.00 │ 12       │ C$157.50        │   │
│  │ ...  │ ...        │ ...      │ ...             │   │
│  └──────┴────────────┴──────────┴─────────────────┘   │
│                                                          │
│  [📄 Exportar PDF]  [📊 Exportar Excel]  [🖨️ Imprimir] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## CARACTERÍSTICAS TÉCNICAS

### Funcionalidades Generales

- ✅ Filtros dinámicos por fecha, categoría, usuario, etc.
- ✅ Exportación a PDF y Excel
- ✅ Gráficos interactivos (Chart.js o Recharts)
- ✅ Impresión directa
- ✅ Guardar reportes favoritos
- ✅ Programar reportes automáticos (futuro)
- ✅ Envío por email (futuro)
- ✅ Responsive design

### Stack Tecnológico Sugerido

- **Gráficos**: Recharts (ya compatible con React)
- **Exportación PDF**: jsPDF + jsPDF-AutoTable
- **Exportación Excel**: xlsx o exceljs
- **Tablas**: TanStack Table (React Table v8)
- **Filtros de Fecha**: react-datepicker
- **Iconos**: Lucide React (ya en uso)

---

## PRIORIZACIÓN DE IMPLEMENTACIÓN

### Fase 1 (Esencial)

1. Dashboard Ejecutivo
2. Ventas por Período
3. Reporte de Caja
4. Stock Actual
5. Clientes Top

### Fase 2 (Importante)

6. Ventas por Producto
7. Flujo de Efectivo
8. Movimientos de Inventario
9. Compras por Período
10. Sesiones por Período

### Fase 3 (Complementario)

11. Resto de reportes de ventas
12. Resto de reportes de clientes
13. Reportes de auditoría
14. Reportes avanzados

---

## ESTIMACIÓN DE DESARROLLO

- **Estructura base del módulo**: 2-3 días
- **Dashboard ejecutivo**: 2 días
- **Cada reporte simple**: 0.5-1 día
- **Cada reporte con gráficos**: 1-2 días
- **Sistema de exportación**: 1-2 días
- **Total estimado Fase 1**: 8-10 días
- **Total estimado completo**: 20-25 días

---

## BENEFICIOS

✅ Toma de decisiones basada en datos
✅ Identificación de productos rentables
✅ Control de inventario eficiente
✅ Análisis de comportamiento de clientes
✅ Detección de fraudes o irregularidades
✅ Optimización de horarios y recursos
✅ Cumplimiento de auditorías
✅ Proyecciones y planificación
