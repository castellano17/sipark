# Requirements Document

## Introduction

Este documento define los requisitos para expandir el sistema de membresías de SIPARK con tres características principales: suspensión/congelamiento de membresías, descuentos y promociones, y beneficios y restricciones. Estas mejoras permitirán mayor flexibilidad en la gestión de membresías, aumentar la retención de clientes mediante programas de referidos, y controlar mejor el acceso según el tipo de membresía.

## Glossary

- **System**: El sistema de gestión de membresías de SIPARK (aplicación Electron con React y PostgreSQL)
- **Membership**: Una membresía activa asignada a un cliente
- **Suspension**: Pausa temporal de una membresía que extiende su fecha de vencimiento
- **Promotion**: Oferta especial que aplica descuentos a la compra o renovación de membresías
- **Promo_Code**: Código alfanumérico único que activa una promoción específica
- **Referral**: Sistema de referidos donde un cliente existente recomienda nuevos clientes
- **Benefit**: Ventaja o privilegio asociado a un tipo de membresía
- **Restriction**: Limitación de acceso o uso asociada a un tipo de membresía
- **Blackout_Date**: Fecha en la que ciertos tipos de membresías no tienen acceso
- **Zone**: Área o sección específica del centro de entretenimiento
- **Guest_Privilege**: Permiso para que un miembro traiga invitados
- **Client**: Usuario que posee una o más membresías
- **Cash_Box**: Sistema de caja registradora integrado para transacciones

## Requirements

### Requirement 1: Suspender Membresía

**User Story:** Como administrador, quiero poder suspender temporalmente una membresía de un cliente, para que el cliente pueda pausar su membresía durante vacaciones o enfermedad sin perder días pagados.

#### Acceptance Criteria

1. WHEN un administrador solicita suspender una membresía activa, THE System SHALL registrar la fecha de inicio de suspensión
2. WHEN una membresía es suspendida, THE System SHALL cambiar el estado de la membresía a "suspended"
3. WHEN una membresía es suspendida, THE System SHALL requerir una razón de suspensión del conjunto: "vacation", "illness", "personal", "other"
4. WHEN la razón es "other", THE System SHALL requerir una descripción adicional
5. IF una membresía ya está suspendida, THEN THE System SHALL rechazar nuevas solicitudes de suspensión
6. IF una membresía está vencida o cancelada, THEN THE System SHALL rechazar la solicitud de suspensión
7. WHERE el tipo de membresía define max_suspension_days, THE System SHALL validar que la suspensión solicitada no exceda este límite
8. WHEN una suspensión es registrada, THE System SHALL crear un registro en la tabla membership_suspensions con todos los detalles

### Requirement 2: Reanudar Membresía Suspendida

**User Story:** Como administrador, quiero poder reanudar una membresía suspendida, para que el cliente pueda volver a usar sus beneficios y la fecha de vencimiento se extienda por los días suspendidos.

#### Acceptance Criteria

1. WHEN un administrador solicita reanudar una membresía suspendida, THE System SHALL calcular los días totales de suspensión
2. WHEN una membresía es reanudada, THE System SHALL extender la fecha de vencimiento sumando los días suspendidos
3. WHEN una membresía es reanudada, THE System SHALL cambiar el estado de la membresía a "active"
4. WHEN una membresía es reanudada, THE System SHALL registrar la fecha de fin de suspensión en membership_suspensions
5. IF una membresía no está suspendida, THEN THE System SHALL rechazar la solicitud de reanudación
6. THE System SHALL mantener un historial completo de todas las suspensiones y reanudaciones

### Requirement 3: Validar Límites de Suspensión

**User Story:** Como administrador del sistema, quiero que cada tipo de membresía tenga límites de suspensión configurables, para que se controle el uso del beneficio de suspensión.

#### Acceptance Criteria

1. THE System SHALL permitir configurar max_suspension_days por tipo de membresía
2. THE System SHALL permitir configurar max_suspensions_per_year por tipo de membresía
3. WHEN se solicita una suspensión, THE System SHALL validar que no se exceda max_suspension_days
4. WHEN se solicita una suspensión, THE System SHALL validar que no se exceda max_suspensions_per_year
5. IF se exceden los límites, THEN THE System SHALL rechazar la suspensión con un mensaje descriptivo
6. WHERE max_suspension_days es NULL, THE System SHALL permitir suspensiones ilimitadas en duración
7. WHERE max_suspensions_per_year es NULL, THE System SHALL permitir suspensiones ilimitadas en frecuencia

### Requirement 4: Crear Promoción

**User Story:** Como administrador, quiero crear promociones con descuentos y condiciones, para que pueda ofrecer ofertas especiales a los clientes.

#### Acceptance Criteria

1. THE System SHALL permitir crear promociones con nombre, descripción y tipo de descuento
2. THE System SHALL soportar tipos de descuento: "percentage", "fixed_amount", "2x1", "family_discount"
3. WHEN el tipo es "percentage", THE System SHALL requerir un valor entre 0 y 100
4. WHEN el tipo es "fixed_amount", THE System SHALL requerir un monto positivo
5. THE System SHALL permitir definir fecha de inicio y fecha de fin para cada promoción
6. THE System SHALL permitir definir tipos de membresía aplicables a la promoción
7. THE System SHALL permitir definir un límite máximo de usos por promoción
8. THE System SHALL permitir definir un límite de usos por cliente
9. THE System SHALL generar automáticamente un promo_code único si no se proporciona uno
10. WHEN se proporciona un promo_code, THE System SHALL validar que sea único en el sistema

### Requirement 5: Aplicar Promoción en Venta

**User Story:** Como vendedor, quiero aplicar promociones durante la venta de membresías, para que los clientes reciban los descuentos correspondientes.

#### Acceptance Criteria

1. WHEN un vendedor ingresa un promo_code durante una venta, THE System SHALL validar que el código existe
2. WHEN un promo_code es válido, THE System SHALL verificar que la promoción esté activa (dentro del período de validez)
3. WHEN una promoción está activa, THE System SHALL verificar que no se haya alcanzado el límite de usos
4. WHEN un cliente usa una promoción, THE System SHALL verificar que no haya excedido el límite de usos por cliente
5. WHEN todas las validaciones pasan, THE System SHALL calcular el descuento según el tipo de promoción
6. WHEN el tipo es "percentage", THE System SHALL aplicar el porcentaje de descuento al precio base
7. WHEN el tipo es "fixed_amount", THE System SHALL restar el monto fijo del precio base
8. WHEN el tipo es "2x1", THE System SHALL aplicar 50% de descuento al precio base
9. WHEN una promoción es aplicada, THE System SHALL registrar el uso en promotion_usage
10. WHEN una promoción es aplicada, THE System SHALL incrementar el contador de usos
11. IF alguna validación falla, THEN THE System SHALL mostrar un mensaje de error descriptivo

### Requirement 6: Sistema de Referidos

**User Story:** Como cliente existente, quiero poder referir nuevos clientes y recibir descuentos, para que ambos obtengamos beneficios.

#### Acceptance Criteria

1. THE System SHALL generar un código de referido único para cada cliente al crear su cuenta
2. WHEN un nuevo cliente se registra con un código de referido, THE System SHALL validar que el código existe
3. WHEN un código de referido es válido, THE System SHALL asociar el nuevo cliente con el referidor
4. WHEN un cliente referido compra su primera membresía, THE System SHALL crear un crédito de descuento para el referidor
5. THE System SHALL permitir configurar el monto o porcentaje de descuento por referido exitoso
6. THE System SHALL permitir configurar el descuento para el cliente referido en su primera compra
7. WHEN un referidor acumula créditos, THE System SHALL permitir aplicarlos en su próxima renovación
8. THE System SHALL mantener un registro de todos los referidos y sus estados
9. THE System SHALL mostrar el balance de créditos de referido en el perfil del cliente

### Requirement 7: Configurar Beneficios de Membresía

**User Story:** Como administrador, quiero configurar beneficios específicos por tipo de membresía, para que cada nivel ofrezca ventajas diferenciadas.

#### Acceptance Criteria

1. THE System SHALL permitir configurar horarios permitidos por tipo de membresía
2. THE System SHALL permitir configurar límite de visitas por mes por tipo de membresía
3. THE System SHALL permitir configurar límite de visitas por semana por tipo de membresía
4. THE System SHALL permitir configurar zonas accesibles por tipo de membresía
5. THE System SHALL permitir configurar descuentos en productos por tipo de membresía
6. THE System SHALL permitir configurar descuentos en servicios por tipo de membresía
7. THE System SHALL permitir configurar número de invitados permitidos por tipo de membresía
8. THE System SHALL almacenar todos los beneficios en formato estructurado en la tabla membership_benefits

### Requirement 8: Validar Horarios Permitidos

**User Story:** Como sistema de control de acceso, quiero validar que un cliente acceda solo en horarios permitidos por su membresía, para que se respeten las restricciones de cada tipo de membresía.

#### Acceptance Criteria

1. WHEN un cliente intenta acceder, THE System SHALL obtener los horarios permitidos de su tipo de membresía
2. WHEN existen horarios configurados, THE System SHALL validar que la hora actual esté dentro del rango permitido
3. IF la hora actual no está en el rango permitido, THEN THE System SHALL rechazar el acceso con mensaje descriptivo
4. WHERE no hay horarios configurados, THE System SHALL permitir acceso en cualquier horario
5. THE System SHALL soportar múltiples rangos horarios por día de la semana
6. THE System SHALL soportar configuración diferente para días laborables y fines de semana

### Requirement 9: Validar Límites de Visitas

**User Story:** Como sistema de control de acceso, quiero validar que un cliente no exceda sus límites de visitas, para que se respeten las restricciones de cada tipo de membresía.

#### Acceptance Criteria

1. WHEN un cliente intenta acceder, THE System SHALL contar las visitas del mes actual
2. WHEN existe un límite mensual, THE System SHALL validar que no se haya excedido
3. WHEN un cliente intenta acceder, THE System SHALL contar las visitas de la semana actual
4. WHEN existe un límite semanal, THE System SHALL validar que no se haya excedido
5. IF se excede el límite mensual, THEN THE System SHALL rechazar el acceso con mensaje descriptivo
6. IF se excede el límite semanal, THEN THE System SHALL rechazar el acceso con mensaje descriptivo
7. WHERE no hay límites configurados, THE System SHALL permitir visitas ilimitadas
8. THE System SHALL registrar cada visita en membership_usage para el conteo

### Requirement 10: Validar Acceso a Zonas

**User Story:** Como sistema de control de acceso, quiero validar que un cliente acceda solo a zonas permitidas por su membresía, para que se respeten las restricciones de cada tipo de membresía.

#### Acceptance Criteria

1. WHEN un cliente intenta acceder a una zona, THE System SHALL obtener las zonas permitidas de su tipo de membresía
2. WHEN existen zonas configuradas, THE System SHALL validar que la zona solicitada esté en la lista permitida
3. IF la zona no está permitida, THEN THE System SHALL rechazar el acceso con mensaje descriptivo
4. WHERE no hay zonas configuradas, THE System SHALL permitir acceso a todas las zonas
5. THE System SHALL mantener un catálogo de zonas disponibles en el centro

### Requirement 11: Aplicar Descuentos en Productos

**User Story:** Como vendedor, quiero que se apliquen automáticamente descuentos de membresía en productos, para que los clientes reciban sus beneficios sin intervención manual.

#### Acceptance Criteria

1. WHEN un cliente con membresía compra un producto, THE System SHALL obtener el descuento en productos de su tipo de membresía
2. WHEN existe un descuento configurado, THE System SHALL aplicar el porcentaje de descuento al precio del producto
3. WHEN se aplica un descuento, THE System SHALL mostrar el precio original y el precio con descuento
4. WHEN se completa la venta, THE System SHALL registrar el descuento aplicado en sale_items
5. WHEN se completa la venta, THE System SHALL registrar el uso del beneficio en membership_usage
6. WHERE no hay descuento configurado, THE System SHALL cobrar el precio regular

### Requirement 12: Configurar Fechas Bloqueadas

**User Story:** Como administrador, quiero configurar fechas bloqueadas por tipo de membresía, para que ciertos niveles no tengan acceso en días especiales o de alta demanda.

#### Acceptance Criteria

1. THE System SHALL permitir crear fechas bloqueadas con fecha, tipo de membresía y razón
2. THE System SHALL permitir bloquear múltiples tipos de membresía en una misma fecha
3. THE System SHALL permitir configurar fechas bloqueadas recurrentes (ej: todos los 25 de diciembre)
4. WHEN un cliente intenta acceder en una fecha bloqueada, THE System SHALL validar si su tipo de membresía está bloqueado
5. IF el tipo de membresía está bloqueado, THEN THE System SHALL rechazar el acceso con mensaje descriptivo
6. THE System SHALL mostrar las fechas bloqueadas en el calendario del cliente
7. THE System SHALL permitir eliminar o modificar fechas bloqueadas

### Requirement 13: Gestionar Privilegios de Invitados

**User Story:** Como cliente con membresía, quiero poder traer invitados según mi tipo de membresía, para que puedan disfrutar del centro conmigo.

#### Acceptance Criteria

1. THE System SHALL permitir configurar número máximo de invitados por tipo de membresía
2. WHEN un cliente registra invitados, THE System SHALL validar que no exceda el límite permitido
3. WHEN se registran invitados, THE System SHALL requerir nombre y relación con el miembro
4. WHEN se registran invitados, THE System SHALL generar pases temporales de acceso
5. THE System SHALL registrar cada visita de invitado en membership_usage
6. THE System SHALL permitir configurar si los invitados pagan tarifa reducida o acceso gratuito
7. WHERE el número de invitados es 0, THE System SHALL no permitir registrar invitados

### Requirement 14: Reportes de Suspensiones

**User Story:** Como administrador, quiero ver reportes de suspensiones de membresías, para que pueda analizar patrones y tomar decisiones de negocio.

#### Acceptance Criteria

1. THE System SHALL generar reporte de suspensiones por período de tiempo
2. THE System SHALL mostrar total de suspensiones por razón
3. THE System SHALL mostrar promedio de días de suspensión
4. THE System SHALL mostrar tipos de membresía más suspendidos
5. THE System SHALL permitir exportar el reporte a PDF y Excel
6. THE System SHALL mostrar tendencias de suspensiones mes a mes

### Requirement 15: Reportes de Promociones

**User Story:** Como administrador, quiero ver reportes de efectividad de promociones, para que pueda evaluar el retorno de inversión de cada campaña.

#### Acceptance Criteria

1. THE System SHALL generar reporte de uso de promociones por período
2. THE System SHALL mostrar total de usos por promoción
3. THE System SHALL mostrar total de descuentos otorgados por promoción
4. THE System SHALL mostrar ingresos generados por cada promoción
5. THE System SHALL mostrar tasa de conversión de códigos promocionales
6. THE System SHALL permitir exportar el reporte a PDF y Excel
7. THE System SHALL comparar ventas con y sin promociones

### Requirement 16: Reportes de Referidos

**User Story:** Como administrador, quiero ver reportes del programa de referidos, para que pueda medir su efectividad en la adquisición de clientes.

#### Acceptance Criteria

1. THE System SHALL generar reporte de referidos por período
2. THE System SHALL mostrar clientes con más referidos exitosos
3. THE System SHALL mostrar tasa de conversión de referidos
4. THE System SHALL mostrar total de créditos otorgados por referidos
5. THE System SHALL mostrar ingresos generados por clientes referidos
6. THE System SHALL permitir exportar el reporte a PDF y Excel

### Requirement 17: Notificaciones de Vencimiento con Promociones

**User Story:** Como sistema, quiero enviar notificaciones de vencimiento con promociones de renovación, para que se incentive la renovación temprana.

#### Acceptance Criteria

1. WHEN una membresía está por vencer en 7 días, THE System SHALL verificar si hay promociones activas de renovación
2. WHEN existen promociones aplicables, THE System SHALL incluir el código promocional en la notificación
3. THE System SHALL enviar notificaciones por email si el cliente tiene email registrado
4. THE System SHALL mostrar notificaciones en la aplicación al iniciar sesión
5. THE System SHALL permitir configurar los días de anticipación para notificaciones

### Requirement 18: Validación de Integridad de Datos

**User Story:** Como sistema, quiero validar la integridad de datos en operaciones de suspensión y promociones, para que no haya inconsistencias en la base de datos.

#### Acceptance Criteria

1. WHEN se crea una suspensión, THE System SHALL validar que la membresía existe y está activa
2. WHEN se aplica una promoción, THE System SHALL validar que no se apliquen múltiples promociones incompatibles
3. WHEN se extiende una fecha de vencimiento, THE System SHALL validar que la nueva fecha sea posterior a la actual
4. WHEN se registra un uso de beneficio, THE System SHALL validar que la membresía esté activa
5. THE System SHALL usar transacciones de base de datos para operaciones críticas
6. IF una transacción falla, THEN THE System SHALL revertir todos los cambios relacionados

### Requirement 19: Auditoría de Cambios

**User Story:** Como administrador, quiero que se registren todos los cambios en membresías, para que pueda auditar operaciones y resolver disputas.

#### Acceptance Criteria

1. WHEN se suspende una membresía, THE System SHALL registrar el usuario que realizó la acción
2. WHEN se aplica una promoción, THE System SHALL registrar el usuario que realizó la acción
3. WHEN se modifica un beneficio, THE System SHALL registrar el usuario que realizó la acción
4. THE System SHALL registrar timestamp de todas las operaciones
5. THE System SHALL mantener un log de auditoría inmutable
6. THE System SHALL permitir consultar el historial de cambios por membresía

### Requirement 20: Integración con Sistema de Caja

**User Story:** Como sistema, quiero que todas las transacciones de promociones y descuentos se registren en caja, para que la contabilidad sea precisa.

#### Acceptance Criteria

1. WHEN se aplica un descuento de promoción, THE System SHALL registrar el descuento en la venta de caja
2. WHEN se aplica un crédito de referido, THE System SHALL registrar el descuento en la venta de caja
3. WHEN se aplica un descuento de membresía en productos, THE System SHALL registrar el descuento en sale_items
4. THE System SHALL validar que hay una caja abierta antes de procesar ventas con promociones
5. THE System SHALL incluir el código de promoción en las notas de la venta
6. THE System SHALL generar reportes de caja que incluyan descuentos por tipo
