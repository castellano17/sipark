import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { apiFallback } from "./apiFallback";

// Fallback Inteligente para WiFi / Celulares (Browser Mode)
if (!(window as any).api) {
  (window as any).api = apiFallback;
  console.log("🌐 Módulo Web activado: Conectado a Servidor SIPARK vía WiFi.");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
