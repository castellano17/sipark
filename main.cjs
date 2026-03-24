const { app, BrowserWindow, ipcMain, shell, screen } = require("electron");
const path = require("path");
const fs = require("fs");
// Detectar si estamos en desarrollo sin dependencias externas
const isDev = !app.isPackaged;
const { initializeDatabase } = require("./src-electron/database-pg.cjs");
const { seedDatabase } = require("./src-electron/seed.cjs");
const api = require("./src-electron/api.cjs");
const printerModule = require("./src-electron/printer.cjs");
const fileHandler = require("./src-electron/file-handler.cjs");
const backup = require("./src-electron/backup.cjs");
const backupEmail = require("./src-electron/backup-email.cjs");
const backupGDrive = require("./src-electron/backup-gdrive.cjs");
const backupScheduler = require("./src-electron/backup-scheduler.cjs");
const pdfGenerator = require("./src-electron/pdf-generator.cjs");
const quotationsApi = require("./src-electron/quotations-api.cjs");
const reservationsApi = require("./src-electron/reservations-api.cjs");
const nfcApi = require("./src-electron/nfc-api.cjs");
const promotionsApi = require("./src-electron/promotions-api.cjs");
const nfcHid = require("./src-electron/nfc-hid.cjs");

// =========== SERVIDOR LOCAL WIFI (EXPRESS) ===========
const express = require('express');
const cors = require('cors');

// Interceptar ipcMain.handle para poder usarlos en el backend de Express
const registeredHandlers = {};
const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = function(channel, listener) {
  registeredHandlers[channel] = listener;
  return originalHandle(channel, listener);
};

function startLocalServer() {
  try {
    const server = express();
    server.use(cors());
    server.use(express.json({ limit: '50mb' }));

    // Endpoint universal que conecta fetch() de la web con ipcMain de Electron
    server.post('/api/rpc/:method', async (req, res) => {
      // El frontend mandará el método sin 'api:', se lo agregamos
      const channel = "api:" + req.params.method;
      const args = req.body.args || [];
      const handler = registeredHandlers[channel];
      
      if (handler) {
        try {
          // Inyectamos un objeto evento vacío como primer parámetro, igual que Electron
          const mockEvent = { sender: null };
          const result = await handler(mockEvent, ...args);
          res.json({ success: true, data: result });
        } catch (err) {
          console.error(`[RPC Error] ${channel}:`, err);
          res.status(500).json({ success: false, error: err.message });
        }
      } else {
        res.status(404).json({ success: false, error: 'Endpoint no encontrado: ' + channel });
      }
    });

    // Servir archivos de publicidad desde Documentos
    const adsDir = path.join(app.getPath('documents'), 'SIPARK', 'Publicidad');
    if (!fs.existsSync(adsDir)) {
      fs.mkdirSync(adsDir, { recursive: true });
    }
    server.use('/ads', express.static(adsDir));

    // Servir carpeta de marca (Logos)
    const brandDir = path.join(app.getPath('userData'), 'brand');
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true });
    }
    server.use('/brand', express.static(brandDir));

    // Ruta para el favicon dinámico
    server.get('/favicon.ico', async (req, res) => {
      try {
        const api = require('./src-electron/api.cjs');
        const logoName = await api.getSetting("system_logo");
        if (logoName) {
          const logoPath = path.join(brandDir, logoName);
          if (fs.existsSync(logoPath)) {
            return res.sendFile(logoPath);
          }
        }
      } catch (e) {}
      // Fallback al icono por defecto
      const defaultIcon = path.join(__dirname, isDev ? 'public/icon.png' : 'dist/icon.png');
      if (fs.existsSync(defaultIcon)) {
        res.sendFile(defaultIcon);
      } else {
        res.status(404).send();
      }
    });

    // Servir archivos estáticos del build de React (la carpeta 'dist')
    const distPath = path.join(__dirname, 'dist');
    server.use(express.static(distPath));

    // Fallback para React Router (usando middleware global en vez de '*')
    server.use((req, res) => res.sendFile(path.join(distPath, 'index.html')));

    // El puerto 80 es el puerto por defecto de internet, por lo que desaparece de la URL (no hay que escribir :80 ni :9595)
    // En desarrollo (isDev) mantenemos 9595 porque Mac/Linux bloquean el puerto 80 sin permisos sudo.
    // NOTA PARA WINDOWS: Si el .exe falla al abrir, es porque otro programa (ej. Skype/XAMPP/IIS) ya usa el puerto 80.
    const HTTP_PORT = isDev ? 9595 : 80;
    server.listen(HTTP_PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor de RED LOCAL activado en http://LOCAL_IP:${HTTP_PORT}`);
    });
  } catch(e) {
    console.error("Error iniciando servidor Express:", e.message);
  }
}
// =====================================================

// Hot reload en desarrollo
if (isDev) {
  try {
    require("electron-reloader")(module);
  } catch (_) {
    // Ignorar si electron-reloader no está disponible en producción
  }
}

let mainWindow;
let customerWindow = null;

async function initializeApp() {
  try {

    // Inicializar base de datos
    await initializeDatabase();
    await seedDatabase();

  } catch (error) {
    console.error("❌ Error inicializando aplicación:", error);
    console.error("\n⚠️  POSTGRESQL NO ESTÁ CORRIENDO O NO ESTÁ CONFIGURADO");
    console.error("📋 Pasos para solucionar:");
    console.error(
      "   1. Instala PostgreSQL desde https://www.postgresql.org/download/",
    );
    console.error("   2. Asegúrate de que el servicio esté corriendo");
    console.error(
      "   3. Crea la base de datos y usuario con el script setup-database.sql",
    );
    console.error("   4. Verifica que las credenciales sean correctas\n");
    throw error;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false, // No mostrar hasta que esté lista y maximizada
    icon: path.join(__dirname, isDev ? "public/icon.png" : "dist/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // La marca (nombre e icono) se aplica dinámicamente en ready-to-show

  // En producción, cargar la URL desde dist
  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "dist", "index.html")}`;

  mainWindow.loadURL(startUrl);
  
  // Maximizar y mostrar cuando esté lista la URL
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    applyBranding();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (customerWindow) {
      customerWindow.close();
    }
  });

  // Configurar Segunda Pantalla (Customer Display)
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  const externalDisplay = displays.find((display) => display.id !== primaryDisplay.id);

  if (externalDisplay) {
    customerWindow = new BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      width: externalDisplay.bounds.width,
      height: externalDisplay.bounds.height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      kiosk: true, // Modo Quiosco para ocultar barra de tareas y bloquear salida
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
      },
    });

    const customerUrl = startUrl + (startUrl.includes("?") ? "&" : "?") + "view=customer";
    customerWindow.loadURL(customerUrl);
    
    // Forzar pantalla completa en Windows
    customerWindow.once('ready-to-show', () => {
      customerWindow.setFullScreen(true);
      customerWindow.removeMenu();
    });

    customerWindow.on("closed", () => {
      customerWindow = null;
    });
  }
}

async function applyBranding() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    // Si la API aún no está lista, esperamos un poco
    const api = require('./src-electron/api.cjs');
    
    const systemName = await api.getSetting("system_name").catch(() => "SIPARK") || "SIPARK";
    const logoName = await api.getSetting("system_logo").catch(() => null);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitle(systemName);

      if (logoName) {
        const logoPath = path.join(app.getPath('userData'), 'brand', logoName);
        if (fs.existsSync(logoPath)) {
          mainWindow.setIcon(logoPath);
          if (process.platform === 'darwin') {
            app.dock.setIcon(logoPath);
          }
        }
      }
      
      if (customerWindow && !customerWindow.isDestroyed()) {
        customerWindow.setTitle(`${systemName} - Visor de Cliente`);
      }
    }
  } catch (err) {
    console.error("Error aplicando branding dinámico:", err);
  }
}

// Inicializar BD antes de crear ventana
app.on("ready", async () => {
  try {
    // Inicializar PostgreSQL embebido y base de datos
    await initializeApp();

    // Crear primer admin si no existen usuarios
    try {
      const result = await api.createFirstAdmin();
    } catch (error) {
    }

    setupIpcHandlers();
    createWindow();
    
    // Iniciar listener de node-hid para el lector NFC Exclusivo
    nfcHid.startListening(mainWindow, customerWindow);

    // Iniciar Servidor Red Local
    startLocalServer();

    // Iniciar programador de respaldos automáticos
    // TODO: Implementar backups para PostgreSQL
    // backupScheduler.startBackupScheduler();
  } catch (error) {
    console.error("Error en app ready:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ============ IPC HANDLERS ============

// Función para transmitir eventos a la pantalla secundaria
ipcMain.handle("api:broadcastToCustomer", async (event, payload) => {
  if (customerWindow && !customerWindow.isDestroyed()) {
    customerWindow.webContents.send("customer-event", payload);
    return true;
  }
  return false;
});

// Función para mostrar/ocultar interfaz de anuncios haciendo transparente la TV
ipcMain.handle("api:toggleAdsWindow", async (event, hidden) => {
  if (customerWindow && !customerWindow.isDestroyed()) {
    if (hidden) {
      customerWindow.setIgnoreMouseEvents(true, { forward: true });
      customerWindow.webContents.send("customer-event", { action: 'TOGGLE_ADS', hidden: true });
    } else {
      customerWindow.setIgnoreMouseEvents(false);
      customerWindow.webContents.send("customer-event", { action: 'TOGGLE_ADS', hidden: false });
    }
    return true;
  }
  return false;
});

// Función para actualizar el icono de la aplicación dinámicamente
ipcMain.handle("api:updateAppIcon", async (event, logoPath) => {
  if (mainWindow && !mainWindow.isDestroyed() && logoPath && fs.existsSync(logoPath)) {
    try {
      mainWindow.setIcon(logoPath);
      if (customerWindow && !customerWindow.isDestroyed()) {
        customerWindow.setIcon(logoPath);
      }
      return true;
    } catch (e) {
      console.error("Error actualizando icono:", e);
      return false;
    }
  }
  return false;
});

ipcMain.handle("api:getAdFiles", async () => {
  const fs = require('fs');
  const path = require('path');
  const docsPath = app.getPath('documents');
  const adsDir = path.join(docsPath, 'SIPARK', 'Publicidad');
  // Determinar puerto basándose en si es dev o no
  const HTTP_PORT = isDev ? 9595 : 80;

  try {
    if (!fs.existsSync(adsDir)) {
      fs.mkdirSync(adsDir, { recursive: true });
    }
    const files = fs.readdirSync(adsDir);
    const mediaFiles = files
      .filter((file) => /\.(mp4|webm|jpg|jpeg|png|webp|gif)$/i.test(file))
      .map((file) => {
        const type = /\.(mp4|webm)$/i.test(file) ? 'video' : 'image';
        // Construir URL absoluta para evitar problemas de ruteo
        const src = `http://localhost:${HTTP_PORT}/ads/${file}`;
        return {
          type,
          src,
          duration: type === 'image' ? 10000 : undefined
        };
      });
    return mediaFiles;
  } catch (error) {
    console.error("Error leyendo directorio de publicidad:", error);
    return [];
  }
});

function setupIpcHandlers() {
  // Detectar dispositivos USB conectados (cajón + lectores NFC)
  ipcMain.handle("api:getConnectedDevices", async () => {
    const { execFile } = require("child_process");
    const { promisify } = require("util");
    const execFileAsync = promisify(execFile);

    let usbOutput = "";
    try {
      if (process.platform === "darwin") {
        // macOS
        const { stdout } = await execFileAsync("system_profiler", ["SPUSBDataType"], { timeout: 5000 });
        usbOutput = stdout;
      } else if (process.platform === "win32") {
        // Windows
        const { stdout } = await execFileAsync("wmic", ["path", "Win32_PnPEntity", "get", "Caption,Description,Name"], { timeout: 5000 });
        usbOutput = stdout;
      } else {
        // Linux
        const { stdout } = await execFileAsync("lsusb", [], { timeout: 5000 });
        usbOutput = stdout;
      }
    } catch (e) {
      console.warn("Error listando dispositivos USB:", e.message);
    }

    // Detectar lectores NFC por nombres comunes en la salida
    const nfcKeywords = ["ACR", "ACS", "NFC", "RFID", "HID Global", "Feitian", "Identiv", "RF IDeas", "uTrust", "OmniKey"];
    const nfcCount = nfcKeywords.reduce((count, kw) => {
      const regex = new RegExp(kw, "gi");
      const matches = (usbOutput.match(regex) || []).length;
      return count + (matches > 0 ? 1 : 0); // contar dispositivo único por keyword
    }, 0);

    // Cajón de dinero: si hay una impresora configurada se asume disponible
    let drawerAvailable = false;
    try {
      const printers = mainWindow?.webContents.getPrintersAsync
        ? await mainWindow.webContents.getPrintersAsync()
        : mainWindow?.webContents.getPrinters?.() || [];
      drawerAvailable = Array.isArray(printers) && printers.length > 0;
    } catch (e) {
      drawerAvailable = false;
    }

    return {
      nfcReaders: Math.min(nfcCount, 5), // máx 5 para evitar falsos positivos
      drawerAvailable,
      rawOutput: usbOutput.substring(0, 200), // debug limitado
    };
  });

  // Clients
  ipcMain.handle("api:getClients", () => api.getClients());
  ipcMain.handle("api:createClient", (event, data) =>
    api.createClient(
      data.name,
      data.parentName,
      data.phone,
      data.emergencyPhone,
      data.email,
      data.childName,
      data.childAge,
      data.allergies,
      data.specialNotes,
    ),
  );
  ipcMain.handle("api:updateClient", (event, data) =>
    api.updateClient(
      data.id,
      data.name,
      data.parentName,
      data.phone,
      data.emergencyPhone,
      data.email,
      data.childName,
      data.childAge,
      data.allergies,
      data.specialNotes,
    ),
  );
  ipcMain.handle("api:deleteClient", (event, data) =>
    api.deleteClient(data.id),
  );
  ipcMain.handle("api:getClientById", (event, clientId) =>
    api.getClientById(clientId),
  );

  // Sessions
  ipcMain.handle("api:startSession", (event, data) =>
    api.startSession(data.clientId, data.packageId, data.durationMinutes),
  );
  ipcMain.handle("api:getActiveSessions", () => api.getActiveSessions());
  ipcMain.handle("api:endSession", (event, data) =>
    api.endSession(data.sessionId, data.finalPrice),
  );

  // Products/Services
  ipcMain.handle("api:getProductsServices", () => api.getProductsServices());
  ipcMain.handle("api:createProductService", (event, data) =>
    api.createProductService(
      data.name,
      data.price,
      data.type,
      data.category,
      data.barcode,
      data.stock,
      data.durationMinutes,
    ),
  );
  ipcMain.handle("api:updateProductService", (event, data) =>
    api.updateProductService(
      data.id,
      data.name,
      data.price,
      data.type,
      data.category,
      data.barcode,
      data.stock,
      data.durationMinutes,
    ),
  );
  ipcMain.handle("api:deleteProductService", (event, data) =>
    api.deleteProductService(data.id),
  );

  // Sales
  ipcMain.handle("api:getSales", (event, limit) => api.getSales(limit));

  // NFC
  ipcMain.handle("api:getNfcCardByUid", (event, uid) => nfcApi.getNfcCardByUid(uid));
  ipcMain.handle("api:assignNfcCard", (event, data) => 
    nfcApi.assignNfcCard(data.clientMembershipId, data.uid, data.clientId)
  );
  ipcMain.handle("api:rechargeNfcCard", (event, data) => 
    nfcApi.rechargeNfcCard(data.clientMembershipId, data.amount, data.saleId, data.userId)
  );
  ipcMain.handle("api:chargeNfcEntry", (event, data) => 
    nfcApi.chargeNfcEntry(data.uid, data.amount, data.userId)
  );
  ipcMain.handle("api:refundNfcCard", (event, data) => 
    nfcApi.refundNfcCard(data.clientMembershipId, data.amount, data.reason, data.userId)
  );
  ipcMain.handle("api:getNfcTransactions", (event, clientMembershipId) => 
    nfcApi.getNfcTransactions(clientMembershipId)
  );
  ipcMain.handle("api:applyBranding", () => applyBranding());
  
  // NFC Hardware Devices
  ipcMain.handle("api:getHidDevices", () => nfcHid.getAvailableDevices());
  ipcMain.handle("api:restartNfcListener", async () => {
    // restart global listener
    return nfcHid.startListening(mainWindow, customerWindow);
  });

  // Promotions
  ipcMain.handle("api:createCampaign", (event, data) => promotionsApi.createCampaign(data));
  ipcMain.handle("api:getCampaigns", (event, status) => promotionsApi.getCampaigns(status));
  ipcMain.handle("api:getCampaignById", (event, id) => promotionsApi.getCampaignById(id));
  ipcMain.handle("api:updateCampaignStatus", (event, { id, status }) =>
    promotionsApi.updateCampaignStatus(id, status)
  );
  ipcMain.handle("api:getVoucherByCode", (event, code) => promotionsApi.getVoucherByCode(code));
  ipcMain.handle("api:redeemVoucher", (event, data) => promotionsApi.redeemVoucher(data));
  ipcMain.handle("api:getVoucherRedemptions", (event, campaignId) =>
    promotionsApi.getVoucherRedemptions(campaignId)
  );
  ipcMain.handle("api:deactivateVoucher", (event, voucherId) =>
    promotionsApi.deactivateVoucher(voucherId)
  );
  ipcMain.handle("api:getVouchersForPrint", (event, { campaignId, voucherIds }) =>
    promotionsApi.getVouchersForPrint(campaignId, voucherIds)
  );
  ipcMain.handle("api:getBusinessSettings", () => promotionsApi.getBusinessSettings());

  // Stats
  ipcMain.handle("api:getDailyStats", () => api.getDailyStats());
  ipcMain.handle("api:getExecutiveDashboard", () =>
    api.getExecutiveDashboard(),
  );

  // Reports
  ipcMain.handle(
    "api:getSalesByPeriod",
    (event, { startDate, endDate, paymentMethod }) =>
      api.getSalesByPeriod(startDate, endDate, paymentMethod),
  );
  ipcMain.handle("api:getCashBoxReport", (event, cashBoxId) =>
    api.getCashBoxReport(cashBoxId),
  );
  ipcMain.handle("api:getCashBoxes", () => api.getCashBoxes());
  ipcMain.handle(
    "api:getStockReport",
    (event, { categoryFilter, lowStockOnly }) =>
      api.getStockReport(categoryFilter, lowStockOnly),
  );
  ipcMain.handle(
    "api:getTopClientsReport",
    (event, { startDate, endDate, limit }) =>
      api.getTopClientsReport(startDate, endDate, limit),
  );

  // Reports - Fase 2
  ipcMain.handle(
    "api:getSalesByProduct",
    (event, { startDate, endDate, categoryFilter }) =>
      api.getSalesByProduct(startDate, endDate, categoryFilter),
  );
  ipcMain.handle("api:getCashFlowReport", (event, { startDate, endDate }) =>
    api.getCashFlowReport(startDate, endDate),
  );
  ipcMain.handle(
    "api:getInventoryMovements",
    (event, { startDate, endDate, productFilter }) =>
      api.getInventoryMovements(startDate, endDate, productFilter),
  );
  ipcMain.handle(
    "api:getPurchasesByPeriod",
    (event, { startDate, endDate, supplierFilter }) =>
      api.getPurchasesByPeriod(startDate, endDate, supplierFilter),
  );
  ipcMain.handle(
    "api:getSessionsByPeriod",
    (event, { startDate, endDate, packageFilter }) =>
      api.getSessionsByPeriod(startDate, endDate, packageFilter),
  );

  // Reports - Fase 3
  ipcMain.handle(
    "api:getSalesByPaymentMethod",
    (event, { startDate, endDate }) =>
      api.getSalesByPaymentMethod(startDate, endDate),
  );
  ipcMain.handle("api:getSalesByHour", (event, { startDate, endDate }) =>
    api.getSalesByHour(startDate, endDate),
  );
  ipcMain.handle("api:getProductsWithoutMovement", (event, { days }) =>
    api.getProductsWithoutMovement(days),
  );
  ipcMain.handle(
    "api:getPurchasesBySupplier",
    (event, { startDate, endDate }) =>
      api.getPurchasesBySupplier(startDate, endDate),
  );
  ipcMain.handle(
    "api:getMostPurchasedProducts",
    (event, { startDate, endDate, limit }) =>
      api.getMostPurchasedProducts(startDate, endDate, limit),
  );
  ipcMain.handle(
    "api:getPurchaseOrdersHistory",
    (event, { startDate, endDate, supplierId }) =>
      api.getPurchaseOrdersHistory(startDate, endDate, supplierId),
  );
  ipcMain.handle(
    "api:getFrequentClients",
    (event, { startDate, endDate, minVisits }) =>
      api.getFrequentClients(startDate, endDate, minVisits),
  );
  ipcMain.handle("api:getInactiveClients", (event, { days }) =>
    api.getInactiveClients(days),
  );

  // Reports - Fase 3 Adicionales
  ipcMain.handle(
    "api:getSalesByClient",
    (event, { startDate, endDate, limit }) =>
      api.getSalesByClient(startDate, endDate, limit),
  );
  ipcMain.handle(
    "api:getSalesComparison",
    (event, { period1Start, period1End, period2Start, period2End }) =>
      api.getSalesComparison(
        period1Start,
        period1End,
        period2Start,
        period2End,
      ),
  );
  ipcMain.handle("api:getIncomeVsExpenses", (event, { startDate, endDate }) =>
    api.getIncomeVsExpenses(startDate, endDate),
  );
  ipcMain.handle("api:getInventoryValuation", (event, { categoryFilter }) =>
    api.getInventoryValuation(categoryFilter),
  );
  ipcMain.handle("api:getActiveClients", (event, { days }) =>
    api.getActiveClients(days),
  );
  ipcMain.handle("api:getNewClients", (event, { startDate, endDate }) =>
    api.getNewClients(startDate, endDate),
  );
  ipcMain.handle(
    "api:getBestSellingPackages",
    (event, { startDate, endDate }) =>
      api.getBestSellingPackages(startDate, endDate),
  );
  ipcMain.handle(
    "api:getAverageSessionDuration",
    (event, { startDate, endDate, packageFilter }) =>
      api.getAverageSessionDuration(startDate, endDate, packageFilter),
  );
  ipcMain.handle("api:getHourlyOccupancy", (event, { startDate, endDate }) =>
    api.getHourlyOccupancy(startDate, endDate),
  );
  ipcMain.handle("api:getActiveMemberships", (event, { statusFilter }) =>
    api.getActiveMemberships(statusFilter),
  );
  ipcMain.handle("api:getExpiringMemberships", (event, { daysThreshold }) =>
    api.getExpiringMemberships(daysThreshold),
  );
  ipcMain.handle(
    "api:getSessionsHistory",
    (event, { startDate, endDate, clientId, status }) =>
      api.getSessionsHistory(startDate, endDate, clientId, status),
  );
  ipcMain.handle(
    "api:getDiscountsReport",
    (event, { startDate, endDate, minDiscount, maxDiscount }) =>
      api.getDiscountsReport(startDate, endDate, minDiscount, maxDiscount),
  );
  ipcMain.handle("api:getDailyCashSummary", (event, date) =>
    api.getDailyCashSummary(date),
  );

  // Audit Reports
  ipcMain.handle(
    "api:getUserActivityReport",
    (event, { startDate, endDate, userId, actionType }) =>
      api.getUserActivityReport(startDate, endDate, userId, actionType),
  );
  ipcMain.handle(
    "api:getInventoryChangesReport",
    (event, { startDate, endDate, userId, productId }) =>
      api.getInventoryChangesReport(startDate, endDate, userId, productId),
  );
  ipcMain.handle(
    "api:getSystemAccessReport",
    (event, { startDate, endDate, userId }) =>
      api.getSystemAccessReport(startDate, endDate, userId),
  );
  ipcMain.handle(
    "api:getPriceChangesReport",
    (event, { startDate, endDate, productId }) =>
      api.getPriceChangesReport(startDate, endDate, productId),
  );
  ipcMain.handle(
    "api:getSalesAuditReport",
    (event, { startDate, endDate, userId, action }) =>
      api.getSalesAuditReport(startDate, endDate, userId, action),
  );

  // Settings
  ipcMain.handle("api:getSetting", (event, key) => api.getSetting(key));
  ipcMain.handle("api:setSetting", (event, data) =>
    api.setSetting(data.key, data.value),
  );
  ipcMain.handle("api:getAllSettings", () => api.getAllSettings());
  ipcMain.handle("api:selectSystemLogo", () => api.selectSystemLogo());

  // Sessions - Check-in
  ipcMain.handle("api:createSession", (event, data) =>
    api.createSession(
      data.clientName,
      data.parentName,
      data.phone,
      data.packageId,
      data.durationMinutes,
      data.isPaid,
    ),
  );
  ipcMain.handle("api:startTimerSession", (event, sessionId) =>
    api.startTimerSession(sessionId),
  );
  ipcMain.handle("api:updateSessionPaidStatus", (event, data) =>
    api.updateSessionPaidStatus(data.sessionId, data.isPaid),
  );

  // Health Check
  ipcMain.handle("api:checkDatabaseConnection", () =>
    api.checkDatabaseConnection(),
  );

  // Printers
  ipcMain.handle("api:getPrinters", () => printerModule.getPrinters());
  ipcMain.handle("api:getDefaultPrinter", () =>
    printerModule.getDefaultPrinter(),
  );
  ipcMain.handle("api:printTestTicket", (event, printerName) =>
    printerModule.printTestTicket(printerName),
  );
  ipcMain.handle("api:printTestNormal", (event, printerName) =>
    printerModule.printTestNormal(printerName),
  );
  ipcMain.handle("api:printTicket", (event, printerName, content) =>
    printerModule.printTicket(printerName, content),
  );
  ipcMain.handle("api:printHtmlSilent", async (event, htmlContent) => {
    try {
      const ticketPrinter = await api.getSetting("ticket_printer");
      if (!ticketPrinter) return false;

      const win = new BrowserWindow({ show: false, width: 300, height: 600 });
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      return new Promise((resolve) => {
        setTimeout(() => {
          win.webContents.print({
            silent: true,
            deviceName: ticketPrinter,
            margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 }
          }, (success) => {
            win.close();
            resolve(success);
          });
        }, 800);
      });
    } catch (e) {
      console.error(e);
      return false;
    }
  });
  ipcMain.handle("api:openCashDrawer", (event, data) =>
    api.openCashDrawerWithAudit(data.userId, data.printerName, data.reason),
  );

  // Cash Box
  ipcMain.handle("api:openCashBox", (event, data) =>
    api.openCashBox(data.openingAmount, data.openedBy),
  );
  ipcMain.handle("api:getActiveCashBox", () => api.getActiveCashBox());
  ipcMain.handle("api:closeCashBox", (event, data) =>
    api.closeCashBox(
      data.cashBoxId,
      data.closingAmount,
      data.closedBy,
      data.notes,
    ),
  );
  ipcMain.handle("api:addCashMovement", (event, data) =>
    api.addCashMovement(
      data.cashBoxId,
      data.type,
      data.amount,
      data.description,
    ),
  );
  ipcMain.handle("api:getCashBoxMovements", (event, cashBoxId) =>
    api.getCashBoxMovements(cashBoxId),
  );
  ipcMain.handle("api:getCashBoxSales", (event, cashBoxId) =>
    api.getCashBoxSales(cashBoxId),
  );

  // PDF Generation
  ipcMain.handle("api:generateOpeningPDF", async (event, cashBoxData) => {
    const filepath = await pdfGenerator.generateOpeningPDF(cashBoxData);
    shell.openPath(filepath); // Abrir el PDF automáticamente
    return filepath;
  });
  ipcMain.handle("api:generateClosingPDF", async (event, closeData) => {
    const filepath = await pdfGenerator.generateClosingPDF(closeData);
    shell.openPath(filepath); // Abrir el PDF automáticamente
    return filepath;
  });
  ipcMain.handle("api:generateDailyCashSummaryPDF", async (event, data) => {
    const filepath = await pdfGenerator.generateDailyCashSummaryPDF(data.data, data.selectedDate);
    shell.openPath(filepath);
    return filepath;
  });
  ipcMain.handle("api:exportPDF", async (event, options) => {
    const filepath = await pdfGenerator.generateGenericReport(options);
    shell.openPath(filepath);
    return filepath;
  });

  // Sales with Items
  ipcMain.handle("api:createSaleWithItems", (event, saleData) =>
    api.createSaleWithItems(saleData),
  );
  ipcMain.handle("api:getSaleWithItems", (event, saleId) =>
    api.getSaleWithItems(saleId),
  );

  // Waiter Orders
  ipcMain.handle("api:createWaiterOrder", (event, orderData) =>
    api.createWaiterOrder(orderData),
  );
  ipcMain.handle("api:getPendingWaiterOrders", () =>
    api.getPendingWaiterOrders(),
  );
  ipcMain.handle("api:updateWaiterOrderStatus", (event, data) =>
    api.updateWaiterOrderStatus(data.orderId, data.status),
  );
  ipcMain.handle("api:deleteWaiterOrder", (event, orderId) =>
    api.deleteWaiterOrder(orderId),
  );

  // Inventory
  ipcMain.handle("api:getInventoryProducts", () => api.getInventoryProducts());
  ipcMain.handle("api:updateProductStock", (event, data) =>
    api.updateProductStock(data.productId, data.newStock),
  );
  ipcMain.handle("api:updateProductCategory", (event, data) =>
    api.updateProductCategory(data.productId, data.category),
  );
  ipcMain.handle("api:adjustProductStock", (event, data) =>
    api.adjustProductStock(
      data.productId,
      data.adjustment,
      data.reason,
      data.notes,
      data.createdBy,
    ),
  );
  ipcMain.handle("api:getStockAdjustments", (event, productId, limit) =>
    api.getStockAdjustments(productId, limit),
  );
  ipcMain.handle("api:getLowStockProducts", (event, threshold) =>
    api.getLowStockProducts(threshold),
  );

  // Suppliers
  ipcMain.handle("api:getSuppliers", () => api.getSuppliers());
  ipcMain.handle("api:createSupplier", (event, data) =>
    api.createSupplier(
      data.name,
      data.contactName,
      data.phone,
      data.email,
      data.address,
      data.notes,
    ),
  );
  ipcMain.handle("api:updateSupplier", (event, data) =>
    api.updateSupplier(
      data.id,
      data.name,
      data.contactName,
      data.phone,
      data.email,
      data.address,
      data.notes,
    ),
  );
  ipcMain.handle("api:deleteSupplier", (event, data) =>
    api.deleteSupplier(data.id),
  );

  // Categories
  ipcMain.handle("api:getCategories", () => api.getCategories());
  ipcMain.handle("api:createCategory", async (event, data) => {
    try {
      const result = await api.createCategory(data.name, data.description);
      return result;
    } catch (error) {
      throw error;
    }
  });
  ipcMain.handle("api:updateCategory", (event, data) =>
    api.updateCategory(data.id, data.name, data.description),
  );
  ipcMain.handle("api:deleteCategory", (event, data) =>
    api.deleteCategory(data.id),
  );

  // Purchase Orders
  ipcMain.handle("api:createPurchaseOrder", (event, purchaseData) =>
    api.createPurchaseOrder(purchaseData),
  );
  ipcMain.handle("api:getPurchaseOrders", (event, limit) =>
    api.getPurchaseOrders(limit),
  );
  ipcMain.handle("api:getPurchaseOrderWithItems", (event, purchaseOrderId) =>
    api.getPurchaseOrderWithItems(purchaseOrderId),
  );

  // Database Cleanup
  ipcMain.handle("api:clearAllData", () => api.clearAllData());

  // Memberships
  ipcMain.handle("api:getMemberships", () => api.getMemberships());
  ipcMain.handle("api:createMembership", (event, data) =>
    api.createMembership(
      data.name,
      data.description,
      data.price,
      data.durationDays,
      data.autoRenew,
      data.isActive,
      data.totalHours,
    ),
  );
  ipcMain.handle("api:updateMembership", (event, data) =>
    api.updateMembership(
      data.id,
      data.name,
      data.description,
      data.price,
      data.durationDays,
      data.autoRenew,
      data.isActive,
      data.totalHours,
    ),
  );
  ipcMain.handle("api:deleteMembership", (event, data) =>
    api.deleteMembership(data.id),
  );

  // Client Memberships
  ipcMain.handle("api:getClientMemberships", (event, clientId) =>
    api.getClientMemberships(clientId),
  );
  ipcMain.handle("api:assignMembership", (event, data) =>
    api.assignMembership(
      data.clientId,
      data.membershipId,
      data.paymentAmount,
      data.notes,
      data.createdBy,
      data.phone,
      data.id_card,
      data.acquisition_date,
      data.total_hours
    ),
  );
  ipcMain.handle("api:cancelClientMembership", (event, data) =>
    api.cancelClientMembership(data.id, data.canceledBy),
  );
  ipcMain.handle("api:recordMembershipRenewal", (event, renewalData) =>
    api.recordMembershipRenewal(renewalData),
  );

  // Client Visits
  ipcMain.handle("api:getClientVisits", (event, clientId, limit) =>
    api.getClientVisits(clientId, limit),
  );
  ipcMain.handle("api:createClientVisit", (event, data) =>
    api.createClientVisit(
      data.clientId,
      data.visitDate,
      data.checkInTime,
      data.amountPaid,
      data.notes,
      data.createdBy,
    ),
  );
  ipcMain.handle("api:updateClientVisitCheckout", (event, data) =>
    api.updateClientVisitCheckout(
      data.visitId,
      data.checkOutTime,
      data.durationMinutes,
    ),
  );

  // Package Features
  ipcMain.handle("api:getPackageFeatures", () => api.getPackageFeatures());
  ipcMain.handle("api:createPackageFeature", (event, data) =>
    api.createPackageFeature(data.name, data.description, data.category, data.requires_quantity),
  );
  ipcMain.handle("api:updatePackageFeature", (event, data) =>
    api.updatePackageFeature(
      data.id,
      data.name,
      data.description,
      data.category,
      data.requires_quantity,
    ),
  );
  ipcMain.handle("api:deletePackageFeature", (event, data) =>
    api.deletePackageFeature(data.id),
  );
  ipcMain.handle("api:getPackageIncludedFeatures", (event, packageId) =>
    api.getPackageIncludedFeatures(packageId),
  );
  ipcMain.handle("api:setPackageFeatures", (event, data) =>
    api.setPackageFeatures(data.packageId, data.featureIds),
  );

  // Package Feature Categories
  ipcMain.handle("api:getPackageFeatureCategories", () =>
    api.getPackageFeatureCategories(),
  );
  ipcMain.handle("api:createPackageFeatureCategory", (event, data) =>
    api.createPackageFeatureCategory(data.name, data.description),
  );
  ipcMain.handle("api:updatePackageFeatureCategory", (event, data) =>
    api.updatePackageFeatureCategory(data.id, data.name, data.description),
  );
  ipcMain.handle("api:deletePackageFeatureCategory", (event, data) =>
    api.deletePackageFeatureCategory(data.id),
  );

  // User Management
  ipcMain.handle("api:createFirstAdmin", () => api.createFirstAdmin());
  ipcMain.handle("api:authenticateUser", (event, data) =>
    api.authenticateUser(data.username, data.password),
  );
  ipcMain.handle("api:getUsers", () => api.getUsers());
  ipcMain.handle("api:getUserById", (event, userId) => api.getUserById(userId));
  ipcMain.handle("api:createUser", (event, data) =>
    api.createUser(data.userData, data.createdBy),
  );
  ipcMain.handle("api:updateUser", (event, data) =>
    api.updateUser(data.userId, data.userData, data.updatedBy),
  );
  ipcMain.handle("api:changePassword", (event, data) =>
    api.changePassword(data.userId, data.newPassword, data.changedBy),
  );
  ipcMain.handle("api:deleteUser", (event, data) =>
    api.deleteUser(data.userId, data.deletedBy),
  );
  ipcMain.handle("api:getUserAuditLog", (event, limit) =>
    api.getUserAuditLog(limit),
  );
  ipcMain.handle("api:checkPermission", (event, data) =>
    api.checkPermission(data.userId, data.module, data.action),
  );

  // File Handlers (Logos)
  ipcMain.handle("file:saveLogo", (event, data) =>
    fileHandler.saveLogo(data.type, data.base64Data, data.extension),
  );
  ipcMain.handle("file:getLogo", (event, type) => fileHandler.getLogo(type));
  ipcMain.handle("file:deleteLogo", (event, type) =>
    fileHandler.deleteLogo(type),
  );

  // Backup Handlers
  ipcMain.handle("backup:createLocal", () => backup.createBackupWithDialog());
  ipcMain.handle("backup:restore", () => backup.restoreWithDialog());
  ipcMain.handle("backup:list", () => backup.listBackups());
  ipcMain.handle("backup:createAuto", () => backup.createAutoBackup());

  // Email Backup
  ipcMain.handle("backup:sendEmail", (event, config) =>
    backupEmail.sendBackupByEmail(config),
  );
  ipcMain.handle("backup:validateEmail", (event, config) =>
    backupEmail.validateEmailConfig(config),
  );

  // Google Drive Backup
  ipcMain.handle("backup:uploadGDrive", (event, data) =>
    backupGDrive.uploadToGoogleDrive(data.credentials, data.folderId),
  );
  ipcMain.handle("backup:listGDrive", (event, data) =>
    backupGDrive.listGoogleDriveBackups(data.credentials, data.folderId),
  );
  ipcMain.handle("backup:downloadGDrive", (event, data) =>
    backupGDrive.downloadFromGoogleDrive(
      data.credentials,
      data.fileId,
      data.destinationPath,
    ),
  );
  ipcMain.handle("backup:validateGDrive", (event, credentials) =>
    backupGDrive.validateGoogleDriveCredentials(credentials),
  );
  ipcMain.handle("backup:getGDriveAuthUrl", (event, data) =>
    backupGDrive.getAuthUrl(data.clientId, data.clientSecret),
  );
  ipcMain.handle("backup:getGDriveRefreshToken", (event, data) =>
    backupGDrive.getRefreshToken(data.clientId, data.clientSecret, data.code),
  );

  // Backup Scheduler
  ipcMain.handle("backup:startScheduler", () =>
    backupScheduler.startBackupScheduler(),
  );
  ipcMain.handle("backup:stopScheduler", () =>
    backupScheduler.stopBackupScheduler(),
  );
  ipcMain.handle("backup:runManual", () => backupScheduler.runManualBackup());
  ipcMain.handle("backup:getSchedulerStatus", () =>
    backupScheduler.getSchedulerStatus(),
  );

  // Printer
  ipcMain.handle("printer:getPrinters", () => printerModule.getPrinters());
  ipcMain.handle("printer:getDefaultPrinter", () =>
    printerModule.getDefaultPrinter(),
  );
  ipcMain.handle("printer:printTestNormal", (event, printerName) =>
    printerModule.printTestNormal(printerName),
  );

  // PDF Generator
  ipcMain.handle("pdf:generateMembershipPDF", async (event, pdfData) => {
    try {
      const result = await pdfGenerator.generateMembershipPDF(pdfData);
      
      // Intentar imprimir físicamente si está en modo real, pero NO bloquear la apertura si falla
      try {
        const printerMode = (await api.getSetting("printer_mode")) || "test";
        if (printerMode === "real") {
          const normalPrinter = await api.getSetting("normal_printer");
          if (normalPrinter) {
            await printerModule.printPDF(normalPrinter, result);
          }
        }
      } catch (printErr) {
        console.error("Error al intentar imprimir PDF automáticamente:", printErr);
        // Continuamos para que al menos se abra el archivo
      }

      // Siempre intentar abrir el archivo para el usuario
      await shell.openPath(result);
      return result;
    } catch (error) {
      console.error("Error crítico generando PDF de membresía:", error);
      throw error;
    }
  });

  ipcMain.handle("pdf:generateReservationPDF", async (event, reservationData) => {
    try {
      const filepath = await pdfGenerator.generateReservationPDF(reservationData);
      
      const printerMode = (await api.getSetting("printer_mode")) || "test";
      if (printerMode === "real") {
        const normalPrinter = await api.getSetting("normal_printer");
        if (normalPrinter) {
          await printerModule.printPDF(normalPrinter, filepath);
        }
      }

      shell.openPath(filepath);
      return filepath;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle("pdf:generateQuotationPDF", async (event, quotationData) => {
    try {
      const filepath = await pdfGenerator.generateQuotationPDF(quotationData);
      
      const printerMode = (await api.getSetting("printer_mode")) || "test";
      if (printerMode === "real") {
        const normalPrinter = await api.getSetting("normal_printer");
        if (normalPrinter) {
          await printerModule.printPDF(normalPrinter, filepath);
        }
      }

      shell.openPath(filepath);
      return filepath;
    } catch (error) {
      throw error;
    }
  });

  // Supplies
  ipcMain.handle("api:getSupplyCategories", () => api.getSupplyCategories());
  ipcMain.handle("api:createSupplyCategory", (event, data) => api.createSupplyCategory(data.name, data.description));
  ipcMain.handle("api:updateSupplyCategory", (event, data) => api.updateSupplyCategory(data.id, data.name, data.description));
  ipcMain.handle("api:deleteSupplyCategory", (event, id) => api.deleteSupplyCategory(id));
  ipcMain.handle("api:getSupplies", () => api.getSupplies());
  ipcMain.handle("api:createSupply", (event, data) => api.createSupply(data.name, data.category_id, data.stock, data.unit_of_measure, data.min_stock, data.barcode));
  ipcMain.handle("api:updateSupply", (event, data) => api.updateSupply(data.id, data.name, data.category_id, data.stock, data.unit_of_measure, data.min_stock, data.barcode));
  ipcMain.handle("api:deleteSupply", (event, id) => api.deleteSupply(id));
  ipcMain.handle("api:adjustSupplyStock", (event, data) => api.adjustSupplyStock(data.supply_id, data.adjustment_type, data.quantity, data.reason, data.notes, data.created_by));
  ipcMain.handle("api:getSupplyAdjustments", (event, supply_id) => api.getSupplyAdjustments(supply_id));

  // Equipment
  ipcMain.handle("api:getEquipmentCategories", () => api.getEquipmentCategories());
  ipcMain.handle("api:createEquipmentCategory", (event, data) => api.createEquipmentCategory(data.name, data.description));
  ipcMain.handle("api:updateEquipmentCategory", (event, data) => api.updateEquipmentCategory(data.id, data.name, data.description));
  ipcMain.handle("api:deleteEquipmentCategory", (event, id) => api.deleteEquipmentCategory(id));
  ipcMain.handle("api:getEquipment", () => api.getEquipment());
  ipcMain.handle("api:createEquipment", (event, data) => api.createEquipment(data.name, data.category_id, data.quantity, data.status, data.location, data.barcode));
  ipcMain.handle("api:updateEquipment", (event, data) => api.updateEquipment(data.id, data.name, data.category_id, data.quantity, data.status, data.location, data.barcode));
  ipcMain.handle("api:deleteEquipment", (event, id) => api.deleteEquipment(id));
  ipcMain.handle("api:adjustEquipmentStock", (event, data) => api.adjustEquipmentStock(data.equipment_id, data.adjustment_type, data.quantity, data.reason, data.notes, data.created_by));
  ipcMain.handle("api:getEquipmentAdjustments", (event, equipment_id) => api.getEquipmentAdjustments(equipment_id));

  // Utilidades de mantenimiento
  ipcMain.handle("api:fixNegativeCashMovements", () =>
    api.fixNegativeCashMovements(),
  );

  // Reservaciones
  ipcMain.handle("api:createReservation", (event, data) =>
    reservationsApi.createReservation(data),
  );
  ipcMain.handle("api:getAllReservations", () =>
    reservationsApi.getAllReservations(),
  );
  ipcMain.handle(
    "api:getReservationsByDateRange",
    (event, { startDate, endDate }) =>
      reservationsApi.getReservationsByDateRange(startDate, endDate),
  );
  ipcMain.handle("api:getReservationById", (event, id) =>
    reservationsApi.getReservationById(id),
  );
  ipcMain.handle("api:updateReservationStatus", (event, { id, status }) =>
    reservationsApi.updateReservationStatus(id, status),
  );
  ipcMain.handle("api:cancelReservation", (event, id) =>
    reservationsApi.cancelReservation(id),
  );
  ipcMain.handle("api:registerReservationPayment", (event, data) =>
    reservationsApi.registerReservationPayment(
      data.reservationId,
      data.paymentData,
    ),
  );
  ipcMain.handle("api:completeReservation", (event, data) =>
    reservationsApi.completeReservation(data.reservationId, data.paymentData),
  );

  // Cotizaciones
  ipcMain.handle("api:createQuotation", (event, data) =>
    quotationsApi.createQuotation(data),
  );
  ipcMain.handle("api:getAllQuotations", () =>
    quotationsApi.getAllQuotations(),
  );
  ipcMain.handle("api:getQuotationById", (event, id) =>
    quotationsApi.getQuotationById(id),
  );
  ipcMain.handle("api:updateQuotationStatus", (event, { id, status }) =>
    quotationsApi.updateQuotationStatus(id, status),
  );
  ipcMain.handle("api:deleteQuotation", (event, id) =>
    quotationsApi.deleteQuotation(id),
  );
}
