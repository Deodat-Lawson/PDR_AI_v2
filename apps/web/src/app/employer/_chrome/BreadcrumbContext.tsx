"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Breadcrumbs = readonly string[];

interface BreadcrumbContextValue {
  breadcrumbs: Breadcrumbs;
  setBreadcrumbs: (crumbs: Breadcrumbs) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

const DEFAULT_CRUMBS: Breadcrumbs = ["Drift"];

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumbs>(DEFAULT_CRUMBS);
  const value = useMemo(() => ({ breadcrumbs, setBreadcrumbs }), [breadcrumbs]);
  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs(): Breadcrumbs {
  const ctx = useContext(BreadcrumbContext);
  return ctx?.breadcrumbs ?? DEFAULT_CRUMBS;
}

/**
 * Page-level hook: pushes the given crumbs into the shared topbar while the
 * caller is mounted. Resets to the default trail on unmount so subsequent
 * pages don't inherit a stale tail.
 */
export function useSetBreadcrumbs(crumbs: Breadcrumbs) {
  const ctx = useContext(BreadcrumbContext);
  const setBreadcrumbs = ctx?.setBreadcrumbs;

  // Memoise the array identity so consumers can pass inline literals safely.
  const stable = useMemo(() => crumbs, [crumbs.join("")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!setBreadcrumbs) return;
    setBreadcrumbs(stable);
    return () => setBreadcrumbs(DEFAULT_CRUMBS);
  }, [setBreadcrumbs, stable]);

  return useCallback(
    (next: Breadcrumbs) => setBreadcrumbs?.(next),
    [setBreadcrumbs],
  );
}
