Especificaciones de Interfaz: Sistema POS Ludoteca Local

1. Estructura de Layout Maestro (Windows Desktop)
   Sidebar (Izquierdo): Menú colapsable con iconos claros. Navegación principal.

Main Content (Centro): Área dinámica donde se cargan los módulos.

Status Bar (Inferior): Indicador de estado de la base de datos (SQLite), usuario activo, estado de la impresora térmica y reloj del sistema.

2. Jerarquía de Menús y Pantallas
   A. Módulo de Operaciones (El "Corazón")
   Dashboard de Tiempos:

Visualización de Tarjetas de Usuarios Activos. Cada tarjeta tiene: Foto, Nombre, Hora de entrada, Tiempo transcurrido (Cronómetro dinámico) y Alerta visual si se acabó el tiempo.

Botón de "Entrada Rápida" (Check-in).

Botón de "Check-out" (Calcula tiempo extra y manda a facturación).

Calendario de Eventos:

Vista mensual/semanal para reservaciones de cumpleaños y eventos privados.

B. Módulo Comercial y Ventas
Punto de Venta (POS):

Venta de productos (snacks, bebidas), servicios y paquetes.

Gestión de Membresías (activación, vencimiento y beneficios).

Caja (Cash Management):

Apertura y cierre de caja.

Registro de entradas y salidas de efectivo (gastos menores).

C. Gestión de Datos (Administración)
Clientes: Directorio con búsquedas avanzadas, historial de visitas y gestión de saldos.

Inventario y Servicios: Configuración de precios por hora, fracciones de tiempo, productos físicos y paquetes promocionales.

Reportes y Estadísticas:

Dashboard con gráficas en tiempo real (Ingresos del día, ocupación actual).

Reportes contables descargables (PDF/Excel local).

D. Configuración del Sistema
Usuarios y Seguridad: Gestión de roles (Admin, Cajero, Monitor) y permisos específicos.

Perfil de Empresa: Logo, NIT/RUC, dirección y datos para la factura.

Hardware Local: Configuración de la impresora térmica (puerto COM/USB) y formato del ticket.

3. Flujo de Trabajo Recomendado para el Operador
   Check-in: El operador busca al cliente (o lo crea), selecciona el servicio/paquete y el sistema inicia el cronómetro.

Monitoreo: El Dashboard muestra en tiempo real quién está en el área de juego.

Check-out: Al salir, el sistema detecta si hay cargos extra por tiempo o consumos adicionales.

Finalización: Se genera la factura/ticket y se imprime automáticamente en la térmica.

4. Consideraciones Técnicas para Kiro (Stack Local)
   Frontend: React/Vue dentro de Electron.

Base de Datos: SQLite3 (Archivo local .db en la carpeta del usuario).

Cronómetros: Deben persistir en la base de datos. Si la app se cierra, al abrirla el tiempo debe seguir calculándose correctamente basado en la hora de entrada.
