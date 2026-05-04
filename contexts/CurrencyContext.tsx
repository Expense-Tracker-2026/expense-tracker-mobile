import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'preferred-currency';
const DEFAULT_CURRENCY = 'AUD';

interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  formatCurrency: n => new Intl.NumberFormat('en-AU', { style: 'currency', currency: DEFAULT_CURRENCY }).format(n),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then(saved => {
      if (saved) setCurrencyState(saved);
    });
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    SecureStore.setItemAsync(STORAGE_KEY, code);
  }, []);

  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount),
    [currency],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
