const api = require("./api.cjs");

async function seedDatabase() {
  try {

    // Crear configuración por defecto
    try {
      await api.setSetting("system_name", "SIPARK");
    } catch (err) {
      // Setting ya existe
    }
    // Base de datos lista.
  } catch (error) {
    console.error("❌ Error inicializando configuración:", error);
  }
}

module.exports = { seedDatabase };
