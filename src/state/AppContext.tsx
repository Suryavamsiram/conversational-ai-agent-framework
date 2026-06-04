import { createContext, useContext } from 'react';
import { useAppState } from './appStore';

type AppStoreType = ReturnType<typeof useAppState>;

const AppContext = createContext<AppStoreType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useAppState();
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useApp(): AppStoreType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
