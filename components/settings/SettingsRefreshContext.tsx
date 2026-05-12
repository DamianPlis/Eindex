"use client";

import {
  createContext,
  useContext,
  useMemo,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

type SettingsRefreshContextValue = {
  isRefreshing: boolean;
  refreshSettings: () => void;
};

const SettingsRefreshContext =
  createContext<SettingsRefreshContextValue | null>(null);

export function SettingsRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const value = useMemo(
    () => ({
      isRefreshing: isPending,
      refreshSettings() {
        startTransition(() => {
          router.refresh();
        });
      },
    }),
    [isPending, router],
  );

  return (
    <SettingsRefreshContext.Provider value={value}>
      {children}
    </SettingsRefreshContext.Provider>
  );
}

export function useSettingsRefresh() {
  const context = useContext(SettingsRefreshContext);
  if (!context) {
    return {
      isRefreshing: false,
      refreshSettings: () => {},
    };
  }
  return context;
}
