import { useState, useEffect } from "react";
import { SnackbarProvider } from "notistack";
import MainLayout from "./components/MainLayout";
import { Login } from "./components/Login";
import { CustomerDisplay } from "./components/CustomerDisplay";
import type { SystemUser } from "./types";

function App() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Detección de Monitor Secundario (Pantalla Cliente)
  const isCustomerDisplay = window.location.search.includes('view=customer');

  if (isCustomerDisplay) {
    document.body.style.backgroundColor = "transparent";
    document.documentElement.style.backgroundColor = "transparent";
    return <CustomerDisplay />;
  }

  useEffect(() => {
    // Verificar si hay usuario en localStorage
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem("currentUser");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: SystemUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  };

  // Auto-logout por inactividad
  useEffect(() => {
    if (!currentUser || isCustomerDisplay) return;

    let timeoutId: NodeJS.Timeout;

    const logoutUser = () => {
      handleLogout();
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 5 minutos = 300,000 ms
      timeoutId = setTimeout(logoutUser, 300000);
    };

    // Inicializar el timer
    resetTimer();

    // Eventos que indican actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Función optimizada para no llamar resetTimer en cada pixel de mousemove
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 1000); // Throttling a 1 segundo para mejorar rendimiento
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [currentUser, isCustomerDisplay]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        autoHideDuration={4000}
      >
        <Login onLogin={handleLogin} />
      </SnackbarProvider>
    );
  }

  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      autoHideDuration={4000}
    >
      <MainLayout currentUser={currentUser} onLogout={handleLogout} />
    </SnackbarProvider>
  );
}

export default App;
