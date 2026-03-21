import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
});

contextBridge.exposeInMainWorld("api", {
  // Clients
  getClients: () => ipcRenderer.invoke("api:getClients"),
  createClient: (name, parentName, phone, photoPath, isMember) =>
    ipcRenderer.invoke("api:createClient", {
      name,
      parentName,
      phone,
      photoPath,
      isMember,
    }),
  getClientById: (clientId) =>
    ipcRenderer.invoke("api:getClientById", clientId),

  // Sessions
  startSession: (clientId, packageId, durationMinutes) =>
    ipcRenderer.invoke("api:startSession", {
      clientId,
      packageId,
      durationMinutes,
    }),
  getActiveSessions: () => ipcRenderer.invoke("api:getActiveSessions"),
  endSession: (sessionId, finalPrice) =>
    ipcRenderer.invoke("api:endSession", { sessionId, finalPrice }),

  // Products/Services
  getProductsServices: () => ipcRenderer.invoke("api:getProductsServices"),
  createProductService: (name, price, type, durationMinutes) =>
    ipcRenderer.invoke("api:createProductService", {
      name,
      price,
      type,
      durationMinutes,
    }),
  updateProductService: (id, name, price, type, durationMinutes) =>
    ipcRenderer.invoke("api:updateProductService", {
      id,
      name,
      price,
      type,
      durationMinutes,
    }),
  deleteProductService: (id) =>
    ipcRenderer.invoke("api:deleteProductService", { id }),

  // Sales
  getSales: (limit) => ipcRenderer.invoke("api:getSales", limit),

  // Stats
  getDailyStats: () => ipcRenderer.invoke("api:getDailyStats"),
  getExecutiveDashboard: () => ipcRenderer.invoke("api:getExecutiveDashboard"),

  // Reports
  getSalesByPeriod: (startDate, endDate, paymentMethod) =>
    ipcRenderer.invoke("api:getSalesByPeriod", {
      startDate,
      endDate,
      paymentMethod,
    }),
  getCashBoxReport: (cashBoxId) =>
    ipcRenderer.invoke("api:getCashBoxReport", cashBoxId),
  getCashBoxes: () => ipcRenderer.invoke("api:getCashBoxes"),
  getStockReport: (categoryFilter, lowStockOnly) =>
    ipcRenderer.invoke("api:getStockReport", { categoryFilter, lowStockOnly }),
  getTopClientsReport: (startDate, endDate, limit) =>
    ipcRenderer.invoke("api:getTopClientsReport", {
      startDate,
      endDate,
      limit,
    }),

  // Reports - Fase 2
  getSalesByProduct: (startDate, endDate, categoryFilter) =>
    ipcRenderer.invoke("api:getSalesByProduct", {
      startDate,
      endDate,
      categoryFilter,
    }),
  getCashFlowReport: (startDate, endDate) =>
    ipcRenderer.invoke("api:getCashFlowReport", { startDate, endDate }),
  getInventoryMovements: (startDate, endDate, productFilter) =>
    ipcRenderer.invoke("api:getInventoryMovements", {
      startDate,
      endDate,
      productFilter,
    }),
  getPurchasesByPeriod: (startDate, endDate, supplierFilter) =>
    ipcRenderer.invoke("api:getPurchasesByPeriod", {
      startDate,
      endDate,
      supplierFilter,
    }),
  getSessionsByPeriod: (startDate, endDate, packageFilter) =>
    ipcRenderer.invoke("api:getSessionsByPeriod", {
      startDate,
      endDate,
      packageFilter,
    }),

  // Reports - Fase 3
  getSalesByPaymentMethod: (startDate, endDate) =>
    ipcRenderer.invoke("api:getSalesByPaymentMethod", { startDate, endDate }),
  getSalesByHour: (startDate, endDate) =>
    ipcRenderer.invoke("api:getSalesByHour", { startDate, endDate }),
  getProductsWithoutMovement: (days) =>
    ipcRenderer.invoke("api:getProductsWithoutMovement", { days }),
  getPurchasesBySupplier: (startDate, endDate) =>
    ipcRenderer.invoke("api:getPurchasesBySupplier", { startDate, endDate }),
  getFrequentClients: (startDate, endDate, minVisits) =>
    ipcRenderer.invoke("api:getFrequentClients", {
      startDate,
      endDate,
      minVisits,
    }),
  getInactiveClients: (days) =>
    ipcRenderer.invoke("api:getInactiveClients", { days }),

  // Reports - Fase 3 Adicionales
  getSalesByClient: (startDate, endDate, limit) =>
    ipcRenderer.invoke("api:getSalesByClient", { startDate, endDate, limit }),
  getSalesComparison: (period1Start, period1End, period2Start, period2End) =>
    ipcRenderer.invoke("api:getSalesComparison", {
      period1Start,
      period1End,
      period2Start,
      period2End,
    }),
  getIncomeVsExpenses: (startDate, endDate) =>
    ipcRenderer.invoke("api:getIncomeVsExpenses", { startDate, endDate }),
  getInventoryValuation: (categoryFilter) =>
    ipcRenderer.invoke("api:getInventoryValuation", { categoryFilter }),
  getActiveClients: (days) =>
    ipcRenderer.invoke("api:getActiveClients", { days }),
  getNewClients: (startDate, endDate) =>
    ipcRenderer.invoke("api:getNewClients", { startDate, endDate }),
  getBestSellingPackages: (startDate, endDate) =>
    ipcRenderer.invoke("api:getBestSellingPackages", { startDate, endDate }),
  getAverageSessionDuration: (startDate, endDate, packageFilter) =>
    ipcRenderer.invoke("api:getAverageSessionDuration", {
      startDate,
      endDate,
      packageFilter,
    }),
  getHourlyOccupancy: (startDate, endDate) =>
    ipcRenderer.invoke("api:getHourlyOccupancy", { startDate, endDate }),
  getActiveMemberships: (statusFilter) =>
    ipcRenderer.invoke("api:getActiveMemberships", { statusFilter }),
  getExpiringMemberships: (daysThreshold) =>
    ipcRenderer.invoke("api:getExpiringMemberships", { daysThreshold }),
  getSessionsHistory: (startDate, endDate, clientId, status) =>
    ipcRenderer.invoke("api:getSessionsHistory", {
      startDate,
      endDate,
      clientId,
      status,
    }),
  getDiscountsReport: (startDate, endDate, minDiscount, maxDiscount) =>
    ipcRenderer.invoke("api:getDiscountsReport", {
      startDate,
      endDate,
      minDiscount,
      maxDiscount,
    }),
  getDailyCashSummary: (date) =>
    ipcRenderer.invoke("api:getDailyCashSummary", date),
  getUserActivityReport: (startDate, endDate, userId, actionType) =>
    ipcRenderer.invoke("api:getUserActivityReport", {
      startDate,
      endDate,
      userId,
      actionType,
    }),
  getInventoryChangesReport: (startDate, endDate, userId, productId) =>
    ipcRenderer.invoke("api:getInventoryChangesReport", {
      startDate,
      endDate,
      userId,
      productId,
    }),
  getSystemAccessReport: (startDate, endDate, userId) =>
    ipcRenderer.invoke("api:getSystemAccessReport", {
      startDate,
      endDate,
      userId,
    }),
  getPriceChangesReport: (startDate, endDate, productId) =>
    ipcRenderer.invoke("api:getPriceChangesReport", {
      startDate,
      endDate,
      productId,
    }),
  getSalesAuditReport: (startDate, endDate, userId, action) =>
    ipcRenderer.invoke("api:getSalesAuditReport", {
      startDate,
      endDate,
      userId,
      action,
    }),
  getMostPurchasedProducts: (startDate, endDate, limit) =>
    ipcRenderer.invoke("api:getMostPurchasedProducts", {
      startDate,
      endDate,
      limit,
    }),
  getPurchaseOrdersHistory: (startDate, endDate, supplierId) =>
    ipcRenderer.invoke("api:getPurchaseOrdersHistory", {
      startDate,
      endDate,
      supplierId,
    }),

  // Settings
  getSetting: (key) => ipcRenderer.invoke("api:getSetting", key),
  setSetting: (key, value) =>
    ipcRenderer.invoke("api:setSetting", { key, value }),
  getAllSettings: () => ipcRenderer.invoke("api:getAllSettings"),

  // Sessions - Check-in
  createSession: (clientName, parentName, phone, packageId, durationMinutes) =>
    ipcRenderer.invoke("api:createSession", {
      clientName,
      parentName,
      phone,
      packageId,
      durationMinutes,
    }),
  startTimerSession: (sessionId) =>
    ipcRenderer.invoke("api:startTimerSession", sessionId),

  // Health Check
  checkDatabaseConnection: () =>
    ipcRenderer.invoke("api:checkDatabaseConnection"),

  // Printers
  getPrinters: () => ipcRenderer.invoke("api:getPrinters"),
  getDefaultPrinter: () => ipcRenderer.invoke("api:getDefaultPrinter"),
  printTestTicket: (printerName) =>
    ipcRenderer.invoke("api:printTestTicket", printerName),

  // Cash Box
  openCashBox: (openingAmount, openedBy) =>
    ipcRenderer.invoke("api:openCashBox", { openingAmount, openedBy }),
  getActiveCashBox: () => ipcRenderer.invoke("api:getActiveCashBox"),
  closeCashBox: (cashBoxId, closingAmount, closedBy, notes) =>
    ipcRenderer.invoke("api:closeCashBox", {
      cashBoxId,
      closingAmount,
      closedBy,
      notes,
    }),
  addCashMovement: (cashBoxId, type, amount, description) =>
    ipcRenderer.invoke("api:addCashMovement", {
      cashBoxId,
      type,
      amount,
      description,
    }),
  getCashBoxMovements: (cashBoxId) =>
    ipcRenderer.invoke("api:getCashBoxMovements", cashBoxId),
  getCashBoxSales: (cashBoxId) =>
    ipcRenderer.invoke("api:getCashBoxSales", cashBoxId),

  // Sales with Items
  createSaleWithItems: (saleData) =>
    ipcRenderer.invoke("api:createSaleWithItems", saleData),
  getSaleWithItems: (saleId) =>
    ipcRenderer.invoke("api:getSaleWithItems", saleId),

  // Printer & PDF
  getPrinters: () => ipcRenderer.invoke("printer:getPrinters"),
  getDefaultPrinter: () => ipcRenderer.invoke("printer:getDefaultPrinter"),
  generateMembershipPDF: (pdfData) =>
    ipcRenderer.invoke("pdf:generateMembershipPDF", pdfData),
});
