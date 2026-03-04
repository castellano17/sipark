const fs = require("fs");
const path = require("path");
const { app, dialog } = require("electron");
const { getDatabase } = require("./database.cjs");

/**
 * Obtiene el directorio de respaldos
 */
function getBackupPath() {
  const userDataPath = app.getPath("userData");
  const backupDir = path.join(userDataPath, "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return backupDir;
}

/**
 * Genera nombre de archivo de respaldo con timestamp
 */
function generateBackupFilename() {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .split(".")[0];
  return `sipark_backup_${timestamp}.db`;
}

/**
 * Crea un respaldo local de la base de datos SQLite
 * Usa el método VACUUM INTO para crear una copia compacta y consistente
 */
async function createLocalBackup(destinationPath = null) {
  try {
    const db = getDatabase();

    // Si no se proporciona ruta, usar directorio de respaldos
    if (!destinationPath) {
      const backupDir = getBackupPath();
      const filename = generateBackupFilename();
      destinationPath = path.join(backupDir, filename);
    }

    // Usar VACUUM INTO para crear respaldo consistente
    // Este método es más seguro que copiar el archivo directamente
    await new Promise((resolve, reject) => {
      db.run(`VACUUM INTO ?`, [destinationPath], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const stats = fs.statSync(destinationPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Respaldo creado: ${destinationPath} (${sizeInMB} MB)`);

    return {
      success: true,
      path: destinationPath,
      size: stats.size,
      sizeFormatted: `${sizeInMB} MB`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error creando respaldo:", error);
    throw error;
  }
}

/**
 * Permite al usuario seleccionar dónde guardar el respaldo
 */
async function createBackupWithDialog() {
  try {
    const result = await dialog.showSaveDialog({
      title: "Guardar Respaldo de Base de Datos",
      defaultPath: generateBackupFilename(),
      filters: [
        { name: "Base de Datos SQLite", extensions: ["db"] },
        { name: "Todos los archivos", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    return await createLocalBackup(result.filePath);
  } catch (error) {
    console.error("Error en respaldo con diálogo:", error);
    throw error;
  }
}

/**
 * Restaura la base de datos desde un archivo de respaldo
 */
async function restoreFromBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error("El archivo de respaldo no existe");
    }

    // Verificar que es un archivo SQLite válido
    const header = Buffer.alloc(16);
    const fd = fs.openSync(backupPath, "r");
    fs.readSync(fd, header, 0, 16, 0);
    fs.closeSync(fd);

    const sqliteHeader = "SQLite format 3\0";
    if (header.toString("utf8", 0, 16) !== sqliteHeader) {
      throw new Error("El archivo no es una base de datos SQLite válida");
    }

    // Cerrar conexión actual
    const db = getDatabase();
    await new Promise((resolve) => {
      db.close(() => resolve());
    });

    // Obtener ruta de la base de datos actual
    const dbPath = path.join(app.getPath("userData"), "sipark.db");

    // Crear respaldo de seguridad antes de restaurar
    const safetyBackupPath = path.join(
      app.getPath("userData"),
      `sipark_before_restore_${Date.now()}.db`,
    );
    fs.copyFileSync(dbPath, safetyBackupPath);

    // Copiar el archivo de respaldo sobre la base de datos actual
    fs.copyFileSync(backupPath, dbPath);

    console.log("✅ Base de datos restaurada exitosamente");
    console.log(`📁 Respaldo de seguridad guardado en: ${safetyBackupPath}`);

    return {
      success: true,
      message: "Base de datos restaurada exitosamente",
      safetyBackup: safetyBackupPath,
    };
  } catch (error) {
    console.error("❌ Error restaurando base de datos:", error);
    throw error;
  }
}

/**
 * Permite al usuario seleccionar un archivo de respaldo para restaurar
 */
async function restoreWithDialog() {
  try {
    const result = await dialog.showOpenDialog({
      title: "Seleccionar Archivo de Respaldo",
      filters: [
        { name: "Base de Datos SQLite", extensions: ["db"] },
        { name: "Todos los archivos", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    return await restoreFromBackup(result.filePaths[0]);
  } catch (error) {
    console.error("Error en restauración con diálogo:", error);
    throw error;
  }
}

/**
 * Lista todos los respaldos automáticos disponibles
 */
function listBackups() {
  try {
    const backupDir = getBackupPath();
    const files = fs.readdirSync(backupDir);

    const backups = files
      .filter((file) => file.endsWith(".db"))
      .map((file) => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          created: stats.birthtime,
          modified: stats.mtime,
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());

    return backups;
  } catch (error) {
    console.error("Error listando respaldos:", error);
    return [];
  }
}

/**
 * Elimina respaldos antiguos, manteniendo solo los N más recientes
 */
function cleanOldBackups(keepCount = 10) {
  try {
    const backups = listBackups();

    if (backups.length <= keepCount) {
      return { deleted: 0, kept: backups.length };
    }

    const toDelete = backups.slice(keepCount);
    let deleted = 0;

    toDelete.forEach((backup) => {
      try {
        fs.unlinkSync(backup.path);
        deleted++;
      } catch (err) {
        console.error(`Error eliminando ${backup.filename}:`, err);
      }
    });

    console.log(`🗑️  Limpieza: ${deleted} respaldos antiguos eliminados`);

    return { deleted, kept: backups.length - deleted };
  } catch (error) {
    console.error("Error limpiando respaldos:", error);
    return { deleted: 0, kept: 0 };
  }
}

/**
 * Crea un respaldo automático (usado para respaldos programados)
 */
async function createAutoBackup() {
  try {
    const result = await createLocalBackup();

    // Limpiar respaldos antiguos, mantener solo los últimos 10
    cleanOldBackups(10);

    return result;
  } catch (error) {
    console.error("Error en respaldo automático:", error);
    throw error;
  }
}

module.exports = {
  createLocalBackup,
  createBackupWithDialog,
  restoreFromBackup,
  restoreWithDialog,
  listBackups,
  cleanOldBackups,
  createAutoBackup,
  getBackupPath,
};
