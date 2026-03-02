# Guía de Desarrollo - Ludoteca POS

## Configuración Inicial

### 1. Clonar y instalar

```bash
git clone <repo>
cd ludoteca-pos
npm install
```

### 2. Iniciar desarrollo

```bash
npm run dev
```

Esto abrirá automáticamente:

- Vite dev server en `http://localhost:5173`
- Electron con la aplicación

## Estructura de Componentes

### Componentes UI (shadcn/ui)

Ubicados en `src/components/ui/`:

- `button.tsx` - Botón reutilizable
- `card.tsx` - Tarjeta con header, content, footer
- `badge.tsx` - Etiqueta con variantes
- `scroll-area.tsx` - Área con scroll personalizado

### Componentes de Negocio

Ubicados en `src/components/`:

- `Sidebar.tsx` - Menú lateral colapsable
- `StatusBar.tsx` - Barra de estado inferior
- `Timer.tsx` - Cronómetro digital
- `TimingDashboard.tsx` - Dashboard principal
- `MainLayout.tsx` - Layout maestro

## Tipos TypeScript

Definidos en `src/types/index.ts`:

```typescript
// Entrada de un niño
interface ChildEntry {
  id: string;
  name: string;
  photo?: string;
  entryTime: Date;
  service: "juego" | "paquete" | "evento";
  packageName?: string;
  durationMinutes: number;
  extraCharges?: number;
  status: "active" | "expired" | "warning";
}

// Usuario del sistema
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cajero" | "monitor";
  permissions: string[];
}

// Estado del sistema
interface SystemStatus {
  database: "connected" | "disconnected" | "error";
  printer: "connected" | "disconnected" | "error";
  cashBox: "open" | "closed";
  currentTime: Date;
  isOnline: boolean;
}
```

## Agregar un Nuevo Módulo

### 1. Crear componente

```typescript
// src/components/MyModule.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export const MyModule: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Mi Módulo</h1>
      {/* Contenido */}
    </div>
  )
}
```

### 2. Agregar ruta en MainLayout

```typescript
// src/components/MainLayout.tsx
const renderContent = () => {
  switch (currentPath) {
    case '/mi-modulo':
      return <MyModule />
    // ...
  }
}
```

### 3. Agregar item en Sidebar

```typescript
// src/components/Sidebar.tsx
const menuItems: MenuItem[] = [
  // ...
  {
    id: 'mi-modulo',
    label: 'Mi Módulo',
    icon: <MyIcon className="w-5 h-5" />,
    path: '/mi-modulo',
  },
]
```

## Estilos con Tailwind

### Clases Útiles

```tsx
// Espaciado
<div className="p-4 m-2 gap-3">

// Colores
<div className="bg-primary text-primary-foreground">
<div className="bg-destructive text-destructive-foreground">
<div className="bg-muted text-muted-foreground">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Flexbox
<div className="flex items-center justify-between gap-4">

// Bordes
<div className="border border-border rounded-lg">
```

### Variables CSS Disponibles

```css
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--destructive
--destructive-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--border
--input
--ring
```

## Componentes Badge - Variantes

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
```

## Componentes Button - Variantes

```tsx
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

## Iconos de lucide-react

```tsx
import {
  LayoutDashboard,
  Gamepad2,
  CreditCard,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Search,
  // ... más iconos
} from "lucide-react";

<LayoutDashboard className="w-5 h-5" />;
```

## Adaptabilidad Táctil

### Tamaños de Touch Target

```tsx
// Mínimo 44x44px en dispositivos táctiles
<Button className="touch-target">Presionar</Button>

// O usar min-height/min-width
<button className="min-h-12 min-w-12">Presionar</button>
```

### Detectar Dispositivo Táctil

```typescript
const isTouchDevice = () => {
  return (
    (typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)) ||
    false
  );
};
```

## Debugging

### DevTools de Electron

Se abre automáticamente en desarrollo. Presiona `F12` para cerrar/abrir.

### Console Logs

```typescript
console.log("Debug:", data);
console.error("Error:", error);
console.warn("Warning:", warning);
```

### React DevTools

Instala la extensión de React DevTools en Chrome para mejor debugging.

## Performance

### Optimizaciones Aplicadas

- ✅ React.memo para componentes puros
- ✅ useCallback para funciones estables
- ✅ Lazy loading de módulos
- ✅ Scroll area virtualizado

### Monitoreo

```typescript
// Medir performance
const start = performance.now();
// ... código
const end = performance.now();
console.log(`Tiempo: ${end - start}ms`);
```

## Testing (Futuro)

Estructura recomendada:

```
src/
├── components/
│   ├── __tests__/
│   │   └── Sidebar.test.tsx
```

## Build y Deploy

### Desarrollo

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Troubleshooting

### Electron no abre

```bash
# Limpiar y reinstalar
rm -rf node_modules dist dist-electron
npm install
npm run dev
```

### Estilos no se aplican

```bash
# Reconstruir Tailwind
npm run build
```

### TypeScript errors

```bash
npm run type-check
```

## Recursos

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [lucide-react](https://lucide.dev)
- [Electron Docs](https://www.electronjs.org/docs)
- [Vite Docs](https://vitejs.dev)
