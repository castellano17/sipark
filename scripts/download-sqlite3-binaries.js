#!/usr/bin/env node

/**
 * Script para descargar binarios precompilados de sqlite3 para Windows
 * Se ejecuta antes de compilar para asegurar compatibilidad cross-platform
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("📦 Descargando binarios de sqlite3 para Windows...");

const sqlite3Path = path.join(__dirname, "..", "node_modules", "sqlite3");

if (!fs.existsSync(sqlite3Path)) {
  console.log("❌ sqlite3 no está instalado. Ejecuta: npm install");
  process.exit(1);
}

try {
  // Descargar binarios precompilados para Windows
  process.chdir(sqlite3Path);

  console.log("Descargando binarios para Windows x64...");
  execSync(
    "npm run install --target_platform=win32 --target_arch=x64 --fallback-to-build=false",
    {
      stdio: "inherit",
      env: {
        ...process.env,
        npm_config_platform: "win32",
        npm_config_arch: "x64",
      },
    },
  );

  console.log("✅ Binarios de sqlite3 para Windows descargados correctamente");
} catch (error) {
  console.log("⚠️  No se pudieron descargar los binarios precompilados");
  console.log("   El empaquetador intentará usar los binarios existentes");
}

process.chdir(path.join(__dirname, ".."));
