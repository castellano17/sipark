const api = require("./api.cjs");

async function seedDatabase() {
  try {
    console.log("🌱 Inicializando configuración del sistema...");

    // Crear configuración por defecto
    try {
      await api.setSetting("system_name", "SIPARK");
    } catch (err) {
      // Setting ya existe
    }

    console.log("✅ Configuración del sistema inicializada");
    console.log(
      "ℹ️  Base de datos lista. Puedes comenzar a agregar tus propios productos, clientes y proveedores.",
    );
  } catch (error) {
    console.error("❌ Error inicializando configuración:", error);
  }
}

module.exports = { seedDatabase };
