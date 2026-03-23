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
