import React, { createContext, useContext, useEffect, useState } from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: "KES", symbol: "Ksh", name: "Kenyan Shilling" },
  { code: "USD", symbol: "$",   name: "US Dollar" },
  { code: "EUR", symbol: "€",   name: "Euro" },
  { code: "GBP", symbol: "£",   name: "British Pound" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling" },
  { code: "ZAR", symbol: "R",   name: "South African Rand" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "INR", symbol: "₹",   name: "Indian Rupee" },
];

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Convert a KES amount to the selected currency and format it */
  formatPrice: (kes: number) => string;
  rates: Record<string, number>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
  const [rates, setRates] = useState<Record<string, number>>({ KES: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("https://open.er-api.com/v6/latest/KES")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) setRates({ KES: 1, ...data.rates });
      })
      .catch(() => {
        // silently fall back to KES-only
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (kes: number): string => {
    const rate = rates[currency.code] ?? 1;
    const converted = kes * rate;
    const formatted =
      currency.code === "KES" || currency.code === "TZS" || currency.code === "UGX"
        ? Math.round(converted).toLocaleString()
        : converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency.symbol} ${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, rates, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
