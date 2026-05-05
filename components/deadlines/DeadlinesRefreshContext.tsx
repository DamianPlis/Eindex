"use client";

import {
  createContext,
  useContext,
  useMemo,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

type DeadlinesRefreshContextValue = {
  isRefreshing: boolean;
  refreshDeadlines: () => void;
};

const DeadlinesRefreshContext =
  createContext<DeadlinesRefreshContextValue | null>(null);

export function DeadlinesRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const value = useMemo(
    () => ({
      isRefreshing: isPending,
      refreshDeadlines() {
        startTransition(() => {
          router.refresh();
        });
      },
    }),
    [isPending, router],
  );

  return (
    <DeadlinesRefreshContext.Provider value={value}>
      {children}
    </DeadlinesRefreshContext.Provider>
  );
}

export function useDeadlinesRefresh() {
  const context = useContext(DeadlinesRefreshContext);
  if (!context) {
    return {
      isRefreshing: false,
      refreshDeadlines: () => {},
    };
  }
  return context;
}
