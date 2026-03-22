// Global type definitions for window.api
type AppApi = {
  // Clients
  getClients: () => Promise<any[]>;
  createClient: (
    name: string,
    parentName: string | null,
    phone: string | null,
    childName: string | null,
    childAge: number | null,
    allergies: string | null,
    specialNotes: string | null,
  ) => Promise<number>;
  updateClient: (
    id: number,
    name: string,
    parentName: string | null,
    phone: string | null,
    childName: string | null,
    childAge: number | null,
    allergies: string | null,
    specialNotes: string | null,
  ) => Promise<boolean>;
  deleteClient: (id: number) => Promise<boolean>;
  getClientById: (clientId: number) => Promise<any>;

  // Memberships
  getMemberships: () => Promise<any[]>;
  createMembership: (membershipData: any) => Promise<number>;
  updateMembership: (id: number, membershipData: any) => Promise<boolean>;
  deleteMembership: (id: number) => Promise<boolean>;

  // Client Memberships
  getClientMemberships: (clientId: number) => Promise<any[]>;
  assignMembership: (
    clientId: number,
    membershipId: number,
    paymentAmount: number,
    notes: string,
    createdBy: string | number | null,
    phone?: string,
    id_card?: string,
    acquisition_date?: string,
    total_hours?: string,
  ) => Promise<number>;
  cancelClientMembership: (id: number, canceledBy: string) => Promise<boolean>;
  recordMembershipRenewal: (renewalData: any) => Promise<number>;

  // Client Visits
  getClientVisits: (clientId: number, limit?: number) => Promise<any[]>;
  createClientVisit: (
    clientId: number,
    visitDate: string,
    checkInTime: string,
    amountPaid: number,
    notes: string,
    createdBy: string,
  ) => Promise<number>;
  updateClientVisitCheckout: (
    visitId: number,
    checkOutTime: string,
    durationMinutes: number,
  ) => Promise<boolean>;

  // PDF Generation
  generateOpeningPDF: (cashBoxData: any) => Promise<string>;
  generateClosingPDF: (closeData: any) => Promise<string>;
  generateMembershipPDF: (pdfData: any) => Promise<boolean>;
  generateQuotationPDF: (data: any) => Promise<any>;
  generateReservationPDF: (data: any) => Promise<any>;
  exportPDF: (options: any) => Promise<any>;

  // Products & Services
  getProductsServices: () => Promise<any[]>;
  createProductService: (name: string, price: number, type: string, category: string | null, barcode: string | null, stock: number | null, durationMinutes: number | null) => Promise<any>;
  updateProductService: (id: number, name: string, price: number, type: string, category: string | null, barcode: string | null, stock: number | null, durationMinutes: number | null) => Promise<any>;
  deleteProductService: (id: number) => Promise<any>;

  // Categories
  getCategories: () => Promise<any[]>;
  createCategory: (name: string, description: string, type?: string) => Promise<any>;
  updateCategory: (id: number, name: string, description: string, type?: string) => Promise<any>;
  deleteCategory: (id: number) => Promise<any>;

  // Supplies
  getSupplyCategories: () => Promise<any[]>;
  createSupplyCategory: (name: string, description?: string) => Promise<any>;
  updateSupplyCategory: (id: number, name: string, description?: string) => Promise<any>;
  deleteSupplyCategory: (id: number) => Promise<any>;
  getSupplies: () => Promise<any[]>;
  createSupply: (name: string, category_id: number | null, stock: number, unit_of_measure: string, min_stock: number, barcode?: string) => Promise<any>;
  updateSupply: (id: number, name: string, category_id: number | null, stock: number, unit_of_measure: string, min_stock: number, barcode?: string) => Promise<any>;
  deleteSupply: (id: number) => Promise<any>;
  adjustSupplyStock: (supply_id: number, adjustment_type: string, quantity: number, reason: string, notes: string, created_by: number | null) => Promise<any>;
  getSupplyAdjustments: (supply_id: number) => Promise<any[]>;

  // Equipment
  getEquipmentCategories: () => Promise<any[]>;
  createEquipmentCategory: (name: string, description?: string) => Promise<any>;
  updateEquipmentCategory: (id: number, name: string, description?: string) => Promise<any>;
  deleteEquipmentCategory: (id: number) => Promise<any>;
  getEquipment: () => Promise<any[]>;
  createEquipment: (name: string, category_id: number | null, quantity: number, status: string, location: string, barcode?: string) => Promise<any>;
  updateEquipment: (id: number, name: string, category_id: number | null, quantity: number, status: string, location: string, barcode?: string) => Promise<any>;
  deleteEquipment: (id: number) => Promise<any>;
  adjustEquipmentStock: (equipment_id: number, adjustment_type: string, quantity: number, reason: string, notes: string, created_by: number | null) => Promise<any>;
  getEquipmentAdjustments: (equipment_id: number) => Promise<any[]>;

  // Quotations
  getAllQuotations: () => Promise<any>;
  createQuotation: (data: any) => Promise<any>;
  getQuotationById: (id: number) => Promise<any>;
  updateQuotationStatus: (id: number, status: string) => Promise<any>;
  deleteQuotation: (id: number) => Promise<any>;

  // Reservations
  createReservation: (data: any) => Promise<any>;
  getAllReservations: () => Promise<any>;
  getReservationsByDateRange: (startDate: string, endDate: string) => Promise<any>;
  getReservationById: (id: number) => Promise<any>;
  updateReservationStatus: (id: number, status: string) => Promise<any>;
  cancelReservation: (id: number) => Promise<any>;
  registerReservationPayment: (data: any) => Promise<any>;
  completeReservation: (data: any) => Promise<any>;
  generateReservationPDF: (data: any) => Promise<any>;

  // Reports
  getExecutiveDashboard: () => Promise<any>;
  getSalesByPeriod: (
    startDate: string,
    endDate: string,
    paymentMethod: string | null,
  ) => Promise<any>;
  getCashBoxReport: (cashBoxId: number) => Promise<any>;
  getCashBoxes: () => Promise<any[]>;
  getStockReport: (categoryFilter: string | null, lowStockOnly: boolean) => Promise<any>;
  getTopClientsReport: (startDate: string, endDate: string, limit: number) => Promise<any>;
  getSalesByProduct: (startDate: string, endDate: string, categoryFilter: string | null) => Promise<any>;
  getCashFlowReport: (startDate: string, endDate: string) => Promise<any>;
  getInventoryMovements: (startDate: string, endDate: string, productFilter: number | null) => Promise<any>;
  getPurchasesByPeriod: (startDate: string, endDate: string, supplierFilter: number | null) => Promise<any>;
  getSessionsByPeriod: (startDate: string, endDate: string, packageFilter: number | null) => Promise<any>;
  getSalesByPaymentMethod: (startDate: string, endDate: string) => Promise<any>;
  getSalesByHour: (startDate: string, endDate: string) => Promise<any>;
  getProductsWithoutMovement: (days: number) => Promise<any>;
  getPurchasesBySupplier: (startDate: string, endDate: string) => Promise<any>;
  getFrequentClients: (startDate: string, endDate: string, minVisits: number) => Promise<any>;
  getInactiveClients: (days: number) => Promise<any>;
  getSalesByClient: (startDate: string, endDate: string, limit: number) => Promise<any>;
  getSalesComparison: (period1Start: string, period1End: string, period2Start: string, period2End: string) => Promise<any>;
  getIncomeVsExpenses: (startDate: string, endDate: string) => Promise<any>;
  getInventoryValuation: (categoryFilter: number | null) => Promise<any>;
  getActiveClients: (days: number) => Promise<any>;
  getNewClients: (startDate: string, endDate: string) => Promise<any>;
  getBestSellingPackages: (startDate: string, endDate: string) => Promise<any>;
  getAverageSessionDuration: (startDate: string, endDate: string, packageFilter: number | null) => Promise<any>;
  getHourlyOccupancy: (startDate: string, endDate: string) => Promise<any>;
  getActiveMemberships: (statusFilter: string) => Promise<any>;
  getExpiringMemberships: (daysThreshold: number) => Promise<any>;
  getSessionsHistory: (startDate: string, endDate: string, clientId: number | null, status: string) => Promise<any>;
  getDiscountsReport: (startDate: string, endDate: string, minDiscount: number, maxDiscount: number | null) => Promise<any>;
  getDailyCashSummary: (date: string) => Promise<any>;
  getUserActivityReport: (startDate: string, endDate: string, userId: number | null, actionType: string | null) => Promise<any>;
  getInventoryChangesReport: (startDate: string, endDate: string, userId: string | null, productId: number | null) => Promise<any>;
  getSystemAccessReport: (startDate: string, endDate: string, userId: number | null) => Promise<any>;
  getPriceChangesReport: (startDate: string, endDate: string, productId: number | null) => Promise<any>;
  getSalesAuditReport: (startDate: string, endDate: string, userId: number | null, action: string | null) => Promise<any>;
  getMostPurchasedProducts: (startDate: string, endDate: string, limit: number) => Promise<any>;
  getPurchaseOrdersHistory: (startDate: string, endDate: string, supplierId: number | null) => Promise<any>;

  // Printer
  getPrinters: () => Promise<any[]>;
  getDefaultPrinter: () => Promise<any>;
  printTestTicket: (printerName: string) => Promise<boolean>;
  printTicket: (printerName: string, text: string) => Promise<boolean>;
  openCashDrawer: (data: {
    printerName: string;
    userId: number;
    reason?: string;
  }) => Promise<boolean>;

  // Sessions / Timing
  startSession: (clientId: number, packageId: number, durationMinutes: number) => Promise<any>;
  createSession: (clientName: string, parentName: string, phone: string, packageId: number, durationMinutes: number, isPaid?: boolean) => Promise<any>;
  getActiveSessions: () => Promise<any[]>;
  endSession: (sessionId: number, totalAmount: number) => Promise<any>;
  startTimerSession: (sessionId: number) => Promise<boolean>;
  updateSessionPaidStatus: (sessionId: number, isPaid: boolean) => Promise<boolean>;
  checkDatabaseConnection: () => Promise<{ connected: boolean; message: string }>;
  getActiveCashBox: () => Promise<any>;

  // Settings
  getSetting: (key: string) => Promise<any>;
  setSetting: (data: { key: string; value: any }) => Promise<any>;
  getAllSettings: () => Promise<any>;
  getLogo: (type: string) => Promise<string | null>;
  saveLogo: (type: string, base64: string, extension: string) => Promise<boolean>;
  deleteLogo: (type: string) => Promise<boolean>;
} & Record<string, (...args: any[]) => Promise<any>>;

declare global {
  interface Window {
    api: AppApi;
  }
}

export {};
