const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
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

// Hot reload en desarrollo
if (isDev) {
  try {
    require("electron-reloader")(module);
  } catch (_) {
    // Ignorar si electron-reloader no está disponible en producción
  }
}

let mainWindow;

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
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // En producción, cargar desde dist
  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "dist", "index.html")}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
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

function setupIpcHandlers() {
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
  ipcMain.handle("api:printTicket", (event, printerName, content) =>
    printerModule.printTicket(printerName, content),
  );
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
      data.benefits,
    ),
  );
  ipcMain.handle("api:updateMembership", (event, data) =>
    api.updateMembership(
      data.id,
      data.name,
      data.description,
      data.price,
      data.durationDays,
      data.benefits,
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

  // PDF Generator
  ipcMain.handle("pdf:generateMembershipPDF", async (event, pdfData) => {
    try {
      const result = await pdfGenerator.generateMembershipPDF(pdfData);
      // Abrir el archivo desde el proceso principal para máxima compatibilidad con macOS
      shell.openPath(result);
      return result;
    } catch (error) {
      throw error;
    }
  });
  ipcMain.handle(
    "pdf:generateReservationPDF",
    async (event, reservationData) => {
      const filepath =
        await pdfGenerator.generateReservationPDF(reservationData);
      shell.openPath(filepath);
      return filepath;
    },
  );
  ipcMain.handle("pdf:generateQuotationPDF", async (event, quotationData) => {
    const filepath = await pdfGenerator.generateQuotationPDF(quotationData);
    shell.openPath(filepath);
    return filepath;
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
