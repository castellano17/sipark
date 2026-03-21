const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
});

contextBridge.exposeInMainWorld("api", {
  // Clients
  getClients: () => ipcRenderer.invoke("api:getClients"),
  createClient: (
    name,
    parentName,
    phone,
    emergencyPhone,
    email,
    childName,
    childAge,
    allergies,
    specialNotes,
  ) =>
    ipcRenderer.invoke("api:createClient", {
      name,
      parentName,
      phone,
      emergencyPhone,
      email,
      childName,
      childAge,
      allergies,
      specialNotes,
    }),
  updateClient: (
    id,
    name,
    parentName,
    phone,
    emergencyPhone,
    email,
    childName,
    childAge,
    allergies,
    specialNotes,
  ) =>
    ipcRenderer.invoke("api:updateClient", {
      id,
      name,
      parentName,
      phone,
      emergencyPhone,
      email,
      childName,
      childAge,
      allergies,
      specialNotes,
    }),
  deleteClient: (id) => ipcRenderer.invoke("api:deleteClient", { id }),
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
  updateSessionPaidStatus: (sessionId, isPaid) =>
    ipcRenderer.invoke("api:updateSessionPaidStatus", { sessionId, isPaid }),

  // Products/Services
  getProductsServices: () => ipcRenderer.invoke("api:getProductsServices"),
  createProductService: (
    name,
    price,
    type,
    category,
    barcode,
    stock,
    durationMinutes,
  ) =>
    ipcRenderer.invoke("api:createProductService", {
      name,
      price,
      type,
      category,
      barcode,
      stock,
      durationMinutes,
    }),
  updateProductService: (
    id,
    name,
    price,
    type,
    category,
    barcode,
    stock,
    durationMinutes,
  ) =>
    ipcRenderer.invoke("api:updateProductService", {
      id,
      name,
      price,
      type,
      category,
      barcode,
      stock,
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
  createSession: (clientName, parentName, phone, packageId, durationMinutes, isPaid) =>
    ipcRenderer.invoke("api:createSession", {
      clientName,
      parentName,
      phone,
      packageId,
      durationMinutes,
      isPaid,
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
  openCashDrawer: (printerName) =>
    ipcRenderer.invoke("api:openCashDrawer", printerName),

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

  // PDF Generation
  exportPDF: (options) => ipcRenderer.invoke("api:exportPDF", options),
  generateOpeningPDF: (cashBoxData) =>
    ipcRenderer.invoke("api:generateOpeningPDF", cashBoxData),
  generateClosingPDF: (closeData) =>
    ipcRenderer.invoke("api:generateClosingPDF", closeData),
  generateDailyCashSummaryPDF: (data) =>
    ipcRenderer.invoke("api:generateDailyCashSummaryPDF", data),

  // Sales with Items
  createSaleWithItems: (saleData) =>
    ipcRenderer.invoke("api:createSaleWithItems", saleData),
  getSaleWithItems: (saleId) =>
    ipcRenderer.invoke("api:getSaleWithItems", saleId),

  // Inventory
  getInventoryProducts: () => ipcRenderer.invoke("api:getInventoryProducts"),
  updateProductStock: (productId, newStock) =>
    ipcRenderer.invoke("api:updateProductStock", { productId, newStock }),
  updateProductCategory: (productId, category) =>
    ipcRenderer.invoke("api:updateProductCategory", { productId, category }),
  adjustProductStock: (productId, adjustment, reason, notes, createdBy) =>
    ipcRenderer.invoke("api:adjustProductStock", {
      productId,
      adjustment,
      reason,
      notes,
      createdBy,
    }),
  getStockAdjustments: (productId, limit) =>
    ipcRenderer.invoke("api:getStockAdjustments", productId, limit),
  getLowStockProducts: (threshold) =>
    ipcRenderer.invoke("api:getLowStockProducts", threshold),

  // Suppliers
  getSuppliers: () => ipcRenderer.invoke("api:getSuppliers"),
  createSupplier: (name, contactName, phone, email, address, notes) =>
    ipcRenderer.invoke("api:createSupplier", {
      name,
      contactName,
      phone,
      email,
      address,
      notes,
    }),
  updateSupplier: (id, name, contactName, phone, email, address, notes) =>
    ipcRenderer.invoke("api:updateSupplier", {
      id,
      name,
      contactName,
      phone,
      email,
      address,
      notes,
    }),
  deleteSupplier: (id) => ipcRenderer.invoke("api:deleteSupplier", { id }),

  // Categories
  getCategories: () => ipcRenderer.invoke("api:getCategories"),
  createCategory: (name, description) =>
    ipcRenderer.invoke("api:createCategory", { name, description }),
  updateCategory: (id, name, description) =>
    ipcRenderer.invoke("api:updateCategory", { id, name, description }),
  deleteCategory: (id) => ipcRenderer.invoke("api:deleteCategory", { id }),

  // Purchase Orders
  createPurchaseOrder: (purchaseData) =>
    ipcRenderer.invoke("api:createPurchaseOrder", purchaseData),
  getPurchaseOrders: (limit) =>
    ipcRenderer.invoke("api:getPurchaseOrders", limit),
  getPurchaseOrderWithItems: (purchaseOrderId) =>
    ipcRenderer.invoke("api:getPurchaseOrderWithItems", purchaseOrderId),

  // Database Cleanup
  clearAllData: () => ipcRenderer.invoke("api:clearAllData"),

  // Memberships
  getMemberships: () => ipcRenderer.invoke("api:getMemberships"),
  createMembership: (name, description, price, durationDays, autoRenew, isActive, totalHours) =>
    ipcRenderer.invoke("api:createMembership", {
      name,
      description,
      price,
      durationDays,
      autoRenew,
      isActive,
      totalHours
    }),
  updateMembership: (id, name, description, price, durationDays, autoRenew, isActive, totalHours) =>
    ipcRenderer.invoke("api:updateMembership", {
      id,
      name,
      description,
      price,
      durationDays,
      autoRenew,
      isActive,
      totalHours
    }),
  deleteMembership: (id) => ipcRenderer.invoke("api:deleteMembership", { id }),

  // Client Memberships
  getClientMemberships: (clientId) =>
    ipcRenderer.invoke("api:getClientMemberships", clientId),
  assignMembership: (clientId, membershipId, paymentAmount, notes, createdBy, phone, id_card, acquisition_date, total_hours) =>
    ipcRenderer.invoke("api:assignMembership", {
      clientId,
      membershipId,
      paymentAmount,
      notes,
      createdBy,
      phone,
      id_card,
      acquisition_date,
      total_hours
    }),
  cancelClientMembership: (id, canceledBy) =>
    ipcRenderer.invoke("api:cancelClientMembership", { id, canceledBy }),
  recordMembershipRenewal: (renewalData) =>
    ipcRenderer.invoke("api:recordMembershipRenewal", renewalData),

  // Client Visits
  getClientVisits: (clientId, limit) =>
    ipcRenderer.invoke("api:getClientVisits", clientId, limit),
  createClientVisit: (
    clientId,
    visitDate,
    checkInTime,
    amountPaid,
    notes,
    createdBy,
  ) =>
    ipcRenderer.invoke("api:createClientVisit", {
      clientId,
      visitDate,
      checkInTime,
      amountPaid,
      notes,
      createdBy,
    }),
  updateClientVisitCheckout: (visitId, checkOutTime, durationMinutes) =>
    ipcRenderer.invoke("api:updateClientVisitCheckout", {
      visitId,
      checkOutTime,
      durationMinutes,
    }),

  // Package Features
  getPackageFeatures: () => ipcRenderer.invoke("api:getPackageFeatures"),
  createPackageFeature: (name, description, category) =>
    ipcRenderer.invoke("api:createPackageFeature", {
      name,
      description,
      category,
    }),
  updatePackageFeature: (id, name, description, category) =>
    ipcRenderer.invoke("api:updatePackageFeature", {
      id,
      name,
      description,
      category,
    }),
  deletePackageFeature: (id) =>
    ipcRenderer.invoke("api:deletePackageFeature", { id }),
  getPackageIncludedFeatures: (packageId) =>
    ipcRenderer.invoke("api:getPackageIncludedFeatures", packageId),
  setPackageFeatures: (packageId, featureIds) =>
    ipcRenderer.invoke("api:setPackageFeatures", { packageId, featureIds }),

  // Package Feature Categories
  getPackageFeatureCategories: () =>
    ipcRenderer.invoke("api:getPackageFeatureCategories"),
  createPackageFeatureCategory: (name, description) =>
    ipcRenderer.invoke("api:createPackageFeatureCategory", {
      name,
      description,
    }),
  updatePackageFeatureCategory: (id, name, description) =>
    ipcRenderer.invoke("api:updatePackageFeatureCategory", {
      id,
      name,
      description,
    }),
  deletePackageFeatureCategory: (id) =>
    ipcRenderer.invoke("api:deletePackageFeatureCategory", { id }),

  // User Management
  createFirstAdmin: () => ipcRenderer.invoke("api:createFirstAdmin"),
  authenticateUser: (username, password) =>
    ipcRenderer.invoke("api:authenticateUser", { username, password }),
  getUsers: () => ipcRenderer.invoke("api:getUsers"),
  getUserById: (userId) => ipcRenderer.invoke("api:getUserById", userId),
  createUser: (userData, createdBy) =>
    ipcRenderer.invoke("api:createUser", { userData, createdBy }),
  updateUser: (userId, userData, updatedBy) =>
    ipcRenderer.invoke("api:updateUser", { userId, userData, updatedBy }),
  changePassword: (userId, newPassword, changedBy) =>
    ipcRenderer.invoke("api:changePassword", {
      userId,
      newPassword,
      changedBy,
    }),
  deleteUser: (userId, deletedBy) =>
    ipcRenderer.invoke("api:deleteUser", { userId, deletedBy }),
  getUserAuditLog: (limit) => ipcRenderer.invoke("api:getUserAuditLog", limit),
  checkPermission: (userId, module, action) =>
    ipcRenderer.invoke("api:checkPermission", { userId, module, action }),

  // File Handlers (Logos)
  saveLogo: (type, base64Data, extension) =>
    ipcRenderer.invoke("file:saveLogo", { type, base64Data, extension }),
  getLogo: (type) => ipcRenderer.invoke("file:getLogo", type),
  deleteLogo: (type) => ipcRenderer.invoke("file:deleteLogo", type),

  // Backup Handlers
  createBackup: () => ipcRenderer.invoke("backup:createLocal"),
  restoreBackup: () => ipcRenderer.invoke("backup:restore"),
  listBackups: () => ipcRenderer.invoke("backup:list"),
  createAutoBackup: () => ipcRenderer.invoke("backup:createAuto"),

  // Email Backup
  sendBackupByEmail: (config) => ipcRenderer.invoke("backup:sendEmail", config),
  validateEmailConfig: (config) =>
    ipcRenderer.invoke("backup:validateEmail", config),

  // Google Drive Backup
  uploadBackupToGDrive: (credentials, folderId) =>
    ipcRenderer.invoke("backup:uploadGDrive", { credentials, folderId }),
  listGDriveBackups: (credentials, folderId) =>
    ipcRenderer.invoke("backup:listGDrive", { credentials, folderId }),
  downloadGDriveBackup: (credentials, fileId, destinationPath) =>
    ipcRenderer.invoke("backup:downloadGDrive", {
      credentials,
      fileId,
      destinationPath,
    }),
  validateGDriveCredentials: (credentials) =>
    ipcRenderer.invoke("backup:validateGDrive", credentials),
  getGDriveAuthUrl: (clientId, clientSecret) =>
    ipcRenderer.invoke("backup:getGDriveAuthUrl", { clientId, clientSecret }),
  getGDriveRefreshToken: (clientId, clientSecret, code) =>
    ipcRenderer.invoke("backup:getGDriveRefreshToken", {
      clientId,
      clientSecret,
      code,
    }),

  // Backup Scheduler
  startBackupScheduler: () => ipcRenderer.invoke("backup:startScheduler"),
  stopBackupScheduler: () => ipcRenderer.invoke("backup:stopScheduler"),
  runManualBackup: () => ipcRenderer.invoke("backup:runManual"),
  getSchedulerStatus: () => ipcRenderer.invoke("backup:getSchedulerStatus"),

  // Printer & PDF
  getPrinters: () => ipcRenderer.invoke("printer:getPrinters"),
  getDefaultPrinter: () => ipcRenderer.invoke("printer:getDefaultPrinter"),
  generateMembershipPDF: (pdfData) =>
    ipcRenderer.invoke("pdf:generateMembershipPDF", pdfData),
  generateReservationPDF: (reservationData) =>
    ipcRenderer.invoke("pdf:generateReservationPDF", reservationData),
  generateQuotationPDF: (quotationData) =>
    ipcRenderer.invoke("pdf:generateQuotationPDF", quotationData),

  // Utilidades de mantenimiento
  fixNegativeCashMovements: () =>
    ipcRenderer.invoke("api:fixNegativeCashMovements"),

  // Reservaciones
  getAllReservations: () => ipcRenderer.invoke("api:getAllReservations"),
  getReservationsByDateRange: (startDate, endDate) =>
    ipcRenderer.invoke("api:getReservationsByDateRange", {
      startDate,
      endDate,
    }),
  getReservationById: (id) => ipcRenderer.invoke("api:getReservationById", id),
  createReservation: (data) =>
    ipcRenderer.invoke("api:createReservation", data),
  updateReservationStatus: (id, status) =>
    ipcRenderer.invoke("api:updateReservationStatus", { id, status }),
  cancelReservation: (id) => ipcRenderer.invoke("api:cancelReservation", id),
  registerReservationPayment: (reservationId, paymentData) =>
    ipcRenderer.invoke("api:registerReservationPayment", {
      reservationId,
      paymentData,
    }),
  completeReservation: (reservationId, paymentData) =>
    ipcRenderer.invoke("api:completeReservation", {
      reservationId,
      paymentData,
    }),

  // Cotizaciones
  createQuotation: (data) => ipcRenderer.invoke("api:createQuotation", data),
  getAllQuotations: () => ipcRenderer.invoke("api:getAllQuotations"),
  getQuotationById: (id) => ipcRenderer.invoke("api:getQuotationById", id),
  updateQuotationStatus: (id, status) =>
    ipcRenderer.invoke("api:updateQuotationStatus", { id, status }),
  deleteQuotation: (id) => ipcRenderer.invoke("api:deleteQuotation", id),
});
