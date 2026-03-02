const { createAutoBackup } = require("./backup.cjs");
const { sendBackupByEmail } = require("./backup-email.cjs");
const { uploadToGoogleDrive } = require("./backup-gdrive.cjs");
const { getSetting } = require("./api.cjs");

let schedulerInterval = null;
let lastBackupTime = null;

/**
 * Inicia el programador de respaldos automáticos
 */
function startBackupScheduler() {
  // Verificar cada hora si es tiempo de hacer respaldo
  schedulerInterval = setInterval(
    async () => {
      await checkAndRunBackup();
    },
    60 * 60 * 1000,
  ); // Cada hora

  console.log("📅 Programador de respaldos iniciado");

  // Ejecutar verificación inmediata
  checkAndRunBackup();
}

/**
 * Detiene el programador de respaldos
 */
function stopBackupScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("📅 Programador de respaldos detenido");
  }
}

/**
 * Verifica si es tiempo de hacer respaldo y lo ejecuta
 */
async function checkAndRunBackup() {
  try {
    // Obtener configuración
    const autoBackupEnabled = await getSetting("auto_backup_enabled");
    if (autoBackupEnabled !== "true") {
      return; // Respaldos automáticos deshabilitados
    }

    const backupFrequency = await getSetting("auto_backup_frequency");
    const frequencyHours = parseInt(backupFrequency || "24");

    // Verificar si es tiempo de hacer respaldo
    const now = Date.now();
    if (lastBackupTime) {
      const hoursSinceLastBackup = (now - lastBackupTime) / (1000 * 60 * 60);
      if (hoursSinceLastBackup < frequencyHours) {
        return; // Aún no es tiempo
      }
    }

    console.log("🔄 Iniciando respaldo automático...");

    // Crear respaldo local
    const backup = await createAutoBackup();
    console.log(`✅ Respaldo local creado: ${backup.sizeFormatted}`);

    // Enviar por email si está configurado
    const emailEnabled = await getSetting("auto_backup_email_enabled");
    if (emailEnabled === "true") {
      try {
        const emailConfigStr = await getSetting("backup_email_config");
        if (emailConfigStr) {
          const emailConfig = JSON.parse(emailConfigStr);
          await sendBackupByEmail(emailConfig);
          console.log("📧 Respaldo enviado por email");
        }
      } catch (err) {
        console.error("Error enviando respaldo por email:", err);
      }
    }

    // Subir a Google Drive si está configurado
    const gdriveEnabled = await getSetting("auto_backup_gdrive_enabled");
    if (gdriveEnabled === "true") {
      try {
        const gdriveConfigStr = await getSetting("backup_gdrive_config");
        if (gdriveConfigStr) {
          const gdriveConfig = JSON.parse(gdriveConfigStr);
          await uploadToGoogleDrive(gdriveConfig, null);
          console.log("☁️  Respaldo subido a Google Drive");
        }
      } catch (err) {
        console.error("Error subiendo a Google Drive:", err);
      }
    }

    lastBackupTime = now;
    console.log("✅ Respaldo automático completado");
  } catch (error) {
    console.error("❌ Error en respaldo automático:", error);
  }
}

/**
 * Ejecuta un respaldo manual inmediato
 */
async function runManualBackup() {
  lastBackupTime = null; // Resetear para forzar respaldo
  await checkAndRunBackup();
}

/**
 * Obtiene el estado del programador
 */
function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null,
    lastBackupTime: lastBackupTime,
    nextBackupTime: lastBackupTime
      ? new Date(lastBackupTime + 24 * 60 * 60 * 1000)
      : null,
  };
}

module.exports = {
  startBackupScheduler,
  stopBackupScheduler,
  checkAndRunBackup,
  runManualBackup,
  getSchedulerStatus,
};
