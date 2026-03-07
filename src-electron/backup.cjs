const fs = require("fs");
const path = require("path");
const { app, dialog } = require("electron");

/**
 * NOTA: Los backups para PostgreSQL están deshabilitados temporalmente
 * Se necesita implementar usando pg_dump en lugar de VACUUM INTO
 */

function getBackupPath() {
  const userDataPath = app.getPath("userData");
  const backupDir = path.join(userDataPath, "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return backupDir;
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
  console.warn("⚠️ Backups de PostgreSQL no implementados aún");
  return {
    success: false,
    error: "Backups de PostgreSQL no implementados. Use pg_dump manualmente.",
  };
}

async function createBackupWithDialog() {
  return {
    success: false,
    error: "Backups de PostgreSQL no implementados. Use pg_dump manualmente.",
  };
}

async function restoreFromBackup(backupPath) {
  return {
    success: false,
    error: "Restore de PostgreSQL no implementado. Use psql manualmente.",
  };
}

async function restoreWithDialog() {
  return {
    success: false,
    error: "Restore de PostgreSQL no implementado. Use psql manualmente.",
  };
}

function listBackups() {
  return [];
}

function cleanOldBackups(keepCount = 10) {
  return { deleted: 0, kept: 0 };
}

async function createAutoBackup() {
  console.warn("⚠️ Backup automático de PostgreSQL no implementado");
  return {
    success: false,
    error: "Backups automáticos no implementados para PostgreSQL",
  };
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
