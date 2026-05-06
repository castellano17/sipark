const fs = require("fs");
const path = require("path");
const { app, dialog } = require("electron");

/**
 * NOTA: Los backups para PostgreSQL están deshabilitados temporalmente
 * Se necesita implementar usando pg_dump en lugar de VACUUM INTO
 */

const { exec } = require("child_process");
const { getConfig } = require("./database-pg.cjs");

function getBackupPath() {
  const userDataPath = app.getPath("userData");
  const backupDir = path.join(userDataPath, "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return backupDir;
}

function findPgDump() {
  // 1. Probar rutas comunes en Windows dinámicamente
  if (process.platform === 'win32') {
    const baseDir = 'C:\\Program Files\\PostgreSQL';
    if (fs.existsSync(baseDir)) {
      try {
        const versions = fs.readdirSync(baseDir);
        // Ordenar versiones (ej: 18, 17, 16...) de mayor a menor
        const sortedVersions = versions.filter(v => !isNaN(v)).sort((a, b) => Number(b) - Number(a));
        
        for (const v of sortedVersions) {
          const p = path.join(baseDir, v, 'bin', 'pg_dump.exe');
          if (fs.existsSync(p)) return `"${p}"`;
        }
      } catch (e) {
        console.error("Error buscando pg_dump:", e);
      }
    }
  }
  
  return "pg_dump"; // Último recurso: confiar en el PATH
}

function generateBackupFilename() {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .split(".")[0];
  return `sipark_backup_${timestamp}.sql`;
}

async function createLocalBackup(destinationPath = null) {
  try {
    const config = getConfig();
    const backupDir = getBackupPath();
    const filename = generateBackupFilename();
    const filePath = destinationPath || path.join(backupDir, filename);
    const pgDumpPath = findPgDump();

    // Configurar variables de entorno para la contraseña
    const env = { ...process.env, PGPASSWORD: config.password };

    // Comando pg_dump
    // -h: host, -p: puerto, -U: usuario, -F: formato (p=plain/sql), -f: archivo de salida
    // --clean: incluye comandos para eliminar objetos antes de crearlos
    // --if-exists: usa IF EXISTS al eliminar para evitar errores
    // --inserts: usa INSERT INTO en lugar de COPY para mejor legibilidad y compatibilidad
    const command = `${pgDumpPath} -h ${config.host} -p ${config.port} -U ${config.user} -F p --clean --if-exists --inserts -f "${filePath}" ${config.database}`;

    return new Promise((resolve) => {
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error en pg_dump: ${stderr}`);
          return resolve({
            success: false,
            error: `Error al ejecutar pg_dump: ${stderr || error.message}. Asegúrese de tener PostgreSQL instalado y en el PATH.`,
          });
        }

        const stats = fs.statSync(filePath);
        resolve({
          success: true,
          path: filePath,
          filename: path.basename(filePath),
          size: stats.size,
          sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        });
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createBackupWithDialog() {
  const { filePath } = await dialog.showSaveDialog({
    title: "Guardar Respaldo",
    defaultPath: path.join(app.getPath("documents"), generateBackupFilename()),
    filters: [{ name: "SQL Files", extensions: ["sql"] }],
  });

  if (!filePath) return { success: false, error: "Operación cancelada" };

  return await createLocalBackup(filePath);
}

function findPsql() {
  if (process.platform === 'win32') {
    const baseDir = 'C:\\Program Files\\PostgreSQL';
    if (fs.existsSync(baseDir)) {
      try {
        const versions = fs.readdirSync(baseDir);
        const sortedVersions = versions.filter(v => !isNaN(v)).sort((a, b) => Number(b) - Number(a));
        
        for (const v of sortedVersions) {
          const p = path.join(baseDir, v, 'bin', 'psql.exe');
          if (fs.existsSync(p)) return `"${p}"`;
        }
      } catch (e) {
        console.error("Error buscando psql:", e);
      }
    }
  }
  return "psql";
}

async function restoreFromBackup(backupPath) {
  try {
    const config = getConfig();
    const psqlPath = findPsql();
    const env = { ...process.env, PGPASSWORD: config.password };

    // Comando psql para restaurar
    // -h: host, -p: puerto, -U: usuario, -f: archivo de entrada
    const command = `${psqlPath} -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -f "${backupPath}"`;

    return new Promise((resolve) => {
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error en psql: ${stderr}`);
          return resolve({
            success: false,
            error: `Error al restaurar con psql: ${stderr || error.message}`,
          });
        }
        resolve({ success: true });
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function restoreWithDialog() {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Seleccionar Respaldo para Restaurar",
    filters: [{ name: "SQL Files", extensions: ["sql"] }],
    properties: ["openFile"],
  });

  if (!filePaths || filePaths.length === 0)
    return { success: false, error: "Operación cancelada" };

  const confirmation = await dialog.showMessageBox({
    type: "warning",
    title: "Confirmar Restauración",
    message: "¿Estás seguro de que deseas restaurar la base de datos?",
    detail: "Esta acción reemplazará los datos actuales con los del respaldo seleccionado.",
    buttons: ["Cancelar", "Restaurar"],
    defaultId: 0,
    cancelId: 0,
  });

  if (confirmation.response !== 1) return { success: false, error: "Operación cancelada" };

  return await restoreFromBackup(filePaths[0]);
}

function listBackups() {
  return [];
}

function cleanOldBackups(keepCount = 10) {
  return { deleted: 0, kept: 0 };
}

async function createAutoBackup() {
  return await createLocalBackup();
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
