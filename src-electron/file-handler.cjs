const fs = require("fs");
const path = require("path");
const { app } = require("electron");

/**
 * Obtiene el directorio de datos de la aplicación
 */
function getAppDataPath() {
  const userDataPath = app.getPath("userData");
  const appDataDir = path.join(userDataPath, "sipark-data");

  // Crear directorio si no existe
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }

  return appDataDir;
}

/**
 * Obtiene el directorio de logos
 */
function getLogosPath() {
  const logosDir = path.join(getAppDataPath(), "logos");

  // Crear directorio si no existe
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }

  return logosDir;
}

/**
 * Guarda un logo (ticket o factura)
 * @param {string} type - 'ticket' o 'invoice'
 * @param {string} base64Data - Datos de la imagen en base64
 * @param {string} extension - Extensión del archivo (jpg, png, etc)
 */
async function saveLogo(type, base64Data, extension) {
  try {
    const logosDir = getLogosPath();
    const fileName = `${type}-logo.${extension}`;
    const filePath = path.join(logosDir, fileName);

    // Remover el prefijo data:image/...;base64, si existe
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch (error) {
    console.error(`Error guardando logo ${type}:`, error);
    throw error;
  }
}

/**
 * Obtiene un logo (ticket o factura)
 * @param {string} type - 'ticket' o 'invoice'
 */
async function getLogo(type) {
  try {
    const logosDir = getLogosPath();
    const extensions = ["png", "jpg", "jpeg", "gif"];

    for (const ext of extensions) {
      const fileName = `${type}-logo.${ext}`;
      const filePath = path.join(logosDir, fileName);

      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const base64 = buffer.toString("base64");
        const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
        return `data:${mimeType};base64,${base64}`;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error obteniendo logo ${type}:`, error);
    return null;
  }
}

/**
 * Elimina un logo (ticket o factura)
 * @param {string} type - 'ticket' o 'invoice'
 */
async function deleteLogo(type) {
  try {
    const logosDir = getLogosPath();
    const extensions = ["png", "jpg", "jpeg", "gif"];

    for (const ext of extensions) {
      const fileName = `${type}-logo.${ext}`;
      const filePath = path.join(logosDir, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error eliminando logo ${type}:`, error);
    throw error;
  }
}

module.exports = {
  saveLogo,
  getLogo,
  deleteLogo,
  getAppDataPath,
  getLogosPath,
};
