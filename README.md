# Ludoteca POS - Sistema de Gestión

Sistema POS local para ludotecas construido con Electron, Vite, React y TypeScript.

## Características

- ✅ Dashboard de tiempos en tiempo real con cronómetros
- ✅ Interfaz moderna estilo Windows 11
- ✅ Sidebar colapsable con 7 módulos principales
- ✅ Status bar con indicadores de sistema
- ✅ Componentes de shadcn/ui
- ✅ Tailwind CSS para estilos
- ✅ Totalmente tipado con TypeScript
- ✅ Soporte para pantallas táctiles y no táctiles
- ✅ **Multi-usuario con PostgreSQL** (opcional)
- ✅ **Auditoría completa de inventario**
- ✅ **Sistema de caja con cuadre**

## Requisitos

- Node.js 16+
- npm o yarn

## Instalación

1. Clonar el repositorio:

```bash
git clone <repo-url>
cd ludoteca-pos
```

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar en desarrollo:

```bash
npm run dev
```

Esto abrirá automáticamente la aplicación Electron con hot-reload.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo y Electron
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Vista previa de la build
- `npm run electron-dev` - Solo ejecuta Electron (requiere que Vite esté corriendo)
- `npm run type-check` - Verifica tipos de TypeScript

## 🔄 Migración a PostgreSQL (Multi-Usuario)

Para usar el sistema con múltiples computadoras conectadas a la misma red:

1. **Guía rápida**: Ver [MIGRACION-POSTGRESQL.md](MIGRACION-POSTGRESQL.md)
2. **Guía detallada**: Ver [POSTGRESQL-SETUP.md](POSTGRESQL-SETUP.md)
3. **Scripts automáticos**:
   - Linux: `sudo ./install-postgresql.sh`
   - Windows: Ejecutar `install-postgresql.ps1` como Administrador

### Ventajas de PostgreSQL

- ✅ Múltiples usuarios simultáneos
- ✅ Base de datos centralizada
- ✅ Sincronización en tiempo real
- ✅ Backups centralizados
- ✅ Mejor rendimiento con múltiples usuarios

## Estructura del Proyecto

```
ludoteca-pos/
├── src/
│   ├── components/
│   │   ├── ui/                 # Componentes shadcn/ui
│   │   ├── Sidebar.tsx         # Menú lateral
│   │   ├── StatusBar.tsx       # Barra de estado
│   │   ├── Timer.tsx           # Componente de cronómetro
│   │   ├── TimingDashboard.tsx # Dashboard principal
│   │   └── MainLayout.tsx      # Layout maestro
│   ├── types/
│   │   └── index.ts            # Interfaces TypeScript
│   ├── lib/
│   │   └── utils.ts            # Utilidades
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── electron-main.ts            # Proceso principal de Electron
├── preload.ts                  # Preload script
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Arquitectura de Layout

```
┌─────────────────────────────────────────┐
│         BARRA DE TÍTULO                 │
├──────────┬──────────────────────────────┤
│          │                              │
│ SIDEBAR  │    MAIN CONTENT AREA         │
│ (250px)  │   (Dashboard de Tiempos)     │
│          │                              │
├──────────┴──────────────────────────────┤
│ STATUS BAR (40px)                       │
└─────────────────────────────────────────┘
```

## Módulos Principales

1. **Dashboard** - Vista general del sistema
2. **Operaciones** - Dashboard de tiempos y eventos
3. **Punto de Venta** - Gestión de ventas y caja
4. **Clientes** - Directorio de clientes
5. **Inventario** - Gestión de productos y servicios
6. **Reportes** - Análisis y estadísticas
7. **Configuración** - Ajustes del sistema

## Componentes Utilizados

### shadcn/ui

- Button
- Card
- Badge
- ScrollArea

### lucide-react

- Iconos para menú y controles

### Tailwind CSS

- Estilos responsivos
- Tema claro/oscuro
- Diseño moderno

## Características de UX

### Dashboard de Tiempos

- Grid responsivo de tarjetas
- Cronómetro digital en tiempo real
- Badges de estado con colores:
  - 🟢 Verde: Tiempo activo (< 1h)
  - 🟡 Amarillo: Próximo a vencer (> 1h)
  - 🔴 Rojo: Tiempo expirado
- Botón de check-out destacado
- Entrada rápida de nuevos clientes

### Status Bar

- Indicador de conexión a BD
- Usuario activo
- Estado de impresora
- Estado de caja
- Reloj en tiempo real
- Estado de conexión online/offline

### Sidebar

- Colapsable con toggle
- Iconos + texto (expandido)
- Solo iconos (colapsado)
- Navegación intuitiva
- Botón de salida

## Adaptabilidad

- ✅ Pantallas táctiles: Botones con tamaño adecuado (touch-target)
- ✅ Pantallas no táctiles: Hover effects y atajos de teclado
- ✅ Responsive: Funciona en diferentes resoluciones
- ✅ Accesibilidad: Contraste adecuado y navegación clara

## Desarrollo

### Agregar nuevos componentes

1. Crear archivo en `src/components/`
2. Importar en el componente padre
3. Usar tipos de `src/types/index.ts`

### Agregar nuevos módulos

1. Crear componente en `src/components/`
2. Agregar ruta en `MainLayout.tsx`
3. Agregar item en menú del Sidebar

## Build para Producción

```bash
npm run build
```

Esto generará:

- `dist/` - Archivos de la aplicación web
- `dist-electron/` - Archivos de Electron
- Ejecutable en `release/`

## Licencia

MIT
