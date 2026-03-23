const invokeHttp = async (channel: string, payload?: any, ...extraArgs: any[]) => {
  const host = window.location.hostname;
  const port = window.location.port ? ":" + window.location.port : '';
  const prop = channel.replace('api:', '').replace('file:', '').replace('backup:', '').replace('printer:', '').replace('pdf:', '');
  
  // payload could be a dictionary or a primitive
  // Sometimes in preload.cjs it maps to multiple arguments:
  let args = [];
  if (payload !== undefined) args.push(payload);
  if (extraArgs.length > 0) args.push(...extraArgs);

  try {
    const response = await fetch(`http://${host}${port}/api/rpc/${prop}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args })
    });
    
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || 'Network error');
    }
    return json.data;
  } catch (e: any) {
    console.error(`API Fallback Error (${channel}):`, e);
    throw e;
  }
};

export const apiFallback = {
  // Clients
  getClients: () => invokeHttp("api:getClients"),
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
    invokeHttp("api:createClient", {
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
    invokeHttp("api:updateClient", {
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
  deleteClient: (id) => invokeHttp("api:deleteClient", { id }),
  getClientById: (clientId) =>
    invokeHttp("api:getClientById", clientId),

  // Sessions
  startSession: (clientId, packageId, durationMinutes) =>
    invokeHttp("api:startSession", {
      clientId,
      packageId,
      durationMinutes,
    }),
  getActiveSessions: () => invokeHttp("api:getActiveSessions"),
  endSession: (sessionId, finalPrice) =>
    invokeHttp("api:endSession", { sessionId, finalPrice }),
  updateSessionPaidStatus: (sessionId, isPaid) =>
    invokeHttp("api:updateSessionPaidStatus", { sessionId, isPaid }),

  // Products/Services
  getProductsServices: () => invokeHttp("api:getProductsServices"),
  createProductService: (
    name,
    price,
    type,
    category,
    barcode,
    stock,
    durationMinutes,
  ) =>
    invokeHttp("api:createProductService", {
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
    invokeHttp("api:updateProductService", {
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
    invokeHttp("api:deleteProductService", { id }),

  // Sales
  getSales: (limit) => invokeHttp("api:getSales", limit),

  // Stats
  getDailyStats: () => invokeHttp("api:getDailyStats"),
  getExecutiveDashboard: () => invokeHttp("api:getExecutiveDashboard"),

  // Reports
  getSalesByPeriod: (startDate, endDate, paymentMethod) =>
    invokeHttp("api:getSalesByPeriod", {
      startDate,
      endDate,
      paymentMethod,
    }),
  getCashBoxReport: (cashBoxId) =>
    invokeHttp("api:getCashBoxReport", cashBoxId),
  getCashBoxes: () => invokeHttp("api:getCashBoxes"),
  getStockReport: (categoryFilter, lowStockOnly) =>
    invokeHttp("api:getStockReport", { categoryFilter, lowStockOnly }),
  getTopClientsReport: (startDate, endDate, limit) =>
    invokeHttp("api:getTopClientsReport", {
      startDate,
      endDate,
      limit,
    }),

  // Reports - Fase 2
  getSalesByProduct: (startDate, endDate, categoryFilter) =>
    invokeHttp("api:getSalesByProduct", {
      startDate,
      endDate,
      categoryFilter,
    }),
  getCashFlowReport: (startDate, endDate) =>
    invokeHttp("api:getCashFlowReport", { startDate, endDate }),
  getInventoryMovements: (startDate, endDate, productFilter) =>
    invokeHttp("api:getInventoryMovements", {
      startDate,
      endDate,
      productFilter,
    }),
  getPurchasesByPeriod: (startDate, endDate, supplierFilter) =>
    invokeHttp("api:getPurchasesByPeriod", {
      startDate,
      endDate,
      supplierFilter,
    }),
  getSessionsByPeriod: (startDate, endDate, packageFilter) =>
    invokeHttp("api:getSessionsByPeriod", {
      startDate,
      endDate,
      packageFilter,
    }),

  // Reports - Fase 3
  getSalesByPaymentMethod: (startDate, endDate) =>
    invokeHttp("api:getSalesByPaymentMethod", { startDate, endDate }),
  getSalesByHour: (startDate, endDate) =>
    invokeHttp("api:getSalesByHour", { startDate, endDate }),
  getProductsWithoutMovement: (days) =>
    invokeHttp("api:getProductsWithoutMovement", { days }),
  getPurchasesBySupplier: (startDate, endDate) =>
    invokeHttp("api:getPurchasesBySupplier", { startDate, endDate }),
  getFrequentClients: (startDate, endDate, minVisits) =>
    invokeHttp("api:getFrequentClients", {
      startDate,
      endDate,
      minVisits,
    }),
  getInactiveClients: (days) =>
    invokeHttp("api:getInactiveClients", { days }),

  // Reports - Fase 3 Adicionales
  getSalesByClient: (startDate, endDate, limit) =>
    invokeHttp("api:getSalesByClient", { startDate, endDate, limit }),
  getSalesComparison: (period1Start, period1End, period2Start, period2End) =>
    invokeHttp("api:getSalesComparison", {
      period1Start,
      period1End,
      period2Start,
      period2End,
    }),
  getIncomeVsExpenses: (startDate, endDate) =>
    invokeHttp("api:getIncomeVsExpenses", { startDate, endDate }),
  getInventoryValuation: (categoryFilter) =>
    invokeHttp("api:getInventoryValuation", { categoryFilter }),
  getActiveClients: (days) =>
    invokeHttp("api:getActiveClients", { days }),
  getNewClients: (startDate, endDate) =>
    invokeHttp("api:getNewClients", { startDate, endDate }),
  getBestSellingPackages: (startDate, endDate) =>
    invokeHttp("api:getBestSellingPackages", { startDate, endDate }),
  getAverageSessionDuration: (startDate, endDate, packageFilter) =>
    invokeHttp("api:getAverageSessionDuration", {
      startDate,
      endDate,
      packageFilter,
    }),
  getHourlyOccupancy: (startDate, endDate) =>
    invokeHttp("api:getHourlyOccupancy", { startDate, endDate }),
  getActiveMemberships: (statusFilter) =>
    invokeHttp("api:getActiveMemberships", { statusFilter }),
  getExpiringMemberships: (daysThreshold) =>
    invokeHttp("api:getExpiringMemberships", { daysThreshold }),
  getSessionsHistory: (startDate, endDate, clientId, status) =>
    invokeHttp("api:getSessionsHistory", {
      startDate,
      endDate,
      clientId,
      status,
    }),
  getDiscountsReport: (startDate, endDate, minDiscount, maxDiscount) =>
    invokeHttp("api:getDiscountsReport", {
      startDate,
      endDate,
      minDiscount,
      maxDiscount,
    }),
  getDailyCashSummary: (date) =>
    invokeHttp("api:getDailyCashSummary", date),
  getUserActivityReport: (startDate, endDate, userId, actionType) =>
    invokeHttp("api:getUserActivityReport", {
      startDate,
      endDate,
      userId,
      actionType,
    }),
  getInventoryChangesReport: (startDate, endDate, userId, productId) =>
    invokeHttp("api:getInventoryChangesReport", {
      startDate,
      endDate,
      userId,
      productId,
    }),
  getSystemAccessReport: (startDate, endDate, userId) =>
    invokeHttp("api:getSystemAccessReport", {
      startDate,
      endDate,
      userId,
    }),
  getPriceChangesReport: (startDate, endDate, productId) =>
    invokeHttp("api:getPriceChangesReport", {
      startDate,
      endDate,
      productId,
    }),
  getSalesAuditReport: (startDate, endDate, userId, action) =>
    invokeHttp("api:getSalesAuditReport", {
      startDate,
      endDate,
      userId,
      action,
    }),
  getMostPurchasedProducts: (startDate, endDate, limit) =>
    invokeHttp("api:getMostPurchasedProducts", {
      startDate,
      endDate,
      limit,
    }),
  getPurchaseOrdersHistory: (startDate, endDate, supplierId) =>
    invokeHttp("api:getPurchaseOrdersHistory", {
      startDate,
      endDate,
      supplierId,
    }),

  // Settings
  getSetting: (key) => invokeHttp("api:getSetting", key),
  setSetting: (key, value) =>
    invokeHttp("api:setSetting", { key, value }),
  getAllSettings: () => invokeHttp("api:getAllSettings"),

  // Sessions - Check-in
  createSession: (clientName, parentName, phone, packageId, durationMinutes, isPaid) =>
    invokeHttp("api:createSession", {
      clientName,
      parentName,
      phone,
      packageId,
      durationMinutes,
      isPaid,
    }),
  startTimerSession: (sessionId) =>
    invokeHttp("api:startTimerSession", sessionId),

  // Health Check
  checkDatabaseConnection: () =>
    invokeHttp("api:checkDatabaseConnection"),

  // Customer Display
  broadcastToCustomer: (payload: any) => invokeHttp("api:broadcastToCustomer", payload),
  toggleAdsWindow: (hidden: boolean) => invokeHttp("api:toggleAdsWindow", hidden),
  getAdFiles: () => invokeHttp("api:getAdFiles"),
  onCustomerEvent: (callback: any) => {
    // En Web no recibimos IPC, solo hacemos stub (o podríamos usar WebSockets en su momento)
    return () => {};
  },

  // Printers
  getPrinters: () => invokeHttp("api:getPrinters"),
  getDefaultPrinter: () => invokeHttp("api:getDefaultPrinter"),
  printTestTicket: (printerName) =>
    invokeHttp("api:printTestTicket", printerName),
  openCashDrawer: (printerName) =>
    invokeHttp("api:openCashDrawer", printerName),
  printTicket: (printerName, content) =>
    invokeHttp("api:printTicket", printerName, content),
  printHtmlSilent: (htmlContent) =>
    invokeHttp("api:printHtmlSilent", htmlContent),

  // Cash Box
  openCashBox: (openingAmount, openedBy) =>
    invokeHttp("api:openCashBox", { openingAmount, openedBy }),
  getActiveCashBox: () => invokeHttp("api:getActiveCashBox"),
  closeCashBox: (cashBoxId, closingAmount, closedBy, notes) =>
    invokeHttp("api:closeCashBox", {
      cashBoxId,
      closingAmount,
      closedBy,
      notes,
    }),
  addCashMovement: (cashBoxId, type, amount, description) =>
    invokeHttp("api:addCashMovement", {
      cashBoxId,
      type,
      amount,
      description,
    }),
  getCashBoxMovements: (cashBoxId) =>
    invokeHttp("api:getCashBoxMovements", cashBoxId),
  getCashBoxSales: (cashBoxId) =>
    invokeHttp("api:getCashBoxSales", cashBoxId),

  // PDF Generation
  exportPDF: (options) => invokeHttp("api:exportPDF", options),
  generateOpeningPDF: (cashBoxData) =>
    invokeHttp("api:generateOpeningPDF", cashBoxData),
  generateClosingPDF: (closeData) =>
    invokeHttp("api:generateClosingPDF", closeData),
  generateDailyCashSummaryPDF: (data) =>
    invokeHttp("api:generateDailyCashSummaryPDF", data),

  // Sales with Items
  createSaleWithItems: (saleData) =>
    invokeHttp("api:createSaleWithItems", saleData),
  getSaleWithItems: (saleId) =>
    invokeHttp("api:getSaleWithItems", saleId),

  // Inventory
  getInventoryProducts: () => invokeHttp("api:getInventoryProducts"),
  updateProductStock: (productId, newStock) =>
    invokeHttp("api:updateProductStock", { productId, newStock }),
  updateProductCategory: (productId, category) =>
    invokeHttp("api:updateProductCategory", { productId, category }),
  adjustProductStock: (productId, adjustment, reason, notes, createdBy) =>
    invokeHttp("api:adjustProductStock", {
      productId,
      adjustment,
      reason,
      notes,
      createdBy,
    }),
  getStockAdjustments: (productId, limit) =>
    invokeHttp("api:getStockAdjustments", productId, limit),
  getLowStockProducts: (threshold) =>
    invokeHttp("api:getLowStockProducts", threshold),

  // Suppliers
  getSuppliers: () => invokeHttp("api:getSuppliers"),
  createSupplier: (name, contactName, phone, email, address, notes) =>
    invokeHttp("api:createSupplier", {
      name,
      contactName,
      phone,
      email,
      address,
      notes,
    }),
  updateSupplier: (id, name, contactName, phone, email, address, notes) =>
    invokeHttp("api:updateSupplier", {
      id,
      name,
      contactName,
      phone,
      email,
      address,
      notes,
    }),
  deleteSupplier: (id) => invokeHttp("api:deleteSupplier", { id }),

  // Categories
  getCategories: () => invokeHttp("api:getCategories"),
  createCategory: (name, description) =>
    invokeHttp("api:createCategory", { name, description }),
  updateCategory: (id, name, description) =>
    invokeHttp("api:updateCategory", { id, name, description }),
  deleteCategory: (id) => invokeHttp("api:deleteCategory", { id }),

  // Purchase Orders
  createPurchaseOrder: (purchaseData) =>
    invokeHttp("api:createPurchaseOrder", purchaseData),
  getPurchaseOrders: (limit) =>
    invokeHttp("api:getPurchaseOrders", limit),
  getPurchaseOrderWithItems: (purchaseOrderId) =>
    invokeHttp("api:getPurchaseOrderWithItems", purchaseOrderId),

  // Database Cleanup
  clearAllData: () => invokeHttp("api:clearAllData"),

  // Memberships
  getMemberships: () => invokeHttp("api:getMemberships"),
  createMembership: (name, description, price, durationDays, autoRenew, isActive, totalHours) =>
    invokeHttp("api:createMembership", {
      name,
      description,
      price,
      durationDays,
      autoRenew,
      isActive,
      totalHours
    }),
  updateMembership: (id, name, description, price, durationDays, autoRenew, isActive, totalHours) =>
    invokeHttp("api:updateMembership", {
      id,
      name,
      description,
      price,
      durationDays,
      autoRenew,
      isActive,
      totalHours
    }),
  deleteMembership: (id) => invokeHttp("api:deleteMembership", { id }),

  // Client Memberships
  getClientMemberships: (clientId) =>
    invokeHttp("api:getClientMemberships", clientId),
  assignMembership: (clientId, membershipId, paymentAmount, notes, createdBy, phone, id_card, acquisition_date, total_hours) =>
    invokeHttp("api:assignMembership", {
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
    invokeHttp("api:cancelClientMembership", { id, canceledBy }),
  recordMembershipRenewal: (renewalData) =>
    invokeHttp("api:recordMembershipRenewal", renewalData),

  // Client Visits
  getClientVisits: (clientId, limit) =>
    invokeHttp("api:getClientVisits", clientId, limit),
  createClientVisit: (
    clientId,
    visitDate,
    checkInTime,
    amountPaid,
    notes,
    createdBy,
  ) =>
    invokeHttp("api:createClientVisit", {
      clientId,
      visitDate,
      checkInTime,
      amountPaid,
      notes,
      createdBy,
    }),
  updateClientVisitCheckout: (visitId, checkOutTime, durationMinutes) =>
    invokeHttp("api:updateClientVisitCheckout", {
      visitId,
      checkOutTime,
      durationMinutes,
    }),

  // Package Features
  getPackageFeatures: () => invokeHttp("api:getPackageFeatures"),
  createPackageFeature: (name, description, category, requires_quantity) =>
    invokeHttp("api:createPackageFeature", {
      name,
      description,
      category,
      requires_quantity,
    }),
  updatePackageFeature: (id, name, description, category, requires_quantity) =>
    invokeHttp("api:updatePackageFeature", {
      id,
      name,
      description,
      category,
      requires_quantity,
    }),
  deletePackageFeature: (id) =>
    invokeHttp("api:deletePackageFeature", { id }),
  getPackageIncludedFeatures: (packageId) =>
    invokeHttp("api:getPackageIncludedFeatures", packageId),
  setPackageFeatures: (packageId, featureIds) =>
    invokeHttp("api:setPackageFeatures", { packageId, featureIds }),

  // Package Feature Categories
  getPackageFeatureCategories: () =>
    invokeHttp("api:getPackageFeatureCategories"),
  createPackageFeatureCategory: (name, description) =>
    invokeHttp("api:createPackageFeatureCategory", {
      name,
      description,
    }),
  updatePackageFeatureCategory: (id, name, description) =>
    invokeHttp("api:updatePackageFeatureCategory", {
      id,
      name,
      description,
    }),
  deletePackageFeatureCategory: (id) =>
    invokeHttp("api:deletePackageFeatureCategory", { id }),

  // User Management
  createFirstAdmin: () => invokeHttp("api:createFirstAdmin"),
  authenticateUser: (username, password) =>
    invokeHttp("api:authenticateUser", { username, password }),
  getUsers: () => invokeHttp("api:getUsers"),
  getUserById: (userId) => invokeHttp("api:getUserById", userId),
  createUser: (userData, createdBy) =>
    invokeHttp("api:createUser", { userData, createdBy }),
  updateUser: (userId, userData, updatedBy) =>
    invokeHttp("api:updateUser", { userId, userData, updatedBy }),
  changePassword: (userId, newPassword, changedBy) =>
    invokeHttp("api:changePassword", {
      userId,
      newPassword,
      changedBy,
    }),
  deleteUser: (userId, deletedBy) =>
    invokeHttp("api:deleteUser", { userId, deletedBy }),
  getUserAuditLog: (limit) => invokeHttp("api:getUserAuditLog", limit),
  checkPermission: (userId, module, action) =>
    invokeHttp("api:checkPermission", { userId, module, action }),

  // NFC
  getNfcCardByUid: (uid) => invokeHttp("api:getNfcCardByUid", uid),
  assignNfcCard: (data) => invokeHttp("api:assignNfcCard", data),
  rechargeNfcCard: (data) => invokeHttp("api:rechargeNfcCard", data),
  chargeNfcEntry: (data) => invokeHttp("api:chargeNfcEntry", data),
  refundNfcCard: (data) => invokeHttp("api:refundNfcCard", data),
  getNfcTransactions: (clientMembershipId) => 
    invokeHttp("api:getNfcTransactions", clientMembershipId),

  // Promotions
  createCampaign: (data) => invokeHttp("api:createCampaign", data),
  getCampaigns: (status) => invokeHttp("api:getCampaigns", status),
  getCampaignById: (id) => invokeHttp("api:getCampaignById", id),
  updateCampaignStatus: (id, status) => invokeHttp("api:updateCampaignStatus", { id, status }),
  getVoucherByCode: (code) => invokeHttp("api:getVoucherByCode", code),
  redeemVoucher: (data) => invokeHttp("api:redeemVoucher", data),
  getVoucherRedemptions: (campaignId) => invokeHttp("api:getVoucherRedemptions", campaignId),
  deactivateVoucher: (voucherId) => invokeHttp("api:deactivateVoucher", voucherId),
  getVouchersForPrint: (campaignId, voucherIds) => invokeHttp("api:getVouchersForPrint", { campaignId, voucherIds }),
  getBusinessSettings: () => invokeHttp("api:getBusinessSettings"),

  // File Handlers (Logos)
  saveLogo: (type, base64Data, extension) =>
    invokeHttp("file:saveLogo", { type, base64Data, extension }),
  getLogo: (type) => invokeHttp("file:getLogo", type),
  deleteLogo: (type) => invokeHttp("file:deleteLogo", type),

  // Backup Handlers
  createBackup: () => invokeHttp("backup:createLocal"),
  restoreBackup: () => invokeHttp("backup:restore"),
  listBackups: () => invokeHttp("backup:list"),
  createAutoBackup: () => invokeHttp("backup:createAuto"),

  // Email Backup
  sendBackupByEmail: (config) => invokeHttp("backup:sendEmail", config),
  validateEmailConfig: (config) =>
    invokeHttp("backup:validateEmail", config),

  // Google Drive Backup
  uploadBackupToGDrive: (credentials, folderId) =>
    invokeHttp("backup:uploadGDrive", { credentials, folderId }),
  listGDriveBackups: (credentials, folderId) =>
    invokeHttp("backup:listGDrive", { credentials, folderId }),
  downloadGDriveBackup: (credentials, fileId, destinationPath) =>
    invokeHttp("backup:downloadGDrive", {
      credentials,
      fileId,
      destinationPath,
    }),
  validateGDriveCredentials: (credentials) =>
    invokeHttp("backup:validateGDrive", credentials),
  getGDriveAuthUrl: (clientId, clientSecret) =>
    invokeHttp("backup:getGDriveAuthUrl", { clientId, clientSecret }),
  getGDriveRefreshToken: (clientId, clientSecret, code) =>
    invokeHttp("backup:getGDriveRefreshToken", {
      clientId,
      clientSecret,
      code,
    }),

  // Backup Scheduler
  startBackupScheduler: () => invokeHttp("backup:startScheduler"),
  stopBackupScheduler: () => invokeHttp("backup:stopScheduler"),
  runManualBackup: () => invokeHttp("backup:runManual"),
  getSchedulerStatus: () => invokeHttp("backup:getSchedulerStatus"),

  // Printer & PDF
  generateMembershipPDF: (pdfData) =>
    invokeHttp("pdf:generateMembershipPDF", pdfData),
  generateReservationPDF: (reservationData) =>
    invokeHttp("pdf:generateReservationPDF", reservationData),
  generateQuotationPDF: (quotationData) =>
    invokeHttp("pdf:generateQuotationPDF", quotationData),

  // Supplies
  getSupplyCategories: () => invokeHttp("api:getSupplyCategories"),
  createSupplyCategory: (name, description) => invokeHttp("api:createSupplyCategory", { name, description }),
  updateSupplyCategory: (id, name, description) => invokeHttp("api:updateSupplyCategory", { id, name, description }),
  deleteSupplyCategory: (id) => invokeHttp("api:deleteSupplyCategory", id),
  getSupplies: () => invokeHttp("api:getSupplies"),
  createSupply: (name, category_id, stock, unit_of_measure, min_stock, barcode) => invokeHttp("api:createSupply", { name, category_id, stock, unit_of_measure, min_stock, barcode }),
  updateSupply: (id, name, category_id, stock, unit_of_measure, min_stock, barcode) => invokeHttp("api:updateSupply", { id, name, category_id, stock, unit_of_measure, min_stock, barcode }),
  deleteSupply: (id) => invokeHttp("api:deleteSupply", id),
  adjustSupplyStock: (supply_id, adjustment_type, quantity, reason, notes, created_by) => invokeHttp("api:adjustSupplyStock", { supply_id, adjustment_type, quantity, reason, notes, created_by }),
  getSupplyAdjustments: (supply_id) => invokeHttp("api:getSupplyAdjustments", supply_id),

  // Equipment
  getEquipmentCategories: () => invokeHttp("api:getEquipmentCategories"),
  createEquipmentCategory: (name, description) => invokeHttp("api:createEquipmentCategory", { name, description }),
  updateEquipmentCategory: (id, name, description) => invokeHttp("api:updateEquipmentCategory", { id, name, description }),
  deleteEquipmentCategory: (id) => invokeHttp("api:deleteEquipmentCategory", id),
  getEquipment: () => invokeHttp("api:getEquipment"),
  createEquipment: (name, category_id, quantity, status, location, barcode) => invokeHttp("api:createEquipment", { name, category_id, quantity, status, location, barcode }),
  updateEquipment: (id, name, category_id, quantity, status, location, barcode) => invokeHttp("api:updateEquipment", { id, name, category_id, quantity, status, location, barcode }),
  deleteEquipment: (id) => invokeHttp("api:deleteEquipment", id),
  adjustEquipmentStock: (equipment_id, adjustment_type, quantity, reason, notes, created_by) => invokeHttp("api:adjustEquipmentStock", { equipment_id, adjustment_type, quantity, reason, notes, created_by }),
  getEquipmentAdjustments: (equipment_id) => invokeHttp("api:getEquipmentAdjustments", equipment_id),

  // Utilidades de mantenimiento
  fixNegativeCashMovements: () =>
    invokeHttp("api:fixNegativeCashMovements"),

  // Reservaciones
  getAllReservations: () => invokeHttp("api:getAllReservations"),
  getReservationsByDateRange: (startDate, endDate) =>
    invokeHttp("api:getReservationsByDateRange", {
      startDate,
      endDate,
    }),
  getReservationById: (id) => invokeHttp("api:getReservationById", id),
  createReservation: (data) =>
    invokeHttp("api:createReservation", data),
  updateReservationStatus: (id, status) =>
    invokeHttp("api:updateReservationStatus", { id, status }),
  cancelReservation: (id) => invokeHttp("api:cancelReservation", id),
  registerReservationPayment: (reservationId, paymentData) =>
    invokeHttp("api:registerReservationPayment", {
      reservationId,
      paymentData,
    }),
  completeReservation: (reservationId, paymentData) =>
    invokeHttp("api:completeReservation", {
      reservationId,
      paymentData,
    }),

  // Cotizaciones
  createQuotation: (data) => invokeHttp("api:createQuotation", data),
  getAllQuotations: () => invokeHttp("api:getAllQuotations"),
  getQuotationById: (id) => invokeHttp("api:getQuotationById", id),
  updateQuotationStatus: (id, status) =>
    invokeHttp("api:updateQuotationStatus", { id, status }),
  deleteQuotation: (id) => invokeHttp("api:deleteQuotation", id),

  // Waiter Orders (POS Mesero)
  createWaiterOrder: (orderData) =>
    invokeHttp("api:createWaiterOrder", orderData),
  getPendingWaiterOrders: () =>
    invokeHttp("api:getPendingWaiterOrders"),
  updateWaiterOrderStatus: (data) =>
    invokeHttp("api:updateWaiterOrderStatus", data),
  deleteWaiterOrder: (orderId) =>
    invokeHttp("api:deleteWaiterOrder", orderId),
};
