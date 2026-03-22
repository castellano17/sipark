import { useState, useCallback } from "react";

declare global {
  interface Window {
    api: {
      openCashBox: (openingAmount: number, openedBy: string) => Promise<number>;
      getActiveCashBox: () => Promise<any>;
      closeCashBox: (
        cashBoxId: number,
        closingAmount: number,
        closedBy: string,
        notes: string,
      ) => Promise<any>;
      addCashMovement: (
        cashBoxId: number,
        type: string,
        amount: number,
        description: string,
      ) => Promise<number>;
      getCashBoxMovements: (cashBoxId: number) => Promise<any[]>;
      getCashBoxSales: (cashBoxId: number) => Promise<any[]>;
      createSaleWithItems: (saleData: any) => Promise<number>;
      getSaleWithItems: (saleId: number) => Promise<any>;
      getInventoryProducts: () => Promise<any[]>;
      updateProductStock: (
        productId: number,
        newStock: number,
      ) => Promise<boolean>;
      updateProductCategory: (
        productId: number,
        category: string,
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
    };
  }
}

export function useCashBox() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any) => {
    const message = err instanceof Error ? err.message : "Error desconocido";
    setError(message);
  }, []);

  const openCashBox = useCallback(
    async (openingAmount: number, openedBy: string = "Admin") => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.openCashBox(openingAmount, openedBy);
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

  const getActiveCashBox = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.api.getActiveCashBox();
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const closeCashBox = useCallback(
    async (
      cashBoxId: number,
      closingAmount: number,
      closedBy: string = "Admin",
      notes: string = "",
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.closeCashBox(
          cashBoxId,
          closingAmount,
          closedBy,
          notes,
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

  const addCashMovement = useCallback(
    async (
      cashBoxId: number,
      type: string,
      amount: number,
      description: string,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.addCashMovement(
          cashBoxId,
          type,
          amount,
          description,
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

  const getCashBoxMovements = useCallback(
    async (cashBoxId: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.getCashBoxMovements(cashBoxId);
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

  const getCashBoxSales = useCallback(
    async (cashBoxId: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.getCashBoxSales(cashBoxId);
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

  const createSaleWithItems = useCallback(
    async (saleData: any) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.createSaleWithItems(saleData);
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

  const getSaleWithItems = useCallback(
    async (saleId: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.getSaleWithItems(saleId);
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

  return {
    loading,
    error,
    openCashBox,
    getActiveCashBox,
    closeCashBox,
    addCashMovement,
    getCashBoxMovements,
    getCashBoxSales,
    createSaleWithItems,
    getSaleWithItems,
  };
}
