const { pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { initializeDatabase, runAsync, closeDatabase } = require("./src-electron/database-pg.cjs");

async function runMigration() {
  try {
    await initializeDatabase();
    
    try {
      await runAsync("ALTER TABLE quotations ADD COLUMN client_address VARCHAR(255);");
    } catch (e) {
      if (e.message.includes("already exists")) {
      } else {
        console.error("Error adding client_address column:", e.message);
      }
    }

    await closeDatabase();
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigration();
