// Global type definitions for window.api
declare global {
  interface Window {
    api: {
      // Clients
      getClients: () => Promise<any[]>;
      createClient: (
        name: string,
        parentName: string | null,
        phone: string,
        emergencyPhone: string | null,
        email: string | null,
        childName: string | null,
        childAge: number | null,
        allergies: string | null,
        specialNotes: string | null,
      ) => Promise<number>;
      updateClient: (
        id: number,
        name: string,
        parentName: string | null,
        phone: string,
        emergencyPhone: string | null,
        email: string | null,
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
        createdBy: string,
      ) => Promise<number>;
      cancelClientMembership: (
        id: number,
        canceledBy: string,
      ) => Promise<boolean>;
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

      // Reports
      getExecutiveDashboard: () => Promise<any>;
      getSalesByPeriod: (
        startDate: string,
        endDate: string,
        paymentMethod: string | null,
      ) => Promise<any>;
      getCashBoxReport: (cashBoxId: number) => Promise<any>;
      getCashBoxes: () => Promise<any[]>;
      getStockReport: (
        categoryFilter: string | null,
        lowStockOnly: boolean,
      ) => Promise<any>;
      getTopClientsReport: (
        startDate: string,
        endDate: string,
        limit: number,
      ) => Promise<any>;

      // Reports - Fase 2
      getSalesByProduct: (
        startDate: string,
        endDate: string,
        categoryFilter: string | null,
      ) => Promise<any>;
      getCashFlowReport: (startDate: string, endDate: string) => Promise<any>;
      getInventoryMovements: (
        startDate: string,
        endDate: string,
        productFilter: number | null,
      ) => Promise<any>;
      getPurchasesByPeriod: (
        startDate: string,
        endDate: string,
        supplierFilter: number | null,
      ) => Promise<any>;
      getSessionsByPeriod: (
        startDate: string,
        endDate: string,
        packageFilter: number | null,
      ) => Promise<any>;

      // Reports - Fase 3
      getSalesByPaymentMethod: (
        startDate: string,
        endDate: string,
      ) => Promise<any>;
      getSalesByHour: (startDate: string, endDate: string) => Promise<any>;
      getProductsWithoutMovement: (days: number) => Promise<any>;
      getPurchasesBySupplier: (
        startDate: string,
        endDate: string,
      ) => Promise<any>;
      getFrequentClients: (
        startDate: string,
        endDate: string,
        minVisits: number,
      ) => Promise<any>;
      getInactiveClients: (days: number) => Promise<any>;

      // Reports - Fase 3 Adicionales
      getSalesByClient: (
        startDate: string,
        endDate: string,
        limit: number,
      ) => Promise<any>;
      getSalesComparison: (
        period1Start: string,
        period1End: string,
        period2Start: string,
        period2End: string,
      ) => Promise<any>;
      getIncomeVsExpenses: (startDate: string, endDate: string) => Promise<any>;
      getInventoryValuation: (categoryFilter: number | null) => Promise<any>;
      getActiveClients: (days: number) => Promise<any>;
      getNewClients: (startDate: string, endDate: string) => Promise<any>;
      getBestSellingPackages: (
        startDate: string,
        endDate: string,
      ) => Promise<any>;
      getAverageSessionDuration: (
        startDate: string,
        endDate: string,
        packageFilter: number | null,
      ) => Promise<any>;
      getHourlyOccupancy: (startDate: string, endDate: string) => Promise<any>;
      getActiveMemberships: (statusFilter: string) => Promise<any>;
      getExpiringMemberships: (daysThreshold: number) => Promise<any>;
      getSessionsHistory: (
        startDate: string,
        endDate: string,
        clientId: number | null,
        status: string,
      ) => Promise<any>;
      getDiscountsReport: (
        startDate: string,
        endDate: string,
        minDiscount: number,
        maxDiscount: number | null,
      ) => Promise<any>;
      getDailyCashSummary: (date: string) => Promise<any>;
      getUserActivityReport: (
        startDate: string,
        endDate: string,
        userId: number | null,
        actionType: string | null,
      ) => Promise<any>;
      getInventoryChangesReport: (
        startDate: string,
        endDate: string,
        userId: string | null,
        productId: number | null,
      ) => Promise<any>;
      getSystemAccessReport: (
        startDate: string,
        endDate: string,
        userId: number | null,
      ) => Promise<any>;
      getPriceChangesReport: (
        startDate: string,
        endDate: string,
        productId: number | null,
      ) => Promise<any>;
      getSalesAuditReport: (
        startDate: string,
        endDate: string,
        userId: number | null,
        action: string | null,
      ) => Promise<any>;
      getMostPurchasedProducts: (
        startDate: string,
        endDate: string,
        limit: number,
      ) => Promise<any>;
      getPurchaseOrdersHistory: (
        startDate: string,
        endDate: string,
        supplierId: number | null,
      ) => Promise<any>;

      // Printer & PDF
      getPrinters: () => Promise<any[]>;
      getDefaultPrinter: () => Promise<any>;
      generateMembershipPDF: (pdfData: any) => Promise<boolean>;

      // Other APIs (abbreviated - full list in useDatabase.ts)
      [key: string]: any;
    };
  }
}

export {};
