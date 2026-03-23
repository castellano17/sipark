const api = require("./api.cjs");

async function seedDatabase() {
  try {

    // Crear configuración por defecto
    // Crear configuración por defecto solo si no existe
    try {
      const current = await api.getSetting("system_name");
      if (!current) {
        await api.setSetting("system_name", "SIPARK");
      }
    } catch (err) {
      // Ignorar errores menores
    }
    // Base de datos lista.
  } catch (error) {
  }
}

module.exports = { seedDatabase };
