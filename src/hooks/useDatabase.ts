import { useState, useCallback } from "react";

declare global {
  interface Window {
    api: {
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
      startSession: (
        clientId: number,
        packageId?: number,
        durationMinutes?: number,
      ) => Promise<any>;
      getActiveSessions: () => Promise<any[]>;
      endSession: (sessionId: number, finalPrice: number) => Promise<any>;
      getProductsServices: () => Promise<any[]>;
      createProductService: (
        name: string,
        price: number,
        type: string,
        durationMinutes?: number,
      ) => Promise<number>;
      updateProductService: (
        id: number,
        name: string,
        price: number,
        type: string,
        category?: string | null,
        barcode?: string | null,
        stock?: number | null,
        durationMinutes?: number | null,
      ) => Promise<void>;
      deleteProductService: (id: number) => Promise<void>;
      getSales: (limit?: number) => Promise<any[]>;
      getDailyStats: () => Promise<any>;
      getSetting: (key: string) => Promise<string | null>;
      setSetting: (key: string, value: string) => Promise<string>;
      getAllSettings: () => Promise<any[]>;
      createSession: (
        clientName: string,
        parentName: string,
        phone: string,
        packageId: number,
        durationMinutes: number,
      ) => Promise<any>;
      checkDatabaseConnection: () => Promise<{
        connected: boolean;
        message: string;
      }>;
      getInventoryProducts: () => Promise<any[]>;
      updateProductStock: (
        productId: number,
        newStock: number,
      ) => Promise<boolean>;
      adjustProductStock: (
        productId: number,
        adjustment: number,
        reason: string,
        notes?: string,
        createdBy?: string,
      ) => Promise<any>;
      getStockAdjustments: (
        productId?: number,
        limit?: number,
      ) => Promise<any[]>;
      getLowStockProducts: (threshold?: number) => Promise<any[]>;
      getSaleWithItems: (saleId: number) => Promise<any>;
      getSuppliers: () => Promise<any[]>;
      createSupplier: (
        name: string,
        contactName: string,
        phone: string,
        email: string,
        address: string,
        notes: string,
      ) => Promise<number>;
      updateSupplier: (
        id: number,
        name: string,
        contactName: string,
        phone: string,
        email: string,
        address: string,
        notes: string,
      ) => Promise<boolean>;
      deleteSupplier: (id: number) => Promise<boolean>;
      getCategories: () => Promise<any[]>;
      createCategory: (name: string, description: string) => Promise<number>;
      updateCategory: (
        id: number,
        name: string,
        description: string,
      ) => Promise<boolean>;
      deleteCategory: (id: number) => Promise<boolean>;
      createPurchaseOrder: (purchaseData: any) => Promise<number>;
      getPurchaseOrders: (limit?: number) => Promise<any[]>;
      getPurchaseOrderWithItems: (purchaseOrderId: number) => Promise<any>;
      getPrinters: () => Promise<any[]>;
      getDefaultPrinter: () => Promise<any>;
      printTestTicket: (printerName: string) => Promise<boolean>;
      updateProductCategory: (
        productId: number,
        category: string,
      ) => Promise<boolean>;
      getMemberships: () => Promise<any[]>;
      createMembership: (
        name: string,
        description: string,
        price: number,
        durationDays: number,
        benefits: string,
      ) => Promise<number>;
      updateMembership: (
        id: number,
        name: string,
        description: string,
        price: number,
        durationDays: number,
        benefits: string,
      ) => Promise<boolean>;
      deleteMembership: (id: number) => Promise<boolean>;
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
      getActiveMemberships: (statusFilter: string) => Promise<any>;
    };
  }
}

export function useDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any) => {
    const message = err instanceof Error ? err.message : "Error desconocido";
    setError(message);
    console.error("Database error:", message);
  }, []);

  const getClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.api.getClients();
      return result;
    } catch (err) {
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createClient = useCallback(
    async (
      name: string,
      parentName?: string,
      phone?: string,
      photoPath?: string,
      isMember?: boolean,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.createClient(
          name,
          parentName,
          phone,
          photoPath,
          isMember,
        );
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const startSession = useCallback(
    async (clientId: number, packageId?: number, durationMinutes?: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.startSession(
          clientId,
          packageId,
          durationMinutes,
        );
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const getActiveSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.api.getActiveSessions();
      return result;
    } catch (err) {
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const endSession = useCallback(
    async (sessionId: number, finalPrice: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.endSession(sessionId, finalPrice);
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const getProductsServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.api.getProductsServices();
      return result;
    } catch (err) {
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getSales = useCallback(
    async (limit?: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.getSales(limit);
        return result;
      } catch (err) {
        handleError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const getDailyStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.api.getDailyStats();
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getSetting = useCallback(
    async (key: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.getSetting(key);
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const setSetting = useCallback(
    async (key: string, value: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.setSetting(key, value);
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const getAllSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.api.getAllSettings();
      return result;
    } catch (err) {
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createSession = useCallback(
    async (
      clientName: string,
      parentName: string,
      phone: string,
      packageId: number,
      durationMinutes: number,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.createSession(
          clientName,
          parentName,
          phone,
          packageId,
          durationMinutes,
        );
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const createProductService = useCallback(
    async (
      name: string,
      price: number,
      type: string,
      durationMinutes?: number,
      category?: string,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.createProductService(
          name,
          price,
          type,
          category || null,
          null, // barcode
          null, // stock
          durationMinutes,
        );
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const updateProductService = useCallback(
    async (
      id: number,
      name: string,
      price: number,
      type: string,
      durationMinutes?: number,
      category?: string,
    ) => {
      try {
        setLoading(true);
        setError(null);
        await window.api.updateProductService(
          id,
          name,
          price,
          type,
          category || null,
          null, // barcode
          null, // stock
          durationMinutes,
        );
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const deleteProductService = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);
        await window.api.deleteProductService(id);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const checkDatabaseConnection = useCallback(async () => {
    try {
      const result = await window.api.checkDatabaseConnection();
      return result;
    } catch (err) {
      console.error("Error verificando conexión:", err);
      return { connected: false, message: "Error de conexión" };
    }
  }, []);

  return {
    loading,
    error,
    getClients,
    createClient,
    startSession,
    getActiveSessions,
    endSession,
    getProductsServices,
    getSales,
    getDailyStats,
    getSetting,
    setSetting,
    getAllSettings,
    createSession,
    createProductService,
    updateProductService,
    deleteProductService,
    checkDatabaseConnection,
  };
}
