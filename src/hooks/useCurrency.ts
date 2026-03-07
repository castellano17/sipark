import { useState, useEffect } from "react";
import { useDatabase } from "./useDatabase";

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: Record<string, CurrencyConfig> = {
  NIO: {
    code: "NIO",
    symbol: "C$",
    name: "Córdoba Nicaragüense",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "Dólar Estadounidense",
  },
};

export function useCurrency() {
  const { getSetting } = useDatabase();
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES.USD);
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencyConfig();
  }, []);

  const loadCurrencyConfig = async () => {
    try {
      setLoading(true);
      const currencyCode = await getSetting("currency_primary");
      const rate = await getSetting("exchange_rate");

      if (currencyCode && CURRENCIES[currencyCode]) {
        setCurrency(CURRENCIES[currencyCode]);
      }

      if (rate) {
        setExchangeRate(parseFloat(rate));
      }
    } catch (error) {
      console.error("Error cargando configuración de moneda:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string): string => {
    // Convertir a número si es string (PostgreSQL devuelve DECIMAL como string)
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return `${currency.symbol}0.00`;
    }

    return `${currency.symbol}${numAmount.toFixed(2)}`;
  };

  const formatCurrencyWithCode = (amount: number | string): string => {
    // Convertir a número si es string (PostgreSQL devuelve DECIMAL como string)
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return `${currency.symbol}0.00 ${currency.code}`;
    }

    return `${currency.symbol}${numAmount.toFixed(2)} ${currency.code}`;
  };

  const convertFromUSD = (amountUSD: number): number => {
    if (currency.code === "USD") {
      return amountUSD;
    }
    return amountUSD * exchangeRate;
  };

  const convertToUSD = (amount: number): number => {
    if (currency.code === "USD") {
      return amount;
    }
    return amount / exchangeRate;
  };

  return {
    currency,
    exchangeRate,
    loading,
    formatCurrency,
    formatCurrencyWithCode,
    convertFromUSD,
    convertToUSD,
    symbol: currency.symbol,
    code: currency.code,
    name: currency.name,
  };
}
