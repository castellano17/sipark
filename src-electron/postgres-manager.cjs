// Gestor de PostgreSQL embebido para Windows
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

class PostgresManager {
  constructor() {
    this.process = null;
    this.isEmbedded = false;
    this.postgresDir = null;
    this.dataDir = null;
    this.binDir = null;
  }

  /**
   * Detecta si estamos usando PostgreSQL embebido
   */
  detectEmbeddedPostgres() {
    // En producción, PostgreSQL está en la carpeta de instalación
    if (app.isPackaged) {
      const installDir = path.dirname(app.getPath("exe"));
      this.postgresDir = path.join(installDir, "postgresql");
      this.binDir = path.join(this.postgresDir, "bin");
      this.dataDir = path.join(this.postgresDir, "data");

      if (fs.existsSync(this.binDir) && fs.existsSync(this.dataDir)) {
        this.isEmbedded = true;
        console.log("✓ PostgreSQL embebido detectado en:", this.postgresDir);
        return true;
      }
    }

    console.log("ℹ️  Usando PostgreSQL del sistema");
    return false;
  }

  /**
   * Inicia el servidor PostgreSQL embebido
   */
  async start() {
    if (!this.isEmbedded) {
      console.log(
        "ℹ️  PostgreSQL no embebido, asumiendo que ya está corriendo",
      );
      return true;
    }

    return new Promise((resolve, reject) => {
      console.log("🚀 Iniciando PostgreSQL embebido...");

      const pgCtl = path.join(this.binDir, "pg_ctl.exe");
      const logFile = path.join(this.dataDir, "log", "postgres.log");

      // Crear directorio de logs si no existe
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Verificar si ya está corriendo
      exec(`"${pgCtl}" status -D "${this.dataDir}"`, (error, stdout) => {
        if (stdout.includes("server is running")) {
          console.log("✓ PostgreSQL ya está corriendo");
          resolve(true);
          return;
        }

        // Iniciar PostgreSQL
        const startCmd = `"${pgCtl}" start -D "${this.dataDir}" -l "${logFile}" -w -t 30`;

        exec(startCmd, (error, stdout, stderr) => {
          if (error) {
            console.error("✗ Error iniciando PostgreSQL:", error);
            console.error("stderr:", stderr);
            reject(error);
            return;
          }

          console.log("✓ PostgreSQL iniciado correctamente");
          console.log(stdout);

          // Esperar un momento para que el servidor esté listo
          setTimeout(() => resolve(true), 2000);
        });
      });
    });
  }

  /**
   * Detiene el servidor PostgreSQL embebido
   */
  async stop() {
    if (!this.isEmbedded) {
      console.log("ℹ️  PostgreSQL no embebido, no se detendrá");
      return true;
    }

    return new Promise((resolve) => {
      console.log("🛑 Deteniendo PostgreSQL embebido...");

      const pgCtl = path.join(this.binDir, "pg_ctl.exe");
      const stopCmd = `"${pgCtl}" stop -D "${this.dataDir}" -m fast -w -t 10`;

      exec(stopCmd, (error, stdout, stderr) => {
        if (error) {
          console.error("⚠️  Error deteniendo PostgreSQL:", error);
          console.error("stderr:", stderr);
        } else {
          console.log("✓ PostgreSQL detenido correctamente");
          console.log(stdout);
        }
        resolve(true);
      });
    });
  }

  /**
   * Verifica el estado del servidor
   */
  async checkStatus() {
    if (!this.isEmbedded) {
      return { running: true, embedded: false };
    }

    return new Promise((resolve) => {
      const pgCtl = path.join(this.binDir, "pg_ctl.exe");

      exec(`"${pgCtl}" status -D "${this.dataDir}"`, (error, stdout) => {
        const running = stdout.includes("server is running");
        resolve({ running, embedded: true, dataDir: this.dataDir });
      });
    });
  }

  /**
   * Obtiene la configuración de conexión
   */
  getConnectionConfig() {
    return {
      host: "localhost",
      port: 5432,
      database: "ludoteca_pos",
      user: "ludoteca_user",
      password: "ludoteca2024",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
}

module.exports = new PostgresManager();
